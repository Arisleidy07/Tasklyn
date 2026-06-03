// ============================================
// TASKLYN — Create PayPal Subscription
// POST /api/subscription/create
// ============================================

import { NextRequest, NextResponse } from "next/server";

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
    const { planId, userId } = await request.json();

    if (!planId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: planId, userId" },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create subscription
    const subscriptionPayload = {
      plan_id: planId,
      subscriber: {
        custom_id: userId,
      },
      application_context: {
        brand_name: "Tasklyn",
        locale: "es-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
      },
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PayPal API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create PayPal subscription", details: errorData },
        { status: 500 }
      );
    }

    const subscription = await response.json();

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      approveLink: subscription.links.find((link: any) => link.rel === "approve")
        ?.href,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
