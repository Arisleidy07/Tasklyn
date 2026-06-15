// ============================================
// TASKLYN — Subscription Store
// Manage subscription state and plan limits
// ============================================

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PlanType, PlanInfo, AVAILABLE_PLANS } from "@/types/subscription";
import { PLAN_FEATURES } from "@/types";
import { useAuthStore } from "./authStore";

interface SubscriptionState {
  // Current plan
  currentPlan: PlanType;
  isLoading: boolean;
  error: string | null;

  // UI state
  showUpgradeModal: boolean;
  selectedPlan: PlanType | null;

  // Computed
  canCreateList: (currentListCount: number) => boolean;
  canCreateTask: (currentTaskCount: number) => boolean;
  canAddCollaborator: (currentMemberCount: number) => boolean;
  canUseFeature: (feature: keyof (typeof PLAN_FEATURES)["free"]) => boolean;
  getFeatureLimit: (
    feature: keyof (typeof PLAN_FEATURES)["free"],
  ) => number | boolean;

  // Actions
  setCurrentPlan: (plan: PlanType) => void;
  openUpgradeModal: (plan?: PlanType) => void;
  closeUpgradeModal: () => void;
  upgradePlan: (
    plan: PlanType,
    providerSubscriptionId?: string,
  ) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentPlan: "free",
      isLoading: false,
      error: null,
      showUpgradeModal: false,
      selectedPlan: null,

      // Computed helpers
      canCreateList: (currentListCount: number) => {
        const { currentPlan } = get();
        const maxLists = PLAN_FEATURES[currentPlan].maxLists;
        return currentListCount < maxLists;
      },

      canCreateTask: (currentTaskCount: number) => {
        const { currentPlan } = get();
        const maxTasks = PLAN_FEATURES[currentPlan].maxTasksPerList;
        return currentTaskCount < maxTasks;
      },

      canAddCollaborator: (currentMemberCount: number) => {
        const { currentPlan } = get();
        const maxCollaborators = PLAN_FEATURES[currentPlan].maxCollaborators;
        return currentMemberCount < maxCollaborators;
      },

      canUseFeature: (feature: keyof (typeof PLAN_FEATURES)["free"]) => {
        const { currentPlan } = get();
        return PLAN_FEATURES[currentPlan][feature] as boolean;
      },

      getFeatureLimit: (feature: keyof (typeof PLAN_FEATURES)["free"]) => {
        const { currentPlan } = get();
        return PLAN_FEATURES[currentPlan][feature];
      },

      // Actions
      setCurrentPlan: (plan: PlanType) => {
        set({ currentPlan: plan });
      },

      openUpgradeModal: (plan?: PlanType) => {
        set({ showUpgradeModal: true, selectedPlan: plan || null });
      },

      closeUpgradeModal: () => {
        set({ showUpgradeModal: false, selectedPlan: null });
      },

      upgradePlan: async (plan: PlanType, providerSubscriptionId?: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = useAuthStore.getState().user;
          if (!user) throw new Error("No authenticated user");

          set({ currentPlan: plan, isLoading: false });

          useAuthStore.getState().updateUser({
            plan,
            subscriptionId: providerSubscriptionId,
          });
        } catch (error) {
          console.error("Upgrade failed:", error);
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      cancelSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          useAuthStore.getState().updateUser({
            subscriptionCancelAtPeriodEnd: true,
          });
          set({ isLoading: false });
        } catch (error) {
          console.error("Cancel failed:", error);
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "subscription-store" },
  ),
);

// Sync with auth store
export const initSubscriptionSync = () => {
  const unsubscribe = useAuthStore.subscribe((state) => {
    if (state.user?.plan) {
      useSubscriptionStore.setState({ currentPlan: state.user.plan });
    }
  });

  return unsubscribe;
};
