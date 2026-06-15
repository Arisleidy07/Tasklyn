// ============================================
// TASKLYN - Core Type Definitions
// ============================================

export type Plan = "free" | "pro" | "business";

// Legacy support for old plan names
export type LegacyPlan = "FREE" | "PRO" | "ENTERPRISE";

export type MemberRole = "owner" | "admin" | "editor" | "viewer";

export type TaskStatus = "pending" | "completed" | "archived";

export type ListType = "personal" | "shared" | "team";

// ---- Team Types ----
export type TeamRole = "owner" | "admin" | "member";

export interface TeamMember {
  userId: string;
  role: TeamRole;
  joinedAt: string;
  invitedBy?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
  isPersonal?: boolean; // true = equipo Personal (no eliminable, privado)
  color?: string; // hex color for team avatar
  icon?: string; // emoji icon
  settings: {
    allowInvites: boolean;
    requireApproval: boolean;
  };
  // Statistics
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalMembers: number;
    totalLists: number;
  };
}

// ---- Goal Types ----
export interface Goal {
  id: string;
  teamId: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  type: "tasks" | "completion" | "custom";
  period: "weekly" | "monthly" | "quarterly";
  startDate: string;
  endDate: string;
  createdAt: string;
  createdBy: string;
  achieved: boolean;
}

// ---- Achievement Types ----
export interface Achievement {
  id: string;
  userId: string;
  teamId: string;
  type: "daily_top" | "weekly_top" | "monthly_top" | "milestone";
  title: string;
  description: string;
  value: number;
  period: string;
  createdAt: string;
}

// ---- Enhanced Task History ----
export interface TaskHistoryEntry {
  id: string;
  action:
    | "created"
    | "updated"
    | "completed"
    | "archived"
    | "deleted"
    | "assigned"
    | "title_changed"
    | "description_changed"
    | "location_changed"
    | "phones_changed"
    | "due_date_changed"
    | "reminder_set"
    | "recurrence_set"
    | "restored"
    | "auto_created"
    | "reopened";
  performedBy: string; // userId
  performedAt: string;
  details?: string;
  // New fields for performer tracking
  completedBy?: string; // who actually did the work
  assignedTo?: string; // who was assigned
}

// ---- Enhanced Task ----
export interface Task {
  id: string;
  listId: string;
  teamId?: string; // new field for team tasks
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string | null;
  createdBy: string;
  completedBy: string | null;
  performedBy?: string | null; // who actually did the work
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
  // ---- NEW: Team fields ----
  priority?: "low" | "medium" | "high" | "urgent";
  tags?: string[];
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
}

// ---- Enhanced TaskList ----
export interface TaskList {
  id: string;
  name: string;
  owner: string; // userId
  type: ListType;
  teamId?: string; // new field for team lists
  members: ListMember[];
  customNames: Record<string, string>; // userId -> custom display name (set by owner, scoped to this list)
  createdAt: string;
  description?: string;
  // ---- NEW: List settings ----
  color?: string;
  icon?: string;
  isArchived?: boolean;
  archivedAt?: string;
  order?: number;
}

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
  // Subscription info
  subscriptionId?: string;
  subscriptionStatus?:
    | "active"
    | "cancelled"
    | "expired"
    | "past_due"
    | "pending";
  subscriptionCurrentPeriodEnd?: string;
  subscriptionCancelAtPeriodEnd?: boolean;
}

// ---- List Member ----
export interface ListMember {
  userId: string;
  role: MemberRole;
  joinedAt: string;
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
  | "task_edited"
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
  // ---- NEW: Enhanced notification fields ----
  priority?: "low" | "medium" | "high";
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
  teamId?: string;
}

// ---- Invitation ----
export interface Invitation {
  id: string;
  token: string;
  listId: string;
  teamId?: string; // optional teamId if list belongs to a team
  invitedBy: string; // userId
  invitedEmail?: string; // email of invited user (for email-based invitations)
  createdAt: string;
  expiresAt: string;
  defaultRole: MemberRole;
}

// ---- Plan Features ----
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

// Legacy support - will be deprecated
export const PLAN_LIMITS = PLAN_FEATURES;

// ---- Comments ----
export interface TaskComment {
  id: string;
  taskId: string;
  listId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  mentions: string[]; // userIds mentioned via @
  createdAt: string;
  editedAt?: string;
}

// ---- Clients ----
export interface Client {
  id: string;
  ownerId: string; // userId who created
  teamId?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ---- Announcements ----
export interface Announcement {
  id: string;
  teamId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: string;
  readBy: string[]; // userIds who have read
}
