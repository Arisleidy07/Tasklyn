// ============================================
// TASKLYN — Get active subscription by user
// ============================================
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/serverAuth";
import { getActiveSubscription } from "@/lib/paypal/subscriptions";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await verifyBearerToken(authHeader);

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId || userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subscription = await getActiveSubscription(user.uid);

    return NextResponse.json({ subscription });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Get subscription by user error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
