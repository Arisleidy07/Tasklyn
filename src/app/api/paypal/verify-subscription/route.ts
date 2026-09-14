// ============================================
// TASKLYN — Verify and activate PayPal subscription
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/serverAuth";
import {
  getPayPalSubscription,
  getSubscriptionByPayPalId,
  updateSubscriptionStatus,
  activateUserPlan,
  createInvoiceFromSale,
} from "@/lib/paypal/subscriptions";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await verifyBearerToken(authHeader);

    const body = (await request.json()) as {
      subscriptionId?: string;
    };
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Missing subscription id" },
        { status: 400 },
      );
    }

    const subRecord = await getSubscriptionByPayPalId(subscriptionId);
    if (!subRecord || subRecord.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paypalSubscription = await getPayPalSubscription(subscriptionId);
    const status = paypalSubscription.status;

    if (status === "ACTIVE") {
      await updateSubscriptionStatus(subRecord.id, "ACTIVE", {
        startDate: paypalSubscription.start_time,
        nextBillingDate: paypalSubscription.billing_info?.next_billing_time || null,
      });
      await activateUserPlan(user.uid, subRecord.planId);
      return NextResponse.json({
        success: true,
        status: "ACTIVE",
        subscription: paypalSubscription,
      });
    }

    return NextResponse.json({
      success: false,
      status,
      subscription: paypalSubscription,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Verify subscription error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
