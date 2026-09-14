// ============================================
// TASKLYN — PayPal server-side client (v2 Orders API)
// All secrets stay server-side. Never import in client components.
// ============================================

import { adminDb } from "@/lib/admin";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT ?? "sandbox";

const PAYPAL_API_BASE =
  PAYPAL_ENVIRONMENT === "production"
    ? "https://api.paypal.com"
    : "https://api.sandbox.paypal.com";

export type PayPalPlan = {
  planId: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  period: string;
};

// Canonical price catalog. The frontend can send a planId, but
// the price is always resolved here, never trusted from the browser.
export const PAYPAL_PLANS: Record<string, PayPalPlan> = {
  pro: {
    planId: "pro",
    name: "Tasklyn Pro",
    description: "Tasklyn Pro - monthly subscription",
    amount: 2.99,
    currency: "USD",
    period: "month",
  },
  business: {
    planId: "business",
    name: "Tasklyn Business",
    description: "Tasklyn Business - monthly subscription",
    amount: 10,
    currency: "USD",
    period: "month",
  },
};

export function getPlan(planId: string): PayPalPlan | null {
  return PAYPAL_PLANS[planId] ?? null;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials are not configured");
  }

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString(
          "base64",
        ),
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal token error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

type PayPalOrderPayload = {
  intent: "CAPTURE";
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    description: string;
    custom_id: string;
    invoice_id: string;
  }>;
  application_context: {
    brand_name: string;
    landing_page: string;
    user_action: string;
    return_url: string;
    cancel_url: string;
  };
};

export async function createPayPalOrder(
  userId: string,
  plan: PayPalPlan,
  invoiceId: string,
  appUrl: string,
): Promise<{ orderId: string; status: string }> {
  const accessToken = await getPayPalAccessToken();

  const payload: PayPalOrderPayload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: plan.currency,
          value: plan.amount.toFixed(2),
        },
        description: plan.description,
        custom_id: JSON.stringify({ userId, planId: plan.planId }),
        invoice_id: invoiceId,
      },
    ],
    application_context: {
      brand_name: "Tasklyn",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: `${appUrl}/checkout?status=return`,
      cancel_url: `${appUrl}/checkout?status=cancel`,
    },
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "PayPal-Request-Id": invoiceId,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal create order error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { id: string; status: string };
  return { orderId: data.id, status: data.status };
}

export async function capturePayPalOrder(
  orderId: string,
): Promise<PayPalCaptureResult> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal capture error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as PayPalCaptureResult;
  return data;
}

export type PayPalCaptureResult = {
  id: string;
  status: string;
  payment_source?: unknown;
  purchase_units: Array<{
    reference_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
};

export function extractCaptureDetails(data: PayPalCaptureResult): {
  captureId: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
} {
  const capture =
    data.purchase_units?.[0]?.payments?.captures?.[0] ?? null;

  let paymentMethod = "paypal";
  if (data.payment_source && typeof data.payment_source === "object") {
    const source = data.payment_source as Record<string, unknown>;
    const firstKey = Object.keys(source)[0];
    if (firstKey) paymentMethod = firstKey;
  }

  return {
    captureId: capture?.id ?? null,
    amount: capture ? parseFloat(capture.amount.value) : 0,
    currency: capture?.amount.currency_code ?? "USD",
    paymentMethod,
    status: data.status,
  };
}

export async function markInvoicePaid(
  invoiceId: string,
  orderId: string,
  captureDetails: ReturnType<typeof extractCaptureDetails>,
): Promise<void> {
  if (!adminDb) throw new Error("Firebase Admin is not configured");

  const invoiceRef = adminDb.collection("invoices").doc(invoiceId);

  await invoiceRef.update({
    status: "paid",
    paypalOrderId: orderId,
    paypalCaptureId: captureDetails.captureId,
    amount: captureDetails.amount,
    currency: captureDetails.currency,
    paymentMethod: captureDetails.paymentMethod,
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function activateUserPlan(
  userId: string,
  planId: string,
): Promise<void> {
  if (!adminDb) throw new Error("Firebase Admin is not configured");

  const plan = getPlan(planId);
  if (!plan) throw new Error("Invalid plan");

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await adminDb.collection("users").doc(userId).update({
    plan: planId,
    subscriptionStatus: "active",
    subscriptionCurrentPeriodEnd: periodEnd.toISOString(),
    subscriptionCancelAtPeriodEnd: false,
    updatedAt: new Date().toISOString(),
  });
}
