// ============================================
// TASKLYN — PayPal Webhook handler
// ============================================
import { NextRequest, NextResponse } from "next/server";
import {
  getPayPalSubscription,
  getSubscriptionByPayPalId,
  updateSubscriptionStatus,
  createInvoiceFromSale,
  activateUserPlan,
  getServerUser,
  verifyPayPalWebhook,
} from "@/lib/paypal/subscriptions";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/admin";

function mapPayPalStatus(status: string): string {
  switch (status) {
    case "APPROVAL_PENDING":
      return "APPROVAL_PENDING";
    case "ACTIVE":
      return "ACTIVE";
    case "SUSPENDED":
      return "SUSPENDED";
    case "CANCELLED":
      return "CANCELLED";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return "PAYMENT_FAILED";
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers: Record<string, string | null> = {
      "paypal-auth-algo": request.headers.get("paypal-auth-algo"),
      "paypal-cert-url": request.headers.get("paypal-cert-url"),
      "paypal-transmission-id": request.headers.get("paypal-transmission-id"),
      "paypal-transmission-sig": request.headers.get("paypal-transmission-sig"),
      "paypal-transmission-time": request.headers.get(
        "paypal-transmission-time",
      ),
    };

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (process.env.PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyPayPalWebhook(headers, rawBody);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 },
        );
      }
    } else {
      console.warn(
        "PAYPAL_WEBHOOK_ID not set. Skipping signature verification.",
      );
    }

    const eventType = event.event_type as string;
    const resource = (event.resource as Record<string, unknown>) || {};
    const subscriptionId = (resource.id as string) || "";
    const planId = (resource.plan_id as string) || "";

    const subRecord = await getSubscriptionByPayPalId(subscriptionId);

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        if (!subRecord) {
          // Could be a subscription created outside our flow (rare)
          console.warn("Subscription not found in Firestore:", subscriptionId);
          break;
        }
        await updateSubscriptionStatus(subRecord.id, "ACTIVE", {
          startDate: resource.start_time as string,
          nextBillingDate:
            (resource.billing_info as { next_billing_time?: string })
              ?.next_billing_time || null,
        });
        await activateUserPlan(subRecord.userId, subRecord.planId);
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        if (subRecord) {
          await updateSubscriptionStatus(subRecord.id, "SUSPENDED");
        }
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        if (subRecord) {
          await updateSubscriptionStatus(subRecord.id, "CANCELLED", {
            cancelledAt: FieldValue.serverTimestamp() as unknown as string,
          });
          if (!adminDb) throw new Error("Firebase Admin not initialized");
          const userRef = adminDb.collection("users").doc(subRecord.userId);
          const userDoc = await userRef.get();
          if (userDoc.exists) {
            const data = userDoc.data() as { plan?: string };
            if (data?.plan !== "free") {
              await userRef.update({ plan: "free" });
            }
          }
        }
        break;

      case "BILLING.SUBSCRIPTION.EXPIRED":
        if (subRecord) {
          await updateSubscriptionStatus(subRecord.id, "EXPIRED");
          if (!adminDb) throw new Error("Firebase Admin not initialized");
          const userRef = adminDb.collection("users").doc(subRecord.userId);
          const userDoc = await userRef.get();
          if (userDoc.exists) {
            const data = userDoc.data() as { plan?: string };
            if (data?.plan !== "free") {
              await userRef.update({ plan: "free" });
            }
          }
        }
        break;

      case "PAYMENT.SALE.COMPLETED": {
        const sale = resource;
        const saleSubscriptionId =
          (sale.billing_agreement_id as string) || subscriptionId;
        const relatedSub = await getSubscriptionByPayPalId(saleSubscriptionId);

        if (relatedSub) {
          const paypalSub = await getPayPalSubscription(saleSubscriptionId);
          await updateSubscriptionStatus(relatedSub.id, "ACTIVE", {
            nextBillingDate: paypalSub.billing_info?.next_billing_time || null,
          });
          await createInvoiceFromSale(relatedSub.userId, paypalSub, {
            id: sale.id as string,
            amount: {
              total: (sale.amount as { total: string }).total,
              currency: (sale.amount as { currency: string }).currency,
            },
            create_time: sale.create_time as string,
            billing_agreement_id: saleSubscriptionId,
          });
          await activateUserPlan(relatedSub.userId, relatedSub.planId);
        }
        break;
      }

      default:
        console.log("Unhandled PayPal webhook:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("PayPal webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
