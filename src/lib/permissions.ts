import { MemberRole, TaskList, PLAN_LIMITS, Plan } from '@/types';

export function getUserRole(list: TaskList, userId: string): MemberRole | null {
  const member = list.members.find((m) => m.userId === userId);
  return member?.role ?? null;
}

export function canCreateTask(role: MemberRole | null): boolean {
  return role === 'owner' || role === 'editor';
}

export function canEditTask(role: MemberRole | null): boolean {
  return role === 'owner' || role === 'editor';
}

export function canCompleteTask(role: MemberRole | null): boolean {
  return role === 'owner';
}

export function canDeleteTask(role: MemberRole | null): boolean {
  return role === 'owner';
}

export function canInviteMembers(role: MemberRole | null): boolean {
  return role === 'owner';
}

export function canRemoveMembers(role: MemberRole | null): boolean {
  return role === 'owner';
}

export function canChangeRoles(role: MemberRole | null): boolean {
  return role === 'owner';
}

export function canShareList(role: MemberRole | null): boolean {
  return role === 'owner';
}

export function canDeleteList(role: MemberRole | null): boolean {
  return role === 'owner';
}

export function canEditList(role: MemberRole | null): boolean {
  return role === 'owner';
}

// Plan-based checks
export function canCreateMoreLists(currentCount: number, plan: Plan): boolean {
  return currentCount < PLAN_LIMITS[plan].maxLists;
}

export function canAddMoreTasks(currentCount: number, plan: Plan): boolean {
  return currentCount < PLAN_LIMITS[plan].maxTasksPerList;
}

export function canAddMoreMembers(currentCount: number, plan: Plan): boolean {
  return currentCount < PLAN_LIMITS[plan].maxMembersPerList;
}

export function canAssignTasks(plan: Plan): boolean {
  return PLAN_LIMITS[plan].canAssign;
}
