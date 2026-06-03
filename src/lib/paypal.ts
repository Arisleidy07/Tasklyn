// ============================================
// TASKLYN — PayPal Server SDK Configuration
// ============================================
import { Client, Environment } from "@paypal/paypal-server-sdk";

const mode = process.env.PAYPAL_MODE || "sandbox";

const clientId =
  mode === "live"
    ? process.env.PAYPAL_LIVE_CLIENT_ID
    : process.env.PAYPAL_SANDBOX_CLIENT_ID;

const clientSecret =
  mode === "live"
    ? process.env.PAYPAL_LIVE_CLIENT_SECRET
    : process.env.PAYPAL_SANDBOX_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "[PayPal] ERROR: Missing PayPal credentials. Please check your environment variables.",
  );
}

// Initialize PayPal client
export const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: clientId || "",
    oAuthClientSecret: clientSecret || "",
  },
  timeout: 0,
  environment: mode === "live" ? Environment.Production : Environment.Sandbox,
});

// PayPal Product IDs for Tasklyn plans
// You'll create these in your PayPal Developer Dashboard
export const PAYPAL_PLAN_IDS = {
  PRO_MONTHLY: process.env.PAYPAL_PRO_PLAN_ID || "", // $4.99/month
  BUSINESS_MONTHLY: process.env.PAYPAL_BUSINESS_PLAN_ID || "", // $14.99/month
};

// Plan pricing (for reference and validation)
export const PLAN_PRICING = {
  PRO: {
    monthly: 4.99,
    currency: "USD",
  },
  BUSINESS: {
    monthly: 14.99,
    currency: "USD",
  },
};

export default paypalClient;
