// ============================================
// TASKLYN — List user invoices (server-side)
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/serverAuth";
import { getUserInvoices } from "@/lib/paypal/invoices";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await verifyBearerToken(authHeader);

    const invoices = await getUserInvoices(user.uid);

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("[invoices] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
