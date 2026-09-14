// ============================================
// TASKLYN — Capture PayPal Order (server-side)
// Verifies the payment with PayPal before marking anything as paid.
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/serverAuth";
import {
  getInvoice,
  getInvoiceByPayPalOrderId,
  updateInvoiceStatus,
} from "@/lib/paypal/invoices";
import {
  activateUserPlan,
  capturePayPalOrder,
  extractCaptureDetails,
} from "@/lib/paypal/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await verifyBearerToken(authHeader);

    const body = (await request.json()) as {
      orderId?: string;
      invoiceId?: string;
    };
    const { orderId, invoiceId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const invoice = invoiceId
      ? await getInvoice(invoiceId)
      : await getInvoiceByPayPalOrderId(orderId);

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Idempotency: do not re-process an already paid invoice.
    if (invoice.status === "paid" && invoice.paypalCaptureId) {
      return NextResponse.json({
        success: true,
        status: "already_paid",
        invoice,
      });
    }

    const captureResult = await capturePayPalOrder(orderId);
    const details = extractCaptureDetails(captureResult);

    if (captureResult.status !== "COMPLETED" || !details.captureId) {
      await updateInvoiceStatus(invoice.id, "failed", {
        paypalOrderId: orderId,
        paymentMethod: details.paymentMethod,
      });
      return NextResponse.json(
        { error: "Payment not completed", paypalStatus: captureResult.status },
        { status: 422 },
      );
    }

    // Confirm it is the same order tied to this invoice.
    if (invoice.paypalOrderId && invoice.paypalOrderId !== orderId) {
      return NextResponse.json(
        { error: "Order ID does not match invoice" },
        { status: 409 },
      );
    }

    // Avoid duplicate capture records.
    if (
      invoice.paypalCaptureId &&
      invoice.paypalCaptureId === details.captureId
    ) {
      return NextResponse.json({
        success: true,
        status: "already_captured",
        invoice,
      });
    }

    await updateInvoiceStatus(invoice.id, "paid", {
      paypalOrderId: orderId,
      paypalCaptureId: details.captureId,
      amount: details.amount,
      currency: details.currency,
      paymentMethod: details.paymentMethod,
    });

    await activateUserPlan(user.uid, invoice.planId);

    return NextResponse.json({
      success: true,
      status: "paid",
      invoice: {
        ...invoice,
        status: "paid",
        paypalOrderId: orderId,
        paypalCaptureId: details.captureId,
        amount: details.amount,
        currency: details.currency,
        paymentMethod: details.paymentMethod,
      },
    });
  } catch (error) {
    console.error("[paypal/capture-order] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
