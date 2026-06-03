// ============================================
// TASKLYN — Team Store
// Real-time team state management
// ============================================

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Team, TeamMember, Goal, Achievement } from "@/types";
import {
  createTeam,
  getTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  subscribeToUserTeams,
  getUserTeams,
  createGoal,
  updateGoal,
  subscribeToTeamGoals,
  createAchievement,
  subscribeToUserAchievements,
  subscribeToTeamAchievements,
} from "@/lib/firestore";

interface TeamState {
  // Teams
  teams: Team[];
  currentTeam: Team | null;
  loading: boolean;
  error: string | null;

  // Goals
  goals: Goal[];
  goalsLoading: boolean;

  // Achievements
  achievements: Achievement[];
  achievementsLoading: boolean;

  // Actions
  subscribeToTeams: (userId: string) => void;
  unsubscribeFromTeams: () => void;
  refreshTeams: (userId: string) => Promise<void>;
  createTeam: (
    team: Omit<
      Team,
      "id" | "createdAt" | "updatedAt" | "members" | "stats" | "settings"
    >,
    ownerId: string,
  ) => Promise<string>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  addTeamMember: (
    teamId: string,
    userId: string,
    role: "owner" | "admin" | "member",
    invitedBy?: string,
  ) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  updateTeamMemberRole: (
    teamId: string,
    userId: string,
    role: "owner" | "admin" | "member",
  ) => Promise<void>;

  // Goal actions
  subscribeToGoals: (teamId: string) => void;
  unsubscribeFromGoals: () => void;
  createGoal: (goal: Omit<Goal, "id" | "createdAt">) => Promise<string>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;

  // Achievement actions
  subscribeToAchievements: (userId: string) => void;
  subscribeToTeamAchievements: (teamId: string) => void;
  unsubscribeFromAchievements: () => void;
  createAchievement: (
    achievement: Omit<Achievement, "id" | "createdAt">,
  ) => Promise<string>;

  // Utility
  getTeamById: (teamId: string) => Team | null;
  getUserRoleInTeam: (
    teamId: string,
    userId: string,
  ) => "owner" | "admin" | "member" | null;
  isTeamOwner: (teamId: string, userId: string) => boolean;
  isTeamAdmin: (teamId: string, userId: string) => boolean;
}

let teamsUnsubscribe: (() => void) | null = null;
let goalsUnsubscribe: (() => void) | null = null;
let achievementsUnsubscribe: (() => void) | null = null;

