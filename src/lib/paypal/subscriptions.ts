// ============================================
// TASKLYN — PayPal Subscriptions API helpers (server-side)
// ============================================

import { adminDb } from "@/lib/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Invoice, Subscription } from "@/types/payment";

export type PayPalEnvironment = "sandbox" | "production";

function getBaseUrl(env: PayPalEnvironment = "sandbox"): string {
  return env === "production"
    ? "https://api.paypal.com"
    : "https://api.sandbox.paypal.com";
}

function getClientCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const env =
    (process.env.PAYPAL_ENVIRONMENT as PayPalEnvironment) || "sandbox";

  if (!clientId || !clientSecret) {
    throw new Error("PayPal client credentials missing");
  }

  return { clientId, clientSecret, env };
}

export async function getPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret, env } = getClientCredentials();
  const base = getBaseUrl(env);

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function getPayPalPlan(planId: string) {
  const token = await getPayPalAccessToken();
  const env = getClientCredentials().env;
  const base = getBaseUrl(env);

  const res = await fetch(`${base}/v1/billing/plans/${planId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal get plan error: ${res.status} ${text}`);
  }

  return (await res.json()) as PayPalPlan;
}

export async function createPayPalSubscription(
  planId: string,
  startTime: string,
  subscriber: {
    name: { given_name: string; surname?: string };
    email_address: string;
  },
  customId?: string,
) {
  const token = await getPayPalAccessToken();
  const env = getClientCredentials().env;
  const base = getBaseUrl(env);

  const body = {
    plan_id: planId,
    start_time: startTime,
    subscriber,
    application_context: {
      brand_name: "Tasklyn",
      locale: "en-US",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      payment_method: {
        payer_selected: "PAYPAL",
        payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
      },
    },
    custom_id: customId,
  };

  const res = await fetch(`${base}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create subscription error: ${res.status} ${text}`);
  }

  return (await res.json()) as PayPalSubscription;
}

export async function getPayPalSubscription(subscriptionId: string) {
  const token = await getPayPalAccessToken();
  const env = getClientCredentials().env;
  const base = getBaseUrl(env);

  const res = await fetch(
    `${base}/v1/billing/subscriptions/${subscriptionId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal get subscription error: ${res.status} ${text}`);
  }

  return (await res.json()) as PayPalSubscription;
}

export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason = "Cancelled by user",
) {
  const token = await getPayPalAccessToken();
  const env = getClientCredentials().env;
  const base = getBaseUrl(env);

  const res = await fetch(
    `${base}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    },
  );

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`PayPal cancel subscription error: ${res.status} ${text}`);
  }

  return true;
}

export async function activatePayPalSubscription(
  subscriptionId: string,
  reason = "Activated",
) {
  const token = await getPayPalAccessToken();
  const env = getClientCredentials().env;
  const base = getBaseUrl(env);

  const res = await fetch(
    `${base}/v1/billing/subscriptions/${subscriptionId}/activate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    },
  );

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(
      `PayPal activate subscription error: ${res.status} ${text}`,
    );
  }

  return true;
}

// --------------------------------------------
// Firestore subscription helpers
// --------------------------------------------

function getDb() {
  if (!adminDb) throw new Error("Firebase Admin not initialized");
  return adminDb;
}

function planIdFromPayPalPlanId(payPalPlanId: string): string {
  if (payPalPlanId === process.env.PAYPAL_PRO_PLAN_ID) return "pro";
  if (payPalPlanId === process.env.PAYPAL_BUSINESS_PLAN_ID) return "business";
  return "pro";
}

function amountFromPlan(planId: string): number {
  if (planId === "business") return 10.0;
  return 2.99;
}

export async function createSubscriptionRecord(
  userId: string,
  paypalSubscription: PayPalSubscription,
  paypalPlan: PayPalPlan,
) {
  const db = getDb();
  const planId = planIdFromPayPalPlanId(paypalPlan.id);
  const amount = amountFromPlan(planId);

  const sub: Omit<Subscription, "id"> = {
    userId,
    planId,
    paypalPlanId: paypalPlan.id,
    paypalSubscriptionId: paypalSubscription.id,
    status: (paypalSubscription.status ||
      "APPROVAL_PENDING") as Subscription["status"],
    amount,
    currency: "USD",
    billingInterval: "month",
    createdAt: FieldValue.serverTimestamp() as unknown as string,
    startDate: paypalSubscription.start_time || new Date().toISOString(),
    nextBillingDate: paypalSubscription.billing_info?.next_billing_time || null,
    cancelledAt: null,
    updatedAt: FieldValue.serverTimestamp() as unknown as string,
  };

  const ref = await db.collection("subscriptions").add(sub);
  return { id: ref.id, ...sub };
}

