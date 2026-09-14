// ============================================
// TASKLYN — Get PayPal Subscription status
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/serverAuth";
import {
  getPayPalSubscription,
  getSubscriptionByPayPalId,
} from "@/lib/paypal/subscriptions";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await verifyBearerToken(authHeader);

    const url = new URL(request.url);
    const subscriptionId = url.searchParams.get("id");

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

    return NextResponse.json({
      subscription: paypalSubscription,
      firestore: subRecord,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Get subscription error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
