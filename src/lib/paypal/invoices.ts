// ============================================
// TASKLYN — Invoice Firestore helpers (server-side)
// Uses Firebase Admin. Never import in client components.
// ============================================
import { adminDb } from "@/lib/admin";
import type { Invoice, InvoiceStatus } from "@/types/payment";

function getDb() {
  if (!adminDb) throw new Error("Firebase Admin is not configured");
  return adminDb;
}

export async function createPendingInvoice(params: {
  userId: string;
  planId: string;
  description: string;
  amount: number;
  currency: string;
}): Promise<Invoice> {
  const db = getDb();
  const { userId, planId, description, amount, currency } = params;

  const invoiceRef = db.collection("invoices").doc();
  const now = new Date().toISOString();

  const invoice: Omit<Invoice, "id"> = {
    userId,
    invoiceNumber: `INV-${Date.now()}-${invoiceRef.id.slice(-6)}`,
    amount,
    currency,
    status: "pending",
    createdAt: now,
    description,
    productId: `plan-${planId}`,
    planId,
  };

  await invoiceRef.set(invoice);

  return { ...invoice, id: invoiceRef.id };
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const db = getDb();
  const doc = await db.collection("invoices").doc(invoiceId).get();
  if (!doc.exists) return null;
  const data = doc.data() as Omit<Invoice, "id">;
  return { ...data, id: doc.id };
}

export async function getInvoiceByPayPalOrderId(
  orderId: string,
): Promise<Invoice | null> {
  const db = getDb();
  const snap = await db
    .collection("invoices")
    .where("paypalOrderId", "==", orderId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ...(doc.data() as Omit<Invoice, "id">), id: doc.id };
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  extra?: Partial<Invoice>,
): Promise<void> {
  const db = getDb();
  const update: Record<string, unknown> = { status, ...extra };
  if (status === "paid") {
    update.paidAt = new Date().toISOString();
  }
  await db.collection("invoices").doc(invoiceId).update(update);
}

export async function getUserInvoices(userId: string): Promise<Invoice[]> {
  const db = getDb();
  const snap = await db
    .collection("invoices")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((d) => ({
    ...(d.data() as Omit<Invoice, "id">),
    id: d.id,
  }));
}
