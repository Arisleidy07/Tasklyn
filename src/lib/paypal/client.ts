// ============================================
// TASKLYN — PayPal Subscriptions SDK loader (client-side)
// ============================================

const PAYPAL_ENVIRONMENT =
  process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT ?? "sandbox";

const PAYPAL_SDK_URL =
  PAYPAL_ENVIRONMENT === "production"
    ? "https://www.paypal.com/sdk/js"
    : "https://www.sandbox.paypal.com/sdk/js";

export function getPayPalClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_PAYPAL_CLIENT_ID is not configured");
  }
  return clientId;
}

function buildSdkUrl(): string {
  const clientId = getPayPalClientId();
  const params = new URLSearchParams({
    "client-id": clientId,
    vault: "true",
    intent: "subscription",
    currency: "USD",
    components: "buttons",
    "disable-funding": "credit,card",
  });
  return `${PAYPAL_SDK_URL}?${params.toString()}`;
}

export function loadPayPalSdk(): Promise<typeof window.paypal> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Cannot load PayPal SDK on server"));
      return;
    }

    if (window.paypal) {
      resolve(window.paypal);
      return;
    }

    const existing = document.getElementById("paypal-subscriptions-sdk");
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.paypal) resolve(window.paypal);
        else reject(new Error("PayPal SDK loaded but not available"));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-subscriptions-sdk";
    script.src = buildSdkUrl();
    script.async = true;
    script.setAttribute("data-namespace", "paypal");

    script.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error("PayPal SDK loaded but not available"));
    };

    script.onerror = () => {
      reject(new Error("Failed to load PayPal SDK"));
    };

    document.body.appendChild(script);
  });
}
