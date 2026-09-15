// ============================================
// TASKLYN — Verify PayPal Sandbox product and plans
// Run with: node --env-file=.env.local scripts/verify-paypal-plans.js
// ============================================

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  const res = await fetch("https://api.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  return data.access_token;
}

async function main() {
  const token = await getAccessToken();

  const productId = process.env.PAYPAL_PRODUCT_ID || "PROD-4W237249W5603281N";
  const proPlanId =
    process.env.PAYPAL_PRO_PLAN_ID || "P-7DM296649E867244VNKUGAKI";
  const businessPlanId =
    process.env.PAYPAL_BUSINESS_PLAN_ID || "P-833660233L7814452NKUGAKI";

  const productRes = await fetch(
    `https://api.sandbox.paypal.com/v1/catalogs/products/${productId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const product = await productRes.json();

  const proRes = await fetch(
    `https://api.sandbox.paypal.com/v1/billing/plans/${proPlanId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const proPlan = await proRes.json();

  const businessRes = await fetch(
    `https://api.sandbox.paypal.com/v1/billing/plans/${businessPlanId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const businessPlan = await businessRes.json();

  console.log("Product:", product.id, product.name, product.status);
  console.log("Pro plan:", proPlan.id, proPlan.name, proPlan.status);
  console.log(
    "Business plan:",
    businessPlan.id,
    businessPlan.name,
    businessPlan.status,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
