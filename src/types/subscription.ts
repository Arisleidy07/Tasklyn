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

// Enhanced Plan Limits
export interface PlanFeatures {
  maxLists: number;
  maxTasksPerList: number;
  maxCollaborators: number;
  canShare: boolean;
  canAssign: boolean;
  canSetReminders: boolean;
  canSetRecurrence: boolean;
  hasAdvancedCalendar: boolean;
  hasDarkMode: boolean;
  hasPersonalStats: boolean;
  hasRealtimeNotifications: boolean;
  // Business features
  hasTeamDashboard: boolean;
  hasTeamRanking: boolean;
  hasWeeklyStats: boolean;
  hasMonthlyStats: boolean;
  hasAdvancedHistory: boolean;
  hasBusinessCalendar: boolean;
  hasReports: boolean;
  hasUserProductivity: boolean;
  hasAdvancedManagement: boolean;
  maxTeams: number;
  maxTeamMembers: number;
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    maxLists: 4,
    maxTasksPerList: 15,
    maxCollaborators: 5,
    canShare: true,
    canAssign: false,
    canSetReminders: true,
    canSetRecurrence: false,
    hasAdvancedCalendar: false,
    hasDarkMode: true,
    hasPersonalStats: false,
    hasRealtimeNotifications: true,
    hasTeamDashboard: false,
    hasTeamRanking: false,
    hasWeeklyStats: false,
    hasMonthlyStats: false,
    hasAdvancedHistory: false,
    hasBusinessCalendar: false,
    hasReports: false,
    hasUserProductivity: false,
    hasAdvancedManagement: false,
    maxTeams: 1,
    maxTeamMembers: 5,
  },
  pro: {
    maxLists: 20,
    maxTasksPerList: 35,
    maxCollaborators: 20,
    canShare: true,
    canAssign: true,
    canSetReminders: true,
    canSetRecurrence: true,
    hasAdvancedCalendar: true,
    hasDarkMode: true,
    hasPersonalStats: true,
    hasRealtimeNotifications: true,
    hasTeamDashboard: true,
    hasTeamRanking: true,
    hasWeeklyStats: true,
    hasMonthlyStats: true,
    hasAdvancedHistory: true,
    hasBusinessCalendar: false,
    hasReports: false,
    hasUserProductivity: false,
    hasAdvancedManagement: false,
    maxTeams: Infinity,
    maxTeamMembers: Infinity,
  },
  business: {
    maxLists: Infinity,
    maxTasksPerList: Infinity,
    maxCollaborators: Infinity,
    canShare: true,
    canAssign: true,
    canSetReminders: true,
    canSetRecurrence: true,
    hasAdvancedCalendar: true,
    hasDarkMode: true,
    hasPersonalStats: true,
    hasRealtimeNotifications: true,
    hasTeamDashboard: true,
    hasTeamRanking: true,
    hasWeeklyStats: true,
    hasMonthlyStats: true,
    hasAdvancedHistory: true,
    hasBusinessCalendar: true,
    hasReports: true,
    hasUserProductivity: true,
    hasAdvancedManagement: true,
    maxTeams: Infinity,
    maxTeamMembers: Infinity,
  },
};

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
    features: ["4 listas", "15 tareas", "Hasta 5 personas por lista"],
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
