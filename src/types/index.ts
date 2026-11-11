// ============================================
// TASKLYN - Core Type Definitions
// ============================================

export type Plan = "free" | "pro" | "business";

// Legacy support for old plan names
export type LegacyPlan = "FREE" | "PRO" | "ENTERPRISE";

export type MemberRole = "owner" | "admin" | "editor" | "viewer";

export type TaskStatus = "pending" | "completed" | "archived";

export type ListType = "shared" | "team";

// ---- Team Types ----
export type TeamRole = "owner" | "admin" | "member";

export interface TeamMember {
  userId: string;
  role: TeamRole;
  joinedAt: string;
  invitedBy?: string;
}

export interface TeamFolder {
  id: string;
  name: string;
  order: number;
  color?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  owner: string;
  members: TeamMember[]; // kept for backward compat during migration
  memberIds?: string[]; // kept for backward compat during migration
  createdAt: string;
  updatedAt: string;
  color?: string;
  icon?: string;
  photoURL?: string;
  folders?: TeamFolder[];
  settings: {
    allowInvites: boolean;
    allowMemberCreateLists: boolean;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalMembers: number;
    totalLists: number;
  };
}

export type TeamActivityAction =
  | "task_created"
  | "task_completed"
  | "task_updated"
  | "task_deleted"
  | "task_assigned"
  | "task_restored"
  | "comment_added"
  | "list_created"
  | "list_deleted"
  | "list_moved"
  | "member_invited"
  | "member_joined"
  | "member_removed"
  | "member_role_changed"
  | "team_created"
  | "team_renamed";

export interface TeamActivityEntry {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  action: TeamActivityAction;
  entityType: "task" | "list" | "member" | "team";
  entityId: string;
  entityName: string;
  detail: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface TeamScore {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  xpTotal: number;
  xpWeek: number;
  xpMonth: number;
  level: number;
  rankPosition: number;
  tasksCompleted: number;
  tasksCreated: number;
  commentsAdded: number;
  tasksAssigned: number;
  streak: number;
  longestStreak: number;
  lastStreakDate: string;
  achievementsCount: number;
  updatedAt: string;
}

export interface Background {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  uploadedBy: string;
  width?: number;
  height?: number;
  order?: number;
  createdAt: string;
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
    | "priority_changed"
    | "reminder_set"
    | "recurrence_set"
    | "restored"
    | "auto_created"
    | "reopened"
    | "comment_added"
    | "comment_deleted"
    | "comment_edited";
  performedBy: string; // userId
  performedByName?: string; // nombre del usuario (para mostrar sin necesidad de resolver)
  performedAt: string;
  details?: string;
  // New fields for performer tracking
  completedBy?: string; // who actually did the work
  completedByName?: string; // nombre de quien marcó como completada
  performedByTaskName?: string; // nombre de quien realizó físicamente la tarea
  assignedTo?: string; // who was assigned
  previousValue?: string; // valor anterior al cambio
  newValue?: string; // valor nuevo tras el cambio
}

// ---- Task ----
export interface Task {
  id: string;
  listId: string;
  teamId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string | null;
  createdBy: string;
  completedBy: string | null;
  performedBy?: string | null;
  createdAt: string;
  completedAt: string | null;
  history: TaskHistoryEntry[];
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  phoneNumbers?: string[];
  location?: string;
  locationUrl?: string;
  archivedAt?: string | null;
  archivedBy?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  reminders?: TaskReminder[];
  recurrence?: RecurrenceConfig | null;
  parentTaskId?: string | null;
  completedCount?: number;
  priority?: "low" | "normal" | "medium" | "high" | "urgent";
  tags?: string[];
  estimatedTime?: number;
  actualTime?: number;
  order?: number;
  showPreviewInCard?: boolean;
}

// ---- TaskList ----
export interface TaskList {
  id: string;
  name: string;
  owner: string;
  type: ListType;
  teamId?: string;
  folderId?: string;
  members: ListMember[];
  memberIds?: string[];
  customNames: Record<string, string>;
  createdAt: string;
  description?: string;
  color?: string;
  icon?: string;
  backgroundImage?: string;
  isArchived?: boolean;
  archivedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
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
  recipientType?: "me" | "team" | "members";
  recipientIds?: string[];
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

// ---- Notification ----
export type NotificationType =
  | "team_invitation"
  | "list_invitation"
  | "invitation"
  | "task_assigned"
  | "task_completed"
  | "task_edited"
  | "comment_added"
  | "member_joined"
  | "role_changed"
  | "removed_from_team"
  | "list_shared"
  | "reminder"
  | "due_soon"
  | "due_24h"
  | "due_2h";

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
  type: "team" | "list";
  targetId: string; // teamId or listId
  targetName?: string;
  inviterName?: string;
  listId?: string; // kept for backward compat
  teamId?: string; // kept for backward compat
  invitedBy: string;
  invitedEmail?: string;
  defaultRole: string; // TeamRole for teams, MemberRole for lists
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
  declinedAt?: string;
  declinedBy?: string;
}

// ---- Plan Features ----
// Single source of truth lives in src/lib/planFeatures.ts
export type { PlanFeatures } from "@/lib/planFeatures";
export { PLAN_FEATURES } from "@/lib/planFeatures";

// Legacy support - will be deprecated
export { PLAN_FEATURES as PLAN_LIMITS } from "@/lib/planFeatures";

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
  editedBy?: string;
}

