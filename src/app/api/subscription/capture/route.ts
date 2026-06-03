// ============================================
// TASKLYN — Capture PayPal Subscription
// POST /api/subscription/capture
// Captures approved subscription and activates it
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const clientId =
    process.env.PAYPAL_MODE === "live"
      ? process.env.PAYPAL_LIVE_CLIENT_ID
      : process.env.PAYPAL_SANDBOX_CLIENT_ID;
  const clientSecret =
    process.env.PAYPAL_MODE === "live"
      ? process.env.PAYPAL_LIVE_CLIENT_SECRET
      : process.env.PAYPAL_SANDBOX_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, userId, plan } = await request.json();

    if (!subscriptionId || !userId || !plan) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get subscription details from PayPal
    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PayPal API error:", errorData);
      return NextResponse.json(
        { error: "Failed to verify subscription", details: errorData },
        { status: 500 }
      );
    }

    const subscription = await response.json();

    // Verify subscription is active
    if (subscription.status !== "ACTIVE" && subscription.status !== "APPROVED") {
      return NextResponse.json(
        { error: `Subscription is not active. Status: ${subscription.status}` },
        { status: 400 }
      );
    }

    // Create subscription document in Firestore
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    await setDoc(subscriptionRef, {
      userId,
      plan,
      status: subscription.status.toLowerCase(),
      paypalSubscriptionId: subscriptionId,
      paypalPlanId: subscription.plan_id,
      currentPeriodStart: subscription.start_time,
      currentPeriodEnd: subscription.billing_info?.next_billing_time || null,
      cancelAtPeriodEnd: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update user document with subscription info
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      plan,
      subscriptionId,
      subscriptionStatus: subscription.status.toLowerCase(),
      subscriptionCurrentPeriodEnd: subscription.billing_info?.next_billing_time,
      subscriptionCancelAtPeriodEnd: false,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionId,
        status: subscription.status,
        plan,
        currentPeriodEnd: subscription.billing_info?.next_billing_time,
      },
    });
  } catch (error) {
    console.error("Error capturing subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
