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
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES["free"];

  const limits = useMemo(
    () => ({
      plan,
      features,

      // Check if user can create a new list - No restrictions
      canCreateList: (currentListCount: number): LimitCheck => {
        return {
          allowed: true,
          current: currentListCount,
          limit: Infinity,
          message: "",
        };
      },

      // Check if user can create a new task - No restrictions
      canCreateTask: (currentTaskCount: number): LimitCheck => {
        return {
          allowed: true,
          current: currentTaskCount,
          limit: Infinity,
          message: "",
        };
      },

      // Check if user can add a collaborator - No restrictions
      canAddCollaborator: (currentMemberCount: number): LimitCheck => {
        return {
          allowed: true,
          current: currentMemberCount,
          limit: Infinity,
          message: "",
        };
      },

      // Check if user can create a team - No restrictions
      canCreateTeam: (currentTeamCount: number): LimitCheck => {
        return {
          allowed: true,
          current: currentTeamCount,
          limit: Infinity,
          message: "",
        };
      },

      // Check if user can add team member - No restrictions
      canAddTeamMember: (currentMemberCount: number): LimitCheck => {
        return {
          allowed: true,
          current: currentMemberCount,
          limit: Infinity,
          message: "",
        };
      },

      // Check if feature is available - All features available
      canUseFeature: (
        featureName: keyof (typeof PLAN_FEATURES)["free"],
      ): boolean => {
        return true;
      },

      // Get numeric limit for a feature - All limits are infinite
      getLimit: (
        featureName: keyof (typeof PLAN_FEATURES)["free"],
      ): number | typeof Infinity => {
        return Infinity;
      },

      // Check if plan allows dark mode
      hasDarkMode: true,

      // Check if plan allows advanced calendar
      hasAdvancedCalendar: true,

      // Check if plan allows team features
      hasTeamFeatures: true,

      // Check if plan allows reports
      hasReports: true,

      // Check if plan allows recurrence
      canSetRecurrence: true,
    }),
    [plan, features],
  );

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
