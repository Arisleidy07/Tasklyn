// ============================================
// TASKLYN — PayPal Webhook Handler
// POST /api/paypal/webhook
// Handles PayPal subscription events
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";

// Webhook event types we handle
const HANDLED_EVENTS = [
  "BILLING.SUBSCRIPTION.CREATED",
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
  "PAYMENT.SALE.COMPLETED",
  "PAYMENT.SALE.REFUNDED",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = request.headers;

    // In production, verify the webhook signature
    // const isValid = await verifyWebhookSignature(body, headers);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`[PayPal Webhook] Received event: ${eventType}`);

    // Check if we handle this event type
    if (!HANDLED_EVENTS.includes(eventType)) {
      console.log(`[PayPal Webhook] Ignoring unhandled event type: ${eventType}`);
      return NextResponse.json({ received: true, handled: false });
    }

    // Get subscription details
    const subscriptionId = resource.id;
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.CREATED":
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const userId = resource.subscriber?.custom_id;
        if (!userId) {
          console.error("[PayPal Webhook] No userId found in subscription");
          return NextResponse.json({ error: "No userId" }, { status: 400 });
        }

        // Update subscription status
        await updateDoc(subscriptionRef, {
          status: "active",
          paypalStatus: resource.status,
          currentPeriodStart: resource.start_time,
          currentPeriodEnd: resource.billing_info?.next_billing_time,
          updatedAt: serverTimestamp(),
        });

        // Update user
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          subscriptionStatus: "active",
          subscriptionCurrentPeriodEnd: resource.billing_info?.next_billing_time,
          updatedAt: serverTimestamp(),
        });

        console.log(`[PayPal Webhook] Subscription activated: ${subscriptionId}`);
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED": {
        await updateDoc(subscriptionRef, {
          status: "cancelled",
          paypalStatus: resource.status,
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Get userId from subscription
        const subDoc = await getDoc(subscriptionRef);
        if (subDoc.exists()) {
          const { userId } = subDoc.data();
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            subscriptionStatus: "cancelled",
            subscriptionCancelAtPeriodEnd: true,
            updatedAt: serverTimestamp(),
          });
        }

        console.log(`[PayPal Webhook] Subscription cancelled: ${subscriptionId}`);
        break;
      }

      case "BILLING.SUBSCRIPTION.EXPIRED": {
        await updateDoc(subscriptionRef, {
          status: "expired",
          paypalStatus: resource.status,
          expiredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Downgrade user to free plan
        const subDoc = await getDoc(subscriptionRef);
        if (subDoc.exists()) {
          const { userId } = subDoc.data();
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            plan: "free",
            subscriptionStatus: "expired",
            subscriptionId: null,
            subscriptionCurrentPeriodEnd: null,
            subscriptionCancelAtPeriodEnd: false,
            updatedAt: serverTimestamp(),
          });
        }

        console.log(`[PayPal Webhook] Subscription expired, user downgraded: ${subscriptionId}`);
        break;
      }

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
        await updateDoc(subscriptionRef, {
          status: "past_due",
          paymentFailureCount: (resource.billing_info?.failed_payments_count || 0) + 1,
          lastPaymentFailedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Set grace period (3 days)
        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

        await updateDoc(subscriptionRef, {
          gracePeriodEnd: gracePeriodEnd.toISOString(),
        });

        const subDoc = await getDoc(subscriptionRef);
        if (subDoc.exists()) {
          const { userId } = subDoc.data();
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            subscriptionStatus: "past_due",
            updatedAt: serverTimestamp(),
          });

          // Create notification for user
          const notificationRef = doc(db, "notifications", `${userId}_${Date.now()}`);
          await setDoc(notificationRef, {
            userId,
            type: "payment_failed",
            title: "Pago fallido",
            body: "Tu pago de suscripción no se pudo procesar. Por favor actualiza tu método de pago. Tienes 3 días de gracia.",
            read: false,
            createdAt: serverTimestamp(),
            actionUrl: "/settings",
            actionText: "Actualizar pago",
          });
        }

        console.log(`[PayPal Webhook] Payment failed: ${subscriptionId}`);
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        // Record successful payment
        const paymentRef = doc(db, "payments", resource.id);
        const subDoc = await getDoc(subscriptionRef);
        
        if (subDoc.exists()) {
          const { userId, plan } = subDoc.data();
          await setDoc(paymentRef, {
            userId,
            subscriptionId,
            plan,
            amount: parseFloat(resource.amount?.total || 0),
            currency: resource.amount?.currency || "USD",
            status: "completed",
            paypalTransactionId: resource.id,
            createdAt: serverTimestamp(),
            description: `Pago de suscripción ${plan}`,
          });

          // Update subscription next billing date
          await updateDoc(subscriptionRef, {
            lastPaymentAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        console.log(`[PayPal Webhook] Payment completed: ${resource.id}`);
        break;
      }

      default:
        console.log(`[PayPal Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true, handled: true });
  } catch (error) {
    console.error("[PayPal Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Placeholder for webhook signature verification
// In production, implement this using PayPal's SDK or crypto library
async function verifyWebhookSignature(body: string, headers: Headers): Promise<boolean> {
  // TODO: Implement webhook signature verification
  // https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
  return true; // Temporarily return true for development
}
