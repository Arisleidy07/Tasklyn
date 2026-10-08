// ============================================
// TASKLYN — Single source of truth for plan limits
// ============================================

type Plan = "free" | "pro" | "business";

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

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
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
