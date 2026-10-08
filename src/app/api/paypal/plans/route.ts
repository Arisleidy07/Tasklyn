// ============================================
// TASKLYN — Public PayPal plan IDs
// These are not secrets; they are public subscription plan identifiers.
// ============================================
import { NextResponse } from "next/server";

export async function GET() {
  const proPlanId = process.env.PAYPAL_PRO_PLAN_ID;
  const businessPlanId = process.env.PAYPAL_BUSINESS_PLAN_ID;
  const productId = process.env.PAYPAL_PRODUCT_ID;

  // Return empty object if PayPal is not configured (plan restrictions are disabled)
  if (!proPlanId || !businessPlanId) {
    return NextResponse.json({});
  }

  return NextResponse.json({
    pro: proPlanId,
    business: businessPlanId,
    productId,
  });
}
