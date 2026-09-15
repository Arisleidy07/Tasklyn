// ============================================
// TASKLYN — Create PayPal Sandbox product & plans for subscriptions
// Run with: node --env-file=.env.local scripts/create-paypal-plans.js
// ============================================

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const env = process.env.PAYPAL_ENVIRONMENT || "sandbox";

  if (!clientId || !secret) {
    throw new Error(
      "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in .env.local",
    );
  }

  const base =
    env === "production"
      ? "https://api.paypal.com"
      : "https://api.sandbox.paypal.com";

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function createProduct(token, env) {
  const base =
    env === "production"
      ? "https://api.paypal.com"
      : "https://api.sandbox.paypal.com";

  const body = {
    name: "Tasklyn",
    description: "Tasklyn task management subscription",
    type: "SERVICE",
    category: "SOFTWARE",
    image_url: "https://tasklyn.com/logo.png",
    home_url: "https://tasklyn.com",
  };

  const res = await fetch(`${base}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `tasklyn-product-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create product failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function getProductByName(token, env, name) {
  const base =
    env === "production"
      ? "https://api.paypal.com"
      : "https://api.sandbox.paypal.com";

  const res = await fetch(`${base}/v1/catalogs/products?page_size=20&page=1&total_required=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List products failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.products?.find((p) => p.name === name) || null;
}

async function listPlansForProduct(token, env, productId) {
  const base =
    env === "production"
      ? "https://api.paypal.com"
      : "https://api.sandbox.paypal.com";

  const res = await fetch(
    `${base}/v1/billing/plans?product_id=${productId}&page_size=20&page=1&total_required=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List plans failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.plans || [];
}

async function createPlan(token, env, productId, name, amount, description) {
  const base =
    env === "production"
      ? "https://api.paypal.com"
      : "https://api.sandbox.paypal.com";

  const body = {
    product_id: productId,
    name,
    description,
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: { value: amount.toFixed(2), currency_code: "USD" },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3,
    },
    taxes: { percentage: "0", inclusive: false },
  };

  const res = await fetch(`${base}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `tasklyn-plan-${name}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create plan ${name} failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function main() {
  const env = process.env.PAYPAL_ENVIRONMENT || "sandbox";
  const token = await getAccessToken();

  let product = await getProductByName(token, env, "Tasklyn");

  if (!product) {
    console.log("Creating PayPal product 'Tasklyn'...");
    product = await createProduct(token, env);
  } else {
    console.log("Product 'Tasklyn' already exists.");
  }

  const existingPlans = await listPlansForProduct(token, env, product.id);
  let proPlan = existingPlans.find((p) => p.name === "Tasklyn Pro");
  let businessPlan = existingPlans.find((p) => p.name === "Tasklyn Business");

  if (!proPlan) {
    console.log("Creating Pro plan ($2.99/month)...");
    proPlan = await createPlan(
      token,
      env,
      product.id,
      "Tasklyn Pro",
      2.99,
      "Pro monthly subscription",
    );
  } else {
    console.log("Pro plan already exists.");
  }

  if (!businessPlan) {
    console.log("Creating Business plan ($10.00/month)...");
    businessPlan = await createPlan(
      token,
      env,
      product.id,
      "Tasklyn Business",
      10.0,
      "Business monthly subscription",
    );
  } else {
    console.log("Business plan already exists.");
  }

  console.log("\n=== ADD THESE TO .env.local ===");
  console.log(`PAYPAL_PRODUCT_ID=${product.id}`);
  console.log(`PAYPAL_PRO_PLAN_ID=${proPlan.id}`);
  console.log(`PAYPAL_BUSINESS_PLAN_ID=${businessPlan.id}`);
  console.log("================================\n");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
