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
  // PayPal specific
  paypalSubscriptionId?: string;
  paypalPlanId?: string;
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
  paypalTransactionId?: string;
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
    maxLists: 3,
    maxTasksPerList: 50,
    maxCollaborators: 2,
    canShare: true,
    canAssign: false,
    canSetReminders: true,
    canSetRecurrence: false,
    hasAdvancedCalendar: false,
    hasDarkMode: false,
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
    maxTeams: 0,
    maxTeamMembers: 0,
  },
  pro: {
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
    hasTeamDashboard: false,
    hasTeamRanking: false,
    hasWeeklyStats: false,
    hasMonthlyStats: false,
    hasAdvancedHistory: false,
    hasBusinessCalendar: false,
    hasReports: false,
    hasUserProductivity: false,
    hasAdvancedManagement: false,
    maxTeams: 0,
    maxTeamMembers: 0,
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
  paypalPlanId?: string;
}

export const AVAILABLE_PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    period: "forever",
    description: "Perfecto para empezar",
    features: [
      "Hasta 3 listas",
      "Hasta 50 tareas",
      "Hasta 2 colaboradores",
      "Recordatorios básicos",
      "Calendario básico",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 4.99,
    currency: "USD",
    period: "mes",
    description: "Para profesionales productivos",
    features: [
      "Listas ilimitadas",
      "Tareas ilimitadas",
      "Colaboradores ilimitados",
      "Recordatorios avanzados",
      "Repeticiones",
      "Calendario completo",
      "Modo oscuro",
      "Estadísticas personales",
      "Notificaciones en tiempo real",
    ],
    popular: true,
    paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID,
  },
  {
    id: "business",
    name: "Business",
    price: 14.99,
    currency: "USD",
    period: "mes",
    description: "Para equipos y empresas",
    features: [
      "Todo lo de Pro",
      "Equipos ilimitados",
      "Panel de equipo",
      "Ranking de empleados",
      "Estadísticas semanales",
      "Estadísticas mensuales",
      "Historial avanzado",
      "Calendario empresarial",
      "Reportes",
      "Productividad por usuario",
      "Gestión avanzada",
    ],
    paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_BUSINESS_PLAN_ID,
  },
];
