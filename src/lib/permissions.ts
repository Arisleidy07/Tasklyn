import {
  MemberRole,
  TaskList,
  PLAN_FEATURES,
  Plan,
  PlanFeatures,
} from "@/types";

export function getUserRole(list: TaskList, userId: string): MemberRole | null {
  const member = list.members.find((m) => m.userId === userId);
  return member?.role ?? null;
}

export function canCreateTask(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canEditTask(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canCompleteTask(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canDeleteTask(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canArchiveTask(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canManageTaskOptions(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canInviteMembers(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canRemoveMembers(role: MemberRole | null): boolean {
  return role === "owner";
}

export function canChangeRoles(role: MemberRole | null): boolean {
  return role === "owner";
}

export function canShareList(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canDeleteList(role: MemberRole | null): boolean {
  return role === "owner";
}

export function canEditList(role: MemberRole | null): boolean {
  return role === "owner" || role === "editor";
}

export function canViewMembers(role: MemberRole | null): boolean {
  return role !== null;
}

// Helper to safely get plan features with fallback to free
function getPlanFeatures(plan: Plan | string | undefined): PlanFeatures {
  const validPlan = (plan || "free") as Plan;
  return PLAN_FEATURES[validPlan] || PLAN_FEATURES["free"];
}

// Plan-based checks
export function canCreateMoreLists(
  currentCount: number,
  plan: Plan | string | undefined,
): boolean {
  const features = getPlanFeatures(plan);
  return currentCount < features.maxLists;
}

export function canAddMoreTasks(
  currentCount: number,
  plan: Plan | string | undefined,
): boolean {
  const features = getPlanFeatures(plan);
  return currentCount < features.maxTasksPerList;
}

export function canAddMoreMembers(
  currentCount: number,
  plan: Plan | string | undefined,
): boolean {
  const features = getPlanFeatures(plan);
  return currentCount < features.maxCollaborators;
}

export function canAssignTasks(plan: Plan | string | undefined): boolean {
  const features = getPlanFeatures(plan);
  return features.canAssign;
}

export function canCreateMoreTeams(
  currentCount: number,
  plan: Plan | string | undefined,
): boolean {
  const features = getPlanFeatures(plan);
  return currentCount < features.maxTeams;
}

export function canAddMoreTeamMembers(
  currentCount: number,
  plan: Plan | string | undefined,
): boolean {
  const features = getPlanFeatures(plan);
  return currentCount < features.maxTeamMembers;
}
