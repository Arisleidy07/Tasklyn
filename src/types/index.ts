// ============================================
// TASKLYN - Core Type Definitions
// ============================================

export type Plan = "FREE" | "PRO";

export type MemberRole = "owner" | "editor" | "viewer";

export type TaskStatus = "pending" | "completed";

export type ListType = "personal" | "shared";

// ---- User ----
export interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  plan: Plan;
  createdAt: string;
}

// ---- List Member ----
export interface ListMember {
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

// ---- Task History Entry ----
export interface TaskHistoryEntry {
  id: string;
  action: string;
  performedBy: string; // userId
  performedAt: string;
  details?: string;
}

// ---- Task ----
export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string | null; // userId or null
  createdBy: string; // userId
  completedBy: string | null; // userId - CRITICAL: tracks who completed
  createdAt: string;
  completedAt: string | null;
  history: TaskHistoryEntry[];
}

// ---- TaskList ----
export interface TaskList {
  id: string;
  name: string;
  owner: string; // userId
  type: ListType;
  members: ListMember[];
  customNames: Record<string, string>; // userId -> custom display name (set by owner, scoped to this list)
  createdAt: string;
  description?: string;
}

// ---- Invitation ----
export interface Invitation {
  id: string;
  token: string;
  listId: string;
  invitedBy: string; // userId
  createdAt: string;
  expiresAt: string;
  defaultRole: MemberRole;
}

// ---- Plan Limits ----
export interface PlanLimits {
  maxLists: number;
  maxTasksPerList: number;
  maxMembersPerList: number;
  canShare: boolean;
  canAssign: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxLists: 5,
    maxTasksPerList: 20,
    maxMembersPerList: 3,
    canShare: true,
    canAssign: false,
  },
  PRO: {
    maxLists: Infinity,
    maxTasksPerList: Infinity,
    maxMembersPerList: Infinity,
    canShare: true,
    canAssign: true,
  },
};