// ---- Task Attachments ----
export type AttachmentCategory = "image" | "video" | "file";

export interface TaskAttachment {
  id: string;
  taskId: string;
  name: string;
  type: string; // MIME type
  size: number; // bytes
  category: AttachmentCategory;
  url: string;
  storagePath: string;
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: string;
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

// ---- Background Image Categories ----
export interface BgCategoryConfig {
  id: string;
  name: string;
  emoji?: string;
  color?: string; // hex color
  order: number; // for sorting
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// ---- Technician Reports ----
export type ServiceType =
  | "INSTALACION"
  | "AVERIA"
  | "REVISION"
  | "RETIRO"
  | "CAMBIO_DE_CABLE"
  | "CAMBIO_DE_TERMINAL"
  | "CAMBIO_ROUTER"
  | "TRASLADO"
  | "OTROS";

export type ReportResult =
  | "TERMINADO"
  | "PENDIENTE"
  | "NO_SE_PUDO_REALIZAR"
  | "OTROS";

export interface ReportEvidence {
  id: string;
  type: "location_photo" | "work_evidence";
  url: string;
  storagePath: string;
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // bytes
  uploadedAt: string;
}

export interface TechnicianReport {
  id: string;
  // Report metadata
  createdBy: string; // userId of the technician
  createdByName: string; // Historical name of the technician
  createdAt: string; // ISO timestamp
  reportTime: string; // Time of report submission (editable)
  updatedAt?: string; // Last modification timestamp

  // Service information
  serviceDate: string; // Date of service (YYYY-MM-DD)
  serviceType: ServiceType;
  serviceTypeOther?: string; // Description when serviceType is "OTROS"

  // Client information
  clientNameOrCode: string;
  clientPhone: string;

  // Work details
  arrivalTime: string; // HH:MM format
  departureTime: string; // HH:MM format
  amountCharged?: number; // Optional amount

  // Location and evidence
  locationGPS: string; // GPS coordinates or Google Maps link
  evidences: ReportEvidence[]; // Array of evidence files

  // Result
  result: ReportResult;
  resultOther?: string; // Description when result is "OTROS"

  // Declaration
  declarationConfirmed: boolean;
  declarationConfirmedAt: string;

  // Optional task linking
  linkedTaskId?: string; // Optional reference to a Task

  // For supervisor tracking
  teamId?: string; // Optional team assignment for supervision
}

// ---- Forms ----
export type QuestionType =
  | "short_text"
  | "paragraph"
  | "multiple_choice"
  | "checkbox"
  | "dropdown"
  | "date"
  | "time"
  | "number"
  | "phone"
  | "email"
  | "file_upload"
  | "image_upload"
  | "video_upload"
  | "linear_scale"
  | "rating"
  | "information"
  | "header"
  | "location"
  | "confirmation";

export type FormStatus = "draft" | "published" | "paused" | "archived";

export type FormRole = "owner" | "editor" | "participant" | "viewer";

export interface QuestionOption {
  id: string;
  label: string;
  order: number;
}

export interface QuestionValidation {
  required: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  customMessage?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  validation?: QuestionValidation;
  options?: QuestionOption[];
  allowOther?: boolean;
  otherLabel?: string;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  min?: number;
  max?: number;
  step?: number;
  formula?: string; // For calculated fields
  conditions?: QuestionCondition[];
  sectionId?: string; // For grouping questions
}

export interface QuestionCondition {
  questionId: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than";
  value: string | number | boolean;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface Form {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  headerImage?: string;
  headerImageStoragePath?: string;
  status: FormStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  questions: Question[];
  sections?: FormSection[];
  settings: {
    allowResponses: boolean;
    requireLogin: boolean;
    collectEmail: boolean;
    showProgressBar: boolean;
    shuffleQuestions: boolean;
    limitResponses?: number;
  };
  responseCount: number;
}

export interface FormParticipant {
  userId: string;
  userName: string;
  role: FormRole;
  addedAt: string;
  addedBy: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  formVersion: number; // Track form version at time of response
  formTitle: string; // Historical title
  respondentId: string;
  respondentName: string;
  respondentEmail?: string;
  submittedAt: string;
  status: "draft" | "submitted";
  answers: Record<string, any>; // questionId -> answer
  files: ResponseFile[];
  completedPercentage?: number; // For progress tracking
}

export interface ResponseFile {
  id: string;
  questionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  storagePath: string;
  uploadedAt: string;
}
