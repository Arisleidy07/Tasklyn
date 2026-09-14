// ============================================
// TASKLYN — Create PayPal Order (server-side)
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/serverAuth";
import {
  createPendingInvoice,
  updateInvoiceStatus,
} from "@/lib/paypal/invoices";
import {
  createPayPalOrder,
  getPlan,
  type PayPalPlan,
} from "@/lib/paypal/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await verifyBearerToken(authHeader);

    const body = (await request.json()) as { planId?: string };
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const plan = getPlan(planId) as PayPalPlan | null;
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Price is determined server-side. We never trust the browser for the amount.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

    const invoice = await createPendingInvoice({
      userId: user.uid,
      planId,
      description: plan.description,
      amount: plan.amount,
      currency: plan.currency,
    });

    const { orderId } = await createPayPalOrder(
      user.uid,
      plan,
      invoice.id,
      appUrl,
    );

    await updateInvoiceStatus(invoice.id, "pending", {
      paypalOrderId: orderId,
    });

    return NextResponse.json({
      orderId,
      invoiceId: invoice.id,
      amount: plan.amount,
      currency: plan.currency,
      planId,
    });
  } catch (error) {
    console.error("[paypal/create-order] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
