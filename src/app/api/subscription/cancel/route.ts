// ============================================
// TASKLYN — Cancel PayPal Subscription
// POST /api/subscription/cancel
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

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
    const { subscriptionId, userId, reason = "User requested cancellation" } = await request.json();

    if (!subscriptionId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify subscription belongs to user
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);

    if (!subscriptionDoc.exists()) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const subscriptionData = subscriptionDoc.data();
    if (subscriptionData.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Cancel subscription in PayPal
    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok && response.status !== 422) {
      // 422 means already cancelled
      const errorData = await response.json();
      console.error("PayPal API error:", errorData);
      return NextResponse.json(
        { error: "Failed to cancel subscription", details: errorData },
        { status: 500 }
      );
    }

    // Update subscription in Firestore
    await updateDoc(subscriptionRef, {
      status: "cancelled",
      cancelAtPeriodEnd: true,
      cancelledAt: serverTimestamp(),
      cancelReason: reason,
      updatedAt: serverTimestamp(),
    });

    // Update user document
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      subscriptionCancelAtPeriodEnd: true,
      subscriptionStatus: "cancelled",
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully. You will have access until the end of your billing period.",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
