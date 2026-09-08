// ============================================
// TASKLYN — Subscription & Payment Types
// ============================================

export type PlanType = "free" | "pro" | "business";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "past_due"
  | "pending"
  | "suspended";

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  // Payment provider (generic — Stripe, PayPal, MercadoPago, etc.)
  providerSubscriptionId?: string;
  providerPlanId?: string;
  provider?: "stripe" | "paypal" | "mercadopago" | "apple" | "google";
  // Billing
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  // Trial
  trialStart?: string;
  trialEnd?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  // Grace period for failed payments
  gracePeriodEnd?: string;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: "completed" | "failed" | "refunded" | "pending";
  providerTransactionId?: string;
  provider?: string;
  createdAt: string;
  description?: string;
}

// Enhanced Plan Limits — single source of truth in src/lib/planFeatures.ts
export type { PlanFeatures } from "@/lib/planFeatures";
export { PLAN_FEATURES } from "@/lib/planFeatures";

export interface PlanInfo {
  id: PlanType;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export const AVAILABLE_PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    period: "forever",
    description: "Perfecto para empezar",
    features: ["600 listas", "600 tareas", "Hasta 5 personas por lista"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 2.99,
    currency: "USD",
    period: "mes",
    description: "Para profesionales productivos",
    features: [
      "Hasta 20 listas",
      "Hasta 35 tareas",
      "Hasta 20 personas por lista",
      "Historial completo",
      "Personalización",
      "Funciones avanzadas",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 10,
    currency: "USD",
    period: "mes",
    description: "Para equipos y empresas",
    features: [
      "Todo lo Pro",
      "Administración empresarial",
      "Estadísticas premium",
      "Funciones futuras",
    ],
  },
];
