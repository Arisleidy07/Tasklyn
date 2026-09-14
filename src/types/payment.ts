// ============================================
// TASKLYN — Payment, Subscription & Invoice Types
// ============================================

export type InvoiceStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
  paypalSubscriptionId?: string | null;
  paypalTransactionId?: string | null;
  amount: number;
  currency: string;
  paymentMethod?: string | null;
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string | null;
  description?: string;
  productId?: string;
  planId: string;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  metadata?: Record<string, unknown>;
}

export type SubscriptionStatus =
  | "APPROVAL_PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED"
  | "PAYMENT_FAILED";

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  paypalPlanId: string;
  paypalSubscriptionId: string;
  status: SubscriptionStatus;
  amount: number;
  currency: string;
  billingInterval: string;
  createdAt: string;
  startDate: string | null;
  nextBillingDate: string | null;
  cancelledAt: string | null;
  updatedAt: string;
}
