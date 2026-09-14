// ============================================
// TASKLYN — Create PayPal Subscription
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/serverAuth";
import {
  getPayPalPlan,
  createPayPalSubscription,
  createSubscriptionRecord,
  getServerUser,
} from "@/lib/paypal/subscriptions";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await verifyBearerToken(authHeader);

    const body = (await request.json()) as {
      planId?: string;
    };
    const { planId } = body;

    if (!planId || (planId !== "pro" && planId !== "business")) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const paypalPlanId =
      planId === "business"
        ? process.env.PAYPAL_BUSINESS_PLAN_ID
        : process.env.PAYPAL_PRO_PLAN_ID;

    if (!paypalPlanId) {
      return NextResponse.json(
        { error: "PayPal plan not configured" },
        { status: 500 },
      );
    }

    const dbUser = await getServerUser(user.uid);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const startTime = new Date(Date.now() + 60_000).toISOString();
    const subscriber = {
      name: {
        given_name: dbUser.name?.split(" ")[0] || "User",
        surname: dbUser.name?.split(" ").slice(1).join(" ") || "",
      },
      email_address: dbUser.email || user.email || "",
    };

    const paypalPlan = await getPayPalPlan(paypalPlanId);
    const paypalSubscription = await createPayPalSubscription(
      paypalPlanId,
      startTime,
      subscriber,
      user.uid,
    );

    const subscription = await createSubscriptionRecord(
      user.uid,
      paypalSubscription,
      paypalPlan,
    );

    return NextResponse.json({
      subscriptionId: paypalSubscription.id,
      approvalUrl: paypalSubscription.links?.find((l) => l.rel === "approve")
        ?.href,
      firestoreId: subscription.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Create subscription error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
