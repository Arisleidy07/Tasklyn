// ============================================
// TASKLYN — Notification Dispatcher
// Creates Firestore notifications + in-app toast + sound
// ============================================

import { createNotification } from "./firestore";
import { showInAppNotification, playNotificationSound } from "./notifications";
import type { NotificationType } from "@/types";

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  silent?: boolean;
}

/**
 * Send a notification to a specific user.
 * Creates a Firestore document + shows in-app toast + plays sound.
 */
export async function notifyUser(params: NotifyParams): Promise<void> {
  try {
    await createNotification({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      read: false,
      status: "pending",
      data: params.data,
    });

    if (!params.silent) {
      playNotificationSound();
      showInAppNotification(params.title, params.body);
    }
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}

// ── Pre-built notification helpers ──

export function notifyTaskAssigned(
  assignedToUserId: string,
  taskTitle: string,
  assignerName: string,
  taskId: string,
  listId: string,
) {
  return notifyUser({
    userId: assignedToUserId,
    type: "task_assigned",
    title: `${assignerName} te asignó una tarea`,
    body: `"${taskTitle}"`,
    data: { taskId, listId },
  });
}

export function notifyTaskCompleted(
  creatorId: string,
  taskTitle: string,
  completerName: string,
  taskId: string,
  listId: string,
) {
  return notifyUser({
    userId: creatorId,
    type: "task_completed",
    title: `${completerName} completó una tarea`,
    body: `"${taskTitle}"`,
    data: { taskId, listId },
  });
}

export function notifyTaskEdited(
  targetUserId: string,
  taskTitle: string,
  editorName: string,
  taskId: string,
  listId: string,
) {
  return notifyUser({
    userId: targetUserId,
    type: "task_assigned",
    title: `${editorName} editó una tarea`,
    body: `"${taskTitle}"`,
    data: { taskId, listId },
  });
}

export function notifyInvitationAccepted(
  inviterId: string,
  listName: string,
  accepterName: string,
  listId: string,
) {
  return notifyUser({
    userId: inviterId,
    type: "member_joined",
    title: `${accepterName} aceptó tu invitación`,
    body: `Ahora es miembro de "${listName}"`,
    data: { listId },
  });
}

export function notifyInvitationRejected(
  inviterId: string,
  listName: string,
  rejecterName: string,
  listId: string,
) {
  return notifyUser({
    userId: inviterId,
    type: "invitation",
    title: `${rejecterName} rechazó tu invitación`,
    body: `A "${listName}"`,
    data: { listId },
    silent: false,
  });
}

export function notifyReminder(
  userId: string,
  taskTitle: string,
  taskId: string,
  listId: string,
) {
  return notifyUser({
    userId,
    type: "reminder",
    title: "Recordatorio",
    body: `"${taskTitle}"`,
    data: { taskId, listId },
  });
}

export function notifyDueSoon(
  userId: string,
  taskTitle: string,
  dueDate: string,
  taskId: string,
  listId: string,
) {
  return notifyUser({
    userId,
    type: "due_soon",
    title: "Vencimiento próximo",
    body: `"${taskTitle}" vence ${dueDate}`,
    data: { taskId, listId, dueDate },
  });
}

export function notifyMention(
  mentionedUserId: string,
  taskTitle: string,
  mentionerName: string,
  taskId: string,
  listId: string,
) {
  return notifyUser({
    userId: mentionedUserId,
    type: "task_assigned",
    title: `${mentionerName} te mencionó`,
    body: `En "${taskTitle}"`,
    data: { taskId, listId },
  });
}

// ── Mention parsing ──

const MENTION_REGEX = /@([\w\s.-]+)/g;

export function extractMentions(text: string): string[] {
  const mentions: string[] = [];
  let match;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.push(match[1].trim().toLowerCase());
  }
  return [...new Set(mentions)];
}

/**
 * Scan text for @mentions and notify matching users.
 * memberNames: Record<userId, displayName>
 */
export async function notifyMentionsFromText(
  text: string,
  taskTitle: string,
  mentionerName: string,
  taskId: string,
  listId: string,
  memberNames: Record<string, string>,
) {
  const mentions = extractMentions(text);
  if (mentions.length === 0) return;

  // Reverse lookup: name -> userId (case-insensitive)
  const nameToId: Record<string, string> = {};
  Object.entries(memberNames).forEach(([id, name]) => {
    nameToId[name.toLowerCase()] = id;
  });

  for (const mention of mentions) {
    const userId = nameToId[mention];
    if (userId) {
      await notifyMention(userId, taskTitle, mentionerName, taskId, listId);
    }
  }
}
