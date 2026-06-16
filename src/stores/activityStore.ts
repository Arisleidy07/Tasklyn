"use client";

import { create } from "zustand";
import { subscribeToUserActivity, subscribeToListActivity } from "@/lib/activity";
import { subscribeToTeamActivity } from "@/lib/teamActivity";

export type ActivityAction =
  | "created"
  | "completed"
  | "updated"
  | "deleted"
  | "archived"
  | "restored"
  | "assigned"
  | "commented"
  | "invited"
  | "joined"
  | "left"
  | "role_changed"
  | "custom_name_set";

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  action: ActivityAction;
  targetType: "task" | "list" | "team" | "comment";
  targetId: string;
  targetName: string;
  listId?: string;
  listName?: string;
  teamId?: string;
  teamName?: string;
  details?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface ActivityState {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc: any | null;

  // Subscriptions
  unsubscribeUser: (() => void) | null;
  unsubscribeLists: Map<string, () => void>;
  unsubscribeTeams: Map<string, () => void>;

  // Actions
  subscribeToUserActivity: (userId: string) => void;
  subscribeToListActivity: (listId: string) => void;
  unsubscribeFromList: (listId: string) => void;
  subscribeToTeamActivity: (teamId: string) => void;
  unsubscribeFromTeam: (teamId: string) => void;
  addActivity: (activity: ActivityItem) => void;
  updateActivity: (activity: ActivityItem) => void;
  removeActivity: (activityId: string) => void;
  clearActivities: () => void;
  cleanup: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  loading: false,
  error: null,
  hasMore: true,
  lastDoc: null,

  unsubscribeUser: null,
  unsubscribeLists: new Map(),
  unsubscribeTeams: new Map(),

  subscribeToUserActivity: (userId: string) => {
    // Unsubscribe from previous user subscription if any
    const currentUnsub = get().unsubscribeUser;
    if (currentUnsub) {
      currentUnsub();
    }

    const unsubscribe = subscribeToUserActivity(userId, (activities) => {
      set((state) => {
        // Merge new activities with existing ones, removing duplicates
        const existingIds = new Set(state.activities.map((a) => a.id));
        const newActivities = activities.filter((a) => !existingIds.has(a.id));

        const merged = [...newActivities, ...state.activities]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 100); // Keep last 100 activities

        return { activities: merged };
      });
    });

    set({ unsubscribeUser: unsubscribe });
  },

  subscribeToListActivity: (listId: string) => {
    const existing = get().unsubscribeLists.get(listId);
    if (existing) return; // Already subscribed

    const unsubscribe = subscribeToListActivity(listId, (activities) => {
      set((state) => {
        const existingIds = new Set(state.activities.map((a) => a.id));
        const newActivities = activities.filter((a) => !existingIds.has(a.id));

        const merged = [...newActivities, ...state.activities]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 100);

        return { activities: merged };
      });
    });

    set((state) => ({
      unsubscribeLists: new Map(state.unsubscribeLists).set(
        listId,
        unsubscribe
      ),
    }));
  },

  unsubscribeFromList: (listId: string) => {
    const unsubscribe = get().unsubscribeLists.get(listId);
    if (unsubscribe) {
      unsubscribe();
      set((state) => {
        const newMap = new Map(state.unsubscribeLists);
        newMap.delete(listId);
        return { unsubscribeLists: newMap };
      });
    }
  },

  subscribeToTeamActivity: (teamId: string) => {
    const existing = get().unsubscribeTeams.get(teamId);
    if (existing) return;

    const unsubscribe = subscribeToTeamActivity(teamId, (activities) => {
      set((state) => {
        const existingIds = new Set(state.activities.map((a) => a.id));
        const newActivities = activities.filter((a) => !existingIds.has(a.id));

        const merged = [...newActivities, ...state.activities]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 100);

        return { activities: merged };
      });
    });

    set((state) => ({
      unsubscribeTeams: new Map(state.unsubscribeTeams).set(
        teamId,
        unsubscribe
      ),
    }));
  },

  unsubscribeFromTeam: (teamId: string) => {
    const unsubscribe = get().unsubscribeTeams.get(teamId);
    if (unsubscribe) {
      unsubscribe();
      set((state) => {
        const newMap = new Map(state.unsubscribeTeams);
        newMap.delete(teamId);
        return { unsubscribeTeams: newMap };
      });
    }
  },

  addActivity: (activity: ActivityItem) => {
    set((state) => {
      // Check if activity already exists
      if (state.activities.some((a) => a.id === activity.id)) {
        return state;
      }
      const merged = [activity, ...state.activities]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 100);
      return { activities: merged };
    });
  },

  updateActivity: (activity: ActivityItem) => {
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activity.id ? activity : a
      ),
    }));
  },

  removeActivity: (activityId: string) => {
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== activityId),
    }));
  },

  clearActivities: () => {
    set({ activities: [], lastDoc: null, hasMore: true });
  },

  cleanup: () => {
    // Unsubscribe from all
    const state = get();
    if (state.unsubscribeUser) {
      state.unsubscribeUser();
    }
    state.unsubscribeLists.forEach((unsub) => unsub());
    state.unsubscribeTeams.forEach((unsub) => unsub());
    set({
      unsubscribeUser: null,
      unsubscribeLists: new Map(),
      unsubscribeTeams: new Map(),
    });
  },
}));
