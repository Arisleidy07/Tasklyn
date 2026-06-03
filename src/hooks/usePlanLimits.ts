// ============================================
// TASKLYN — Plan Limits Hook
// Check and enforce plan limits throughout the app
// ============================================

import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { PLAN_FEATURES, type Plan } from "@/types";

interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number | typeof Infinity;
  message: string;
}

export function usePlanLimits() {
  const { user } = useAuthStore();
  const plan = (user?.plan || "free") as Plan;
  const features = PLAN_FEATURES[plan];

  const limits = useMemo(() => ({
    plan,
    features,

    // Check if user can create a new list
    canCreateList: (currentListCount: number): LimitCheck => {
      const limit = features.maxLists;
      const allowed = limit === Infinity || currentListCount < limit;
      return {
        allowed,
        current: currentListCount,
        limit,
        message: allowed
          ? ""
          : `Has alcanzado el límite de ${limit} listas. Actualiza a Pro para listas ilimitadas.`,
      };
    },

    // Check if user can create a new task
    canCreateTask: (currentTaskCount: number): LimitCheck => {
      const limit = features.maxTasksPerList;
      const allowed = limit === Infinity || currentTaskCount < limit;
      return {
        allowed,
        current: currentTaskCount,
        limit,
        message: allowed
          ? ""
          : `Has alcanzado el límite de ${limit} tareas. Actualiza a Pro para tareas ilimitadas.`,
      };
    },

    // Check if user can add a collaborator
    canAddCollaborator: (currentMemberCount: number): LimitCheck => {
      const limit = features.maxCollaborators;
      const allowed = limit === Infinity || currentMemberCount < limit;
      return {
        allowed,
        current: currentMemberCount,
        limit,
        message: allowed
          ? ""
          : `Has alcanzado el límite de ${limit} colaboradores. Actualiza a Pro para colaboradores ilimitados.`,
      };
    },

    // Check if user can create a team
    canCreateTeam: (currentTeamCount: number): LimitCheck => {
      const limit = features.maxTeams;
      const allowed = limit === Infinity || currentTeamCount < limit;
      return {
        allowed,
        current: currentTeamCount,
        limit,
        message: allowed
          ? ""
          : `Has alcanzado el límite de ${limit} equipos. Actualiza a Business para equipos ilimitados.`,
      };
    },

    // Check if user can add team member
    canAddTeamMember: (currentMemberCount: number): LimitCheck => {
      const limit = features.maxTeamMembers;
      const allowed = limit === Infinity || currentMemberCount < limit;
      return {
        allowed,
        current: currentMemberCount,
        limit,
        message: allowed
          ? ""
          : `Has alcanzado el límite de ${limit} miembros por equipo.`,
      };
    },

    // Check if feature is available
    canUseFeature: (featureName: keyof typeof PLAN_FEATURES["free"]): boolean => {
      const value = features[featureName];
      return typeof value === "boolean" ? value : value > 0;
    },

    // Get numeric limit for a feature
    getLimit: (featureName: keyof typeof PLAN_FEATURES["free"]): number | typeof Infinity => {
      const value = features[featureName];
      return typeof value === "number" ? value : value ? Infinity : 0;
    },

    // Check if plan allows dark mode
    hasDarkMode: features.hasDarkMode,

    // Check if plan allows advanced calendar
    hasAdvancedCalendar: features.hasAdvancedCalendar,

    // Check if plan allows team features
    hasTeamFeatures: features.hasTeamDashboard,

    // Check if plan allows reports
    hasReports: features.hasReports,

    // Check if plan allows recurrence
    canSetRecurrence: features.canSetRecurrence,

  }), [plan, features]);

  return limits;
}

// Hook to check if user needs upgrade
export function useNeedsUpgrade() {
  const { user } = useAuthStore();
  const plan = (user?.plan || "free") as Plan;

  return {
    isFree: plan === "free",
    isPro: plan === "pro",
    isBusiness: plan === "business",
    needsUpgradeForLists: plan === "free",
    needsUpgradeForTeams: plan !== "business",
    needsUpgradeForRecurrence: plan === "free",
    needsUpgradeForReports: plan !== "business",
    currentPlan: plan,
  };
}