export const useTeamStore = create<TeamState>()(
  devtools(
    (set, get) => ({
      // Initial state
      teams: [],
      currentTeam: null,
      loading: false,
      error: null,
      goals: [],
      goalsLoading: false,
      achievements: [],
      achievementsLoading: false,

      // Teams subscription
      subscribeToTeams: (userId: string) => {
        console.log("👥 Subscribing to teams for user:", userId);
        set({ loading: true, error: null });

        teamsUnsubscribe?.(); // Cleanup previous subscription

        teamsUnsubscribe = subscribeToUserTeams(userId, (teams) => {
          console.log("📦 Teams received:", teams.length);
          set({ teams, loading: false });
        });
      },

      unsubscribeFromTeams: () => {
        teamsUnsubscribe?.();
        teamsUnsubscribe = null;
        set({ teams: [], currentTeam: null, loading: false });
      },

      refreshTeams: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const teams = await getUserTeams(userId);
          set({ teams, loading: false });
        } catch (error) {
          console.error("Failed to refresh teams:", error);
          set({ error: (error as Error).message, loading: false });
        }
      },

      createTeam: async (teamData, ownerId: string) => {
        try {
          const teamId = await createTeam({ ...teamData, ownerId });
          console.log("✅ Team created:", teamId);

          // Refresh teams list to include the new team
          await get().refreshTeams(ownerId);

          return teamId;
        } catch (error) {
          console.error("Failed to create team:", error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      updateTeam: async (teamId: string, updates: Partial<Team>) => {
        try {
          await updateTeam(teamId, updates);
          console.log("✅ Team updated:", teamId);
        } catch (error) {
          console.error("Failed to update team:", error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      setCurrentTeam: (team: Team | null) => {
        set({ currentTeam: team });
      },

      addTeamMember: async (
        teamId: string,
        userId: string,
        role: "owner" | "admin" | "member",
        invitedBy?: string,
      ) => {
        try {
          await addTeamMember(teamId, userId, role, invitedBy);
          console.log("✅ Team member added:", userId);
        } catch (error) {
          console.error("Failed to add team member:", error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      removeTeamMember: async (teamId: string, userId: string) => {
        try {
          await removeTeamMember(teamId, userId);
          console.log("✅ Team member removed:", userId);
        } catch (error) {
          console.error("Failed to remove team member:", error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      updateTeamMemberRole: async (
        teamId: string,
        userId: string,
        role: "owner" | "admin" | "member",
      ) => {
        try {
          await updateTeamMemberRole(teamId, userId, role);
          console.log("✅ Team member role updated:", userId, role);
        } catch (error) {
          console.error("Failed to update team member role:", error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Goals subscription
      subscribeToGoals: (teamId: string) => {
        console.log("🎯 Subscribing to goals for team:", teamId);
        set({ goalsLoading: true });

        goalsUnsubscribe?.(); // Cleanup previous subscription

        goalsUnsubscribe = subscribeToTeamGoals(teamId, (goals) => {
          console.log("📦 Goals received:", goals.length);
          set({ goals, goalsLoading: false });
        });
      },

      unsubscribeFromGoals: () => {
        goalsUnsubscribe?.();
        goalsUnsubscribe = null;
        set({ goals: [], goalsLoading: false });
      },

      createGoal: async (goalData) => {
        try {
          const goalId = await createGoal(goalData);
          console.log("✅ Goal created:", goalId);
          return goalId;
        } catch (error) {
          console.error("Failed to create goal:", error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      updateGoal: async (goalId: string, updates: Partial<Goal>) => {
        try {
          await updateGoal(goalId, updates);
          console.log("✅ Goal updated:", goalId);
        } catch (error) {
          console.error("Failed to update goal:", error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Achievements subscription
      subscribeToAchievements: (userId: string) => {
        console.log("🏆 Subscribing to achievements for user:", userId);
        set({ achievementsLoading: true });

        achievementsUnsubscribe?.(); // Cleanup previous subscription

        achievementsUnsubscribe = subscribeToUserAchievements(
          userId,
          (achievements) => {
            console.log("📦 Achievements received:", achievements.length);
            set({ achievements, achievementsLoading: false });
          },
        );
      },

      subscribeToTeamAchievements: (teamId: string) => {
        console.log("🏆 Subscribing to team achievements:", teamId);
        set({ achievementsLoading: true });

        achievementsUnsubscribe?.(); // Cleanup previous subscription

        achievementsUnsubscribe = subscribeToTeamAchievements(
          teamId,
          (achievements) => {
            console.log("📦 Team achievements received:", achievements.length);
            set({ achievements, achievementsLoading: false });
          },
        );
      },

      unsubscribeFromAchievements: () => {
        achievementsUnsubscribe?.();
        achievementsUnsubscribe = null;
        set({ achievements: [], achievementsLoading: false });
      },

      createAchievement: async (achievementData) => {
        try {
          const achievementId = await createAchievement(achievementData);
          console.log("✅ Achievement created:", achievementId);
          return achievementId;
        } catch (error) {
          console.error("Failed to create achievement:", error);
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Utility methods
      getTeamById: (teamId: string) => {
        const { teams } = get();
        return teams.find((team) => team.id === teamId) || null;
      },

      getUserRoleInTeam: (teamId: string, userId: string) => {
        const team = get().getTeamById(teamId);
        if (!team) return null;
        const member = team.members.find((m) => m.userId === userId);
        return member?.role || null;
      },

      isTeamOwner: (teamId: string, userId: string) => {
        return get().getUserRoleInTeam(teamId, userId) === "owner";
      },

      isTeamAdmin: (teamId: string, userId: string) => {
        const role = get().getUserRoleInTeam(teamId, userId);
        return role === "owner" || role === "admin";
      },
    }),
    { name: "team-store" },
  ),
);