export async function getServerUser(userId: string) {
  const db = getDb();
  const doc = await db.collection("users").doc(userId).get();
  if (!doc.exists) return null;
  return doc.data() as {
    name?: string;
    email?: string;
    plan?: string;
  };
}

export async function getActiveSubscription(
  userId: string,
): Promise<Subscription | null> {
  const db = getDb();
  const snap = await db
    .collection("subscriptions")
    .where("userId", "==", userId)
    .where("status", "in", ["ACTIVE", "APPROVAL_PENDING"])
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ...(doc.data() as Omit<Subscription, "id">), id: doc.id };
}

export async function getSubscriptionByPayPalId(
  subscriptionId: string,
): Promise<Subscription | null> {
  const db = getDb();
  const snap = await db
    .collection("subscriptions")
    .where("paypalSubscriptionId", "==", subscriptionId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ...(doc.data() as Omit<Subscription, "id">), id: doc.id };
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string,
  extra: Partial<Subscription> = {},
) {
  const db = getDb();
  const ref = db.collection("subscriptions").doc(subscriptionId);
  await ref.update({
    status,
    ...extra,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function cancelSubscriptionRecord(
  subscriptionId: string,
  reason?: string,
) {
  const db = getDb();
  const ref = db.collection("subscriptions").doc(subscriptionId);
  await ref.update({
    status: "CANCELLED",
    cancelledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const userId = (await ref.get()).data()?.userId;
  if (userId) {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const data = userDoc.data() as { plan?: string };
      if (data?.plan !== "free") {
        await userRef.update({ plan: "free" });
      }
    }
  }

  return true;
}

export async function activateUserPlan(userId: string, planId: string) {
  const db = getDb();
  const ref = db.collection("users").doc(userId);
  const doc = await ref.get();
  if (!doc.exists) return;
  const data = doc.data() as { plan?: string };
  if (data?.plan !== planId) {
    await ref.update({ plan: planId });
  }
}

// --------------------------------------------
// Invoice helpers
// --------------------------------------------

export async function createInvoiceFromSale(
  userId: string,
  subscription: PayPalSubscription,
  sale: PayPalSale,
): Promise<Invoice> {
  const db = getDb();
  const planId = planIdFromPayPalPlanId(subscription.plan_id);
  const amount = parseFloat(sale.amount?.total || "0");
  const currency = sale.amount?.currency || "USD";

  const invoiceRef = db.collection("invoices").doc();
  const number = `INV-${Date.now()}-${invoiceRef.id.slice(-6).toUpperCase()}`;

  const invoice: Omit<Invoice, "id"> = {
    userId,
    invoiceNumber: number,
    paypalSubscriptionId: subscription.id,
    paypalTransactionId: sale.id,
    planId,
    amount,
    currency,
    status: "paid",
    createdAt: FieldValue.serverTimestamp() as unknown as string,
    paidAt: sale.create_time
      ? new Date(sale.create_time).toISOString()
      : new Date().toISOString(),
    billingPeriodStart: sale.billing_agreement_id
      ? new Date().toISOString()
      : null,
    billingPeriodEnd: null,
    description: `Tasklyn ${planId} subscription payment`,
    paypalOrderId: null,
    paypalCaptureId: null,
    paymentMethod: "paypal",
  };

  await invoiceRef.set(invoice);
  return { id: invoiceRef.id, ...invoice };
}

export async function recordSubscriptionActivation(subscription: Subscription) {
  const db = getDb();
  const userRef = db.collection("users").doc(subscription.userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return;
  const data = userDoc.data() as { plan?: string };
  if (data?.plan !== subscription.planId) {
    await userRef.update({ plan: subscription.planId });
  }
}

// --------------------------------------------
// Webhook verification
// --------------------------------------------

export async function verifyPayPalWebhook(
  headers: Record<string, string | null>,
  body: string,
): Promise<boolean> {
  const token = await getPayPalAccessToken();
  const env = getClientCredentials().env;
  const base = getBaseUrl(env);

  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webhook verification failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { verification_status: string };
  return data.verification_status === "SUCCESS";
}

// --------------------------------------------
// Types
// --------------------------------------------

type PayPalPlan = {
  id: string;
  product_id: string;
  name: string;
  status: string;
  billing_cycles: Array<{
    pricing_scheme: {
      fixed_price: { value: string; currency_code: string };
    };
    frequency: { interval_unit: string; interval_count: number };
  }>;
};

type PayPalSubscription = {
  id: string;
  plan_id: string;
  status: string;
  start_time: string;
  create_time?: string;
  update_time?: string;
  subscriber?: {
    name: { given_name: string; surname?: string };
    email_address: string;
  };
  billing_info?: {
    next_billing_time: string | null;
    failed_payments_count: number;
  };
  links?: Array<{ href: string; rel: string; method?: string }>;
};

type PayPalSale = {
  id: string;
  amount: { total: string; currency: string };
  create_time: string;
  billing_agreement_id?: string;
};
