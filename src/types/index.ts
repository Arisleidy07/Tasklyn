// ============================================
// TASKLYN - Core Type Definitions
// ============================================

export type Plan = "FREE" | "PRO";

export type MemberRole = "owner" | "editor" | "viewer";

export type TaskStatus = "pending" | "completed" | "archived";

export type ListType = "personal" | "shared";

// ---- Recurrence ----
export type RecurrenceType =
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday ... 6=Saturday
  endDate?: string | null;
  occurrences?: number | null;
}

// ---- Reminder ----
export interface TaskReminder {
  id: string;
  at: string; // ISO datetime
  sent: boolean;
}

// ---- Due Date Status ----
export type DueStatus = "overdue" | "dueSoon" | "upcoming" | "noDue";

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
  assignedTo: string | null;
  createdBy: string;
  completedBy: string | null;
  createdAt: string;
  completedAt: string | null;
  history: TaskHistoryEntry[];
  phoneNumbers?: string[];
  location?: string;
  archivedAt?: string | null;
  archivedBy?: string | null;
  // ---- NEW: Due Date & Reminder & Recurrence ----
  dueDate?: string | null; // ISO date string (YYYY-MM-DD)
  dueTime?: string | null; // HH:mm
  reminders?: TaskReminder[];
  recurrence?: RecurrenceConfig | null;
  parentTaskId?: string | null; // for generated recurring tasks
  completedCount?: number; // how many times this recurring task has been completed
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

// ---- Notification ----
export type NotificationType =
  | "invitation"
  | "task_assigned"
  | "task_completed"
  | "member_joined"
  | "list_shared"
  | "reminder"
  | "due_soon";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  status?: "pending" | "accepted" | "rejected" | "archived";
  createdAt: string;
  data?: Record<string, string>;
}

// ---- Invitation ----
export interface Invitation {
  id: string;
  token: string;
  listId: string;
  invitedBy: string; // userId
  invitedEmail?: string; // email of invited user (for email-based invitations)
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
