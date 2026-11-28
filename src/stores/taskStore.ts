"use client";

import { create } from "zustand";
import {
  createTask as createTaskInDb,
  updateTask as updateTaskInDb,
  deleteTask as deleteTaskInDb,
  subscribeToListTasks,
  addTaskHistoryEntry,
  addTaskAttachment,
  deleteTaskAttachmentMetadata,
  subscribeToTaskAttachments,
  createTasksBatch,
  getExistingTaskIds,
  refreshTaskAttachmentSummary,
  deleteTasksBatch,
} from "@/lib/firestore";
import {
  uploadTaskAttachment,
  deleteTaskAttachment as deleteTaskAttachmentFromStorage,
} from "@/lib/storage";
import { canAddMoreTasks } from "@/lib/permissions";
import { PLAN_FEATURES } from "@/types";
import type {
  Task,
  TaskStatus,
  Plan,
  TaskHistoryEntry,
  RecurrenceConfig,
  TaskReminder,
  TaskAttachment,
} from "@/types";
import { Unsubscribe } from "firebase/firestore";
import {
  notifyTaskCompleted,
  notifyTaskAssigned,
  notifyTaskEdited,
  notifyPriorityChanged,
  notifyDescriptionChanged,
} from "@/lib/notify";
import { toISODate } from "@/lib/dateUtils";
import {
  logTaskCreated,
  logTaskCompleted,
  logTaskUpdated,
  logTaskDeleted,
  logTaskAssigned,
} from "@/lib/activity";
import { logTeamActivity } from "@/lib/firestore";
import { useAuthStore } from "./authStore";
import { useListStore } from "./listStore";

export interface BulkTaskInput {
  id: string;
  title: string;
  description?: string;
  phoneNumbers?: string[];
  location?: string;
  locationUrl?: string;
  priority?: "low" | "normal" | "medium" | "high" | "urgent";
  dueDate?: string;
  dueTime?: string;
  assignedTo?: string | null;
}

function firestoreErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  if (code === "permission-denied") {
    return "No tienes permiso para crear tareas en esta lista.";
  }
  if (code === "unavailable" || code === "deadline-exceeded") {
    return "Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.";
  }
  if (code === "resource-exhausted") {
    return "Se alcanzó el límite de operaciones. Inténtalo en unos minutos.";
  }
  return error instanceof Error ? error.message : "No se pudieron guardar las tareas.";
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  taskUnsubscribes: Map<string, Unsubscribe>;
  pendingOrder: Map<string, number>; // taskId -> optimistic order while Firestore write is in-flight
  getTasksByList: (listId: string) => Task[];
  getTask: (id: string) => Task | undefined;
  createTask: (params: {
    listId: string;
    title: string;
    description?: string;
    createdBy: string;
    assignedTo?: string | null;
    location?: string;
    locationUrl?: string;
    phoneNumbers?: string[];
    dueDate?: string | null;
    dueTime?: string | null;
    reminders?: TaskReminder[];
    recurrence?: RecurrenceConfig | null;
    priority?: "low" | "normal" | "medium" | "high" | "urgent";
    tags?: string[];
    attachments?: Array<{
      file: File;
      uploadedBy: string;
      uploadedByName: string;
    }>;
    /** Per-file upload progress (index in `attachments`, 0-100). */
    onAttachmentProgress?: (index: number, progress: number) => void;
  }) => Promise<Task & { failedAttachments: Array<{ file: File; error: string }> }>;
  /**
   * Create many tasks at once (quick-add / paste). Task IDs are reserved by the
   * caller so retries hit the same documents and never duplicate.
   */
  createTasksBulk: (params: {
    listId: string;
    createdBy: string;
    tasks: BulkTaskInput[];
    /** When true, IDs already present on the server count as saved (retry). */
    isRetry?: boolean;
  }) => Promise<{ savedIds: string[]; failedIds: string[]; error?: string }>;
  /** Revert a bulk creation: deletes exactly those task IDs. */
  undoBulkCreate: (ids: string[]) => Promise<void>;
  updateTask: (
    id: string,
    updates: Partial<
      Pick<
        Task,
        | "title"
        | "description"
        | "assignedTo"
        | "location"
        | "locationUrl"
        | "phoneNumbers"
        | "dueDate"
        | "dueTime"
        | "reminders"
        | "recurrence"
        | "priority"
        | "tags"
        | "order"
        | "showPreviewInCard"
      >
    >,
    performedBy: string,
    performerName?: string,
  ) => Promise<void>;
  generateNextRecurringTask: (task: Task) => Promise<Task | null>;
  archiveTask: (id: string, archivedBy: string) => Promise<void>;
  unarchiveTask: (id: string, performedBy: string) => Promise<void>;
  completeTask: (
    id: string,
    completedBy: string,
    completerName?: string,
    listMembers?: Array<{ userId: string; role: string }>,
    performedByUser?: { id: string; name: string },
  ) => Promise<void>;
  uncompleteTask: (id: string, performedBy: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  subscribeToList: (listId: string) => void;
  unsubscribeFromList: (listId: string) => void;
  unsubscribeAll: () => void;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  // Attachment methods
  addAttachment: (
    taskId: string,
    file: File,
    uploadedBy: string,
    uploadedByName: string,
    onProgress?: (progress: number) => void,
  ) => Promise<string>;
  deleteAttachment: (
    taskId: string,
    attachmentId: string,
    storagePath: string,
    thumbStoragePath?: string,
  ) => Promise<void>;
  subscribeToAttachments: (
    taskId: string,
    callback: (attachments: TaskAttachment[]) => void,
  ) => Unsubscribe;
}

// ---- Helper functions ----

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRecurrenceLabel(rec: RecurrenceConfig): string {
  const labels: Record<string, string> = {
    daily: "Diariamente",
    weekdays: "Días laborales",
    weekly: "Semanalmente",
    monthly: "Mensualmente",
    yearly: "Anualmente",
    custom: "Personalizado",
  };
  if (rec.type !== "custom") return labels[rec.type] || rec.type;
  if (rec.interval && rec.interval > 1) {
    const unit = rec.daysOfWeek ? "semanas" : "días";
    return `Cada ${rec.interval} ${unit}`;
  }
  return "Personalizado";
}

function getPriorityLabel(
  priority?: "low" | "normal" | "medium" | "high" | "urgent" | null,
): string {
  const labels: Record<string, string> = {
    low: "Baja",
    normal: "Normal",
    medium: "Media",
    high: "Alta",
    urgent: "Urgente",
  };
  return labels[priority || "normal"] || "Normal";
}

function calculateNextDueDate(
  task: Task,
): { dueDate: string; dueTime?: string } | null {
  if (!task.recurrence || !task.dueDate) return null;

  const current = new Date(
    task.dueDate + (task.dueTime ? `T${task.dueTime}` : "T00:00:00"),
  );
  let next = new Date(current);

  switch (task.recurrence.type) {
    case "daily":
      next.setDate(current.getDate() + (task.recurrence.interval || 1));
      break;
    case "weekdays": {
      let daysToAdd = 1;
      const temp = new Date(current);
      temp.setDate(temp.getDate() + daysToAdd);
      while (temp.getDay() === 0 || temp.getDay() === 6) {
        daysToAdd++;
        temp.setDate(current.getDate() + daysToAdd);
      }
      next = temp;
      break;
    }
    case "weekly":
      next.setDate(current.getDate() + 7 * (task.recurrence.interval || 1));
      break;
    case "monthly":
      next.setMonth(current.getMonth() + (task.recurrence.interval || 1));
      break;
    case "yearly":
      next.setFullYear(current.getFullYear() + (task.recurrence.interval || 1));
      break;
    case "custom": {
      if (task.recurrence.daysOfWeek && task.recurrence.daysOfWeek.length > 0) {
        // Find next day of week
        const currentDay = current.getDay();
        const sorted = [...task.recurrence.daysOfWeek].sort((a, b) => a - b);
        let nextDay = sorted.find((d) => d > currentDay);
        if (nextDay === undefined) {
          nextDay = sorted[0];
          next.setDate(current.getDate() + (7 - currentDay + nextDay));
        } else {
          next.setDate(current.getDate() + (nextDay - currentDay));
        }
      } else {
        next.setDate(current.getDate() + (task.recurrence.interval || 1));
      }
      break;
    }
    default:
      next.setDate(current.getDate() + 1);
  }

  // Check end date
  if (task.recurrence.endDate && next > new Date(task.recurrence.endDate)) {
    return null;
  }

  // Check occurrences
  if (
    task.recurrence.occurrences &&
    (task.completedCount || 0) >= task.recurrence.occurrences
  ) {
    return null;
  }

  return {
    dueDate: toISODate(next),
    dueTime: task.dueTime || undefined,
  };
}

function createHistoryEntry(
  action: TaskHistoryEntry["action"],
  performedBy: string,
  details?: string,
  extraFields?: Partial<TaskHistoryEntry> & {
    previousValue?: string;
    newValue?: string;
  },
): TaskHistoryEntry {
  const currentUser = useAuthStore.getState().user;
  return {
    id: Math.random().toString(36).slice(2),
    action,
    performedBy,
    performedByName: currentUser?.name || "Usuario",
    performedAt: new Date().toISOString(),
    details,
    ...(extraFields?.previousValue !== undefined && {
      previousValue: extraFields.previousValue,
    }),
    ...(extraFields?.newValue !== undefined && {
      newValue: extraFields.newValue,
    }),
    ...extraFields,
  };
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  taskUnsubscribes: new Map(),
  pendingOrder: new Map(),

  getTasksByList: (listId) => get().tasks.filter((t) => t.listId === listId),

  getTask: (id) => get().tasks.find((t) => t.id === id),

  createTask: async ({
    listId,
    title,
    description,
    createdBy,
    assignedTo,
    location,
    locationUrl,
    phoneNumbers,
    dueDate,
    dueTime,
    reminders,
    recurrence,
    priority,
    tags,
    attachments,
    onAttachmentProgress,
  }) => {
    const list = useListStore
      .getState()
      .lists.find((item) => item.id === listId);
    const newTaskData = {
      teamId: list?.teamId,
      listId,
      isDeleted: false,
      title,
      description: description || "",
      status: "pending" as TaskStatus,
      assignedTo: assignedTo || null,
      createdBy,
      completedBy: null,
      completedAt: null,
      location: location || undefined,
      locationUrl: locationUrl || undefined,
      phoneNumbers: phoneNumbers || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      reminders: reminders || undefined,
      recurrence: recurrence || undefined,
      priority: priority || "normal",
      tags: tags || [],
      parentTaskId: null,
      completedCount: 0,
    };

    const id = await createTaskInDb(newTaskData);

    // Upload attachments AFTER the task document exists: Storage rules
    // resolve permissions through tasks/{id}, so uploading first would be
    // rejected (403) and leave orphan files.
    const failedAttachments: Array<{ file: File; error: string }> = [];
    if (attachments && attachments.length > 0) {
      for (let index = 0; index < attachments.length; index++) {
        const attachment = attachments[index];
        try {
          await get().addAttachment(
            id,
            attachment.file,
            attachment.uploadedBy,
            attachment.uploadedByName,
            (p) => onAttachmentProgress?.(index, p),
          );
          onAttachmentProgress?.(index, 100);
        } catch (error) {
          console.error(
            `[createTask] Failed to upload attachment: ${attachment.file.name}`,
            error,
          );
          failedAttachments.push({
            file: attachment.file,
            error: error instanceof Error ? error.message : "Error al subir el archivo",
          });
          onAttachmentProgress?.(index, -1);
        }
      }
    }

    const createdEntry = createHistoryEntry(
      "created",
      createdBy,
      `Tarea "${title}" creada`,
    );
    const { id: _entryId, ...entryData } = createdEntry;
    await addTaskHistoryEntry(id, entryData);

    // Log activity
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      logTaskCreated(
        { id, title, listId, listName: list?.name },
        {
          id: currentUser.id,
          name: currentUser.name || "Usuario",
          photoURL: currentUser.photoURL,
        },
      );
      // Team activity subcollection
      if (list?.teamId) {
        logTeamActivity(list.teamId, {
          teamId: list.teamId,
          userId: currentUser.id,
          userName: currentUser.name || "Usuario",
          userPhotoURL: currentUser.photoURL,
          action: "task_created",
          entityType: "task",
          entityId: id,
          entityName: title,
          detail: `${currentUser.name || "Usuario"} creó la tarea "${title}"`,
        });
      }
    }

    return {
      ...({
        id,
        ...newTaskData,
        createdAt: new Date().toISOString(),
        history: [],
      } as Task),
      failedAttachments,
    };
  },

  createTasksBulk: async ({ listId, createdBy, tasks, isRetry }) => {
    const list = useListStore
      .getState()
      .lists.find((item) => item.id === listId);
    const currentUser = useAuthStore.getState().user;

    let pending = tasks;
    const alreadySaved: string[] = [];
    if (isRetry && tasks.length > 0) {
      // A previous attempt may have committed even though the response was
      // lost (flaky network). Never rewrite those.
      const existing = new Set(await getExistingTaskIds(tasks.map((t) => t.id)));
      alreadySaved.push(...tasks.filter((t) => existing.has(t.id)).map((t) => t.id));
      pending = tasks.filter((t) => !existing.has(t.id));
    }

    const base = Date.now();
    const items = pending.map((t, i) => ({
      id: t.id,
      // Same shape as createTask() so both creation paths are identical
      data: {
        teamId: list?.teamId,
        listId,
        isDeleted: false,
        title: t.title,
        description: t.description || "",
        status: "pending" as TaskStatus,
        assignedTo: t.assignedTo || null,
        createdBy,
        completedBy: null,
        completedAt: null,
        location: t.location || undefined,
        locationUrl: t.locationUrl || undefined,
        phoneNumbers: t.phoneNumbers?.length ? t.phoneNumbers : undefined,
        dueDate: t.dueDate || undefined,
        dueTime: t.dueDate && t.dueTime ? t.dueTime : undefined,
        priority: t.priority || "normal",
        tags: [],
        parentTaskId: null,
        completedCount: 0,
      },
      history: (() => {
        const { id: _id, ...entry } = createHistoryEntry(
          "created",
          createdBy,
          `Tarea "${t.title}" creada`,
        );
        return entry;
      })(),
      // +1 ms per task keeps the pasted order (lists sort by createdAt)
      createdAtMs: base + i,
    }));

    const result = items.length
      ? await createTasksBatch(items)
      : { savedIds: [] as string[], failedIds: [] as string[], error: undefined };

    // Activity / team history for every task actually saved
    if (currentUser) {
      const byId = new Map(pending.map((t) => [t.id, t]));
      for (const id of result.savedIds) {
        const t = byId.get(id);
        if (!t) continue;
        logTaskCreated(
          { id, title: t.title, listId, listName: list?.name },
          {
            id: currentUser.id,
            name: currentUser.name || "Usuario",
            photoURL: currentUser.photoURL,
          },
        );
        if (list?.teamId) {
          logTeamActivity(list.teamId, {
            teamId: list.teamId,
            userId: currentUser.id,
            userName: currentUser.name || "Usuario",
            userPhotoURL: currentUser.photoURL,
            action: "task_created",
            entityType: "task",
            entityId: id,
            entityName: t.title,
            detail: `${currentUser.name || "Usuario"} creó la tarea "${t.title}"`,
          });
        }
      }
    }

    return {
      savedIds: [...alreadySaved, ...result.savedIds],
      failedIds: result.failedIds,
      error: result.error ? firestoreErrorMessage(result.error) : undefined,
    };
  },

  undoBulkCreate: async (ids) => {
    if (ids.length === 0) return;
    // Optimistically hide them; the snapshot listener confirms the delete.
    const idSet = new Set(ids);
    const previous = get().tasks;
    set((state) => ({ tasks: state.tasks.filter((t) => !idSet.has(t.id)) }));
    try {
      await deleteTasksBatch(ids);
    } catch (error) {
      set({ tasks: previous });
      throw new Error(firestoreErrorMessage(error));
    }
  },

  updateTask: async (id, updates, performedBy, performerName) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    // Optimistic update for immediate UI feedback
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    const entries: TaskHistoryEntry[] = [];
    if (updates.title && updates.title !== task.title) {
      entries.push(
        createHistoryEntry(
          "title_changed",
          performedBy,
          `Título: "${task.title}" → "${updates.title}"`,
          { previousValue: task.title, newValue: updates.title },
        ),
      );
    }
    if (
      updates.description !== undefined &&
      updates.description !== task.description
    ) {
      entries.push(
        createHistoryEntry(
          "description_changed",
          performedBy,
          updates.description
            ? "Descripción actualizada"
            : "Descripción eliminada",
          {
            previousValue: task.description || "",
            newValue: updates.description || "",
          },
        ),
      );
    }
    if (
      updates.assignedTo !== undefined &&
      updates.assignedTo !== task.assignedTo
    ) {
      entries.push(
        createHistoryEntry(
          "assigned",
          performedBy,
          `Asignado: ${task.assignedTo || "nadie"} → ${updates.assignedTo || "nadie"}`,
          {
            previousValue: task.assignedTo || "",
            newValue: updates.assignedTo || "",
          },
        ),
      );
    }
    const locationTouched =
      ("location" in updates && updates.location !== task.location) ||
      ("locationUrl" in updates && updates.locationUrl !== task.locationUrl);
    if (locationTouched) {
      const fmt = (loc?: string, url?: string) =>
        [loc, url].filter(Boolean).join(" · ");
      const prev = fmt(task.location, task.locationUrl);
      const next = fmt(
        "location" in updates ? updates.location : task.location,
        "locationUrl" in updates ? updates.locationUrl : task.locationUrl,
      );
      if (prev !== next) {
        entries.push(
          createHistoryEntry(
            "location_changed",
            performedBy,
            next ? "Ubicación actualizada" : "Ubicación eliminada",
            { previousValue: prev, newValue: next },
          ),
        );
      }
    }
    if (
      updates.phoneNumbers !== undefined &&
      JSON.stringify(updates.phoneNumbers) !== JSON.stringify(task.phoneNumbers)
    ) {
      const prev = task.phoneNumbers?.join(", ") || "";
      const next = updates.phoneNumbers?.join(", ") || "";
      entries.push(
        createHistoryEntry(
          "phones_changed",
          performedBy,
          `Teléfonos: ${prev || "—"} → ${next || "—"}`,
          {
            previousValue: prev,
            newValue: next,
          },
        ),
      );
    }
    if (updates.dueDate !== undefined && updates.dueDate !== task.dueDate) {
      entries.push(
        createHistoryEntry(
          "due_date_changed",
          performedBy,
          updates.dueDate
            ? `Vencimiento: ${task.dueDate ? formatDate(task.dueDate) : "—"} → ${formatDate(updates.dueDate)}`
            : "Vencimiento eliminado",
          {
            previousValue: task.dueDate || "",
            newValue: updates.dueDate || "",
          },
        ),
      );
    }
    if (updates.reminders !== undefined) {
      entries.push(
        createHistoryEntry(
          "reminder_set",
          performedBy,
          "Recordatorio actualizado",
        ),
      );
    }
    if (updates.recurrence !== undefined) {
      entries.push(
        createHistoryEntry(
          "recurrence_set",
          performedBy,
          updates.recurrence
            ? `Repetición: ${getRecurrenceLabel(updates.recurrence)}`
            : "Repetición eliminada",
        ),
      );
    }
    if (updates.priority !== undefined && updates.priority !== task.priority) {
      entries.push(
        createHistoryEntry(
          "priority_changed",
          performedBy,
          `Prioridad: ${getPriorityLabel(task.priority)} → ${getPriorityLabel(updates.priority)}`,
          {
            previousValue: task.priority || "",
            newValue: updates.priority,
          },
        ),
      );
    }

    try {
      await updateTaskInDb(id, updates);
    } catch (error) {
      set((state) => ({
        tasks: state.tasks.map((item) => (item.id === id ? task : item)),
      }));
      throw error;
    }

    await Promise.allSettled(
      entries.map((entry) => {
        const { id: _entryId, ...entryData } = entry;
        return addTaskHistoryEntry(id, entryData);
      }),
    );

    // Log team activity for assignment
    const currentUser = useAuthStore.getState().user;
    const list = useListStore
      .getState()
      .lists.find((l) => l.id === task.listId);
    if (
      currentUser &&
      list?.teamId &&
      updates.assignedTo !== undefined &&
      updates.assignedTo !== task.assignedTo
    ) {
      logTeamActivity(list.teamId, {
        teamId: list.teamId,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhotoURL: currentUser.photoURL,
        action: "task_assigned",
        entityType: "task",
        entityId: task.id,
        entityName: task.title,
        detail: `${currentUser.name} asignó "${task.title}" a ${updates.assignedTo || "nadie"}`,
      });
    }

    // Notify assigned user
    if (
      updates.assignedTo &&
      updates.assignedTo !== task.assignedTo &&
      updates.assignedTo !== performedBy &&
      performerName
    ) {
      notifyTaskAssigned(
        updates.assignedTo,
        task.title,
        performerName,
        task.id,
        task.listId,
      );
    }

    // Notify task creator when task is edited (if not the creator editing)
    if (performerName && performedBy !== task.createdBy) {
      if (updates.priority) {
        notifyPriorityChanged(
          task.createdBy,
          task.title,
          performerName,
          task.id,
          task.listId,
        );
      } else if (updates.description !== undefined) {
        notifyDescriptionChanged(
          task.createdBy,
          task.title,
          performerName,
          task.id,
          task.listId,
        );
      } else if (
        updates.title ||
        updates.dueDate ||
        updates.location ||
        updates.locationUrl
      ) {
        notifyTaskEdited(
          task.createdBy,
          task.title,
          performerName,
          task.id,
          task.listId,
          updates.title
            ? "title"
            : updates.dueDate
              ? "dueDate"
              : updates.location || updates.locationUrl
                ? "location"
                : undefined,
        );
      }
    }
  },

  archiveTask: async (id, archivedBy) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTaskInDb(id, {
      status: "archived",
      archivedAt: new Date().toISOString(),
      archivedBy,
    });

    const archivedEntry = createHistoryEntry(
      "archived",
      archivedBy,
      "Tarea archivada",
    );
    const { id: _archivedEntryId, ...archivedEntryData } = archivedEntry;
    await addTaskHistoryEntry(id, archivedEntryData);
  },

  unarchiveTask: async (id, performedBy) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTaskInDb(id, {
      status: "pending",
      archivedAt: null,
      archivedBy: null,
    });

    const restoredEntry = createHistoryEntry(
      "restored",
      performedBy,
      "Tarea restaurada del archivo",
    );
    const { id: _restoredEntryId, ...restoredEntryData } = restoredEntry;
    await addTaskHistoryEntry(id, restoredEntryData);
  },

  completeTask: async (
    id: string,
    completedBy: string,
    completerName?: string,
    listMembers?: Array<{ userId: string; role: string }>,
    performedByUser?: { id: string; name: string },
  ) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const completedAt = new Date().toISOString();
    const newCount = (task.completedCount || 0) + 1;

    const resolvedCompleterName = completerName || "Usuario desconocido";
    const resolvedPerformerName =
      performedByUser?.name ||
      useAuthStore.getState().user?.name ||
      resolvedCompleterName;

    const completionDetails =
      performedByUser && performedByUser.id !== completedBy
        ? `Marcada como completada por ${resolvedPerformerName} · Realizada por ${resolvedCompleterName}`
        : `Completada por ${resolvedCompleterName}`;

    // Optimistic update: move task to completed immediately
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "completed" as TaskStatus,
              completedBy,
              completedAt,
              completedCount: newCount,
              performedBy: performedByUser?.id || null,
            }
          : t,
      ),
    }));

    await updateTaskInDb(id, {
      status: "completed",
      completedBy,
      completedAt,
      completedCount: newCount,
      performedBy: performedByUser?.id || null,
    });

    const completedEntry = createHistoryEntry(
      "completed",
      performedByUser?.id ?? completedBy,
      completionDetails,
      {
        completedByName: resolvedCompleterName,
        performedByTaskName: resolvedPerformerName,
      },
    );
    const { id: _completedEntryId, ...completedEntryData } = completedEntry;
    await addTaskHistoryEntry(id, completedEntryData);

    // Log activity (only team activity subcollection, not legacy)
    const currentUser = useAuthStore.getState().user;
    const list = useListStore
      .getState()
      .lists.find((l) => l.id === task.listId);
    if (currentUser && list?.teamId) {
      const actualCompleter = {
        id: completedBy,
        name: resolvedCompleterName,
      };
      logTeamActivity(list.teamId, {
        teamId: list.teamId,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhotoURL: currentUser.photoURL,
        action: "task_completed",
        entityType: "task",
        entityId: task.id,
        entityName: task.title,
        detail:
          actualCompleter.id !== currentUser.id
            ? `${currentUser.name} marcó como completada "${task.title}" · Realizada por ${actualCompleter.name}`
            : `${currentUser.name} completó "${task.title}"`,
      });
    }

    // Notify relevant members (owner, admin, or editor), excluding the completer
    if (completerName && listMembers) {
      const notified = new Set<string>();
      listMembers.forEach((member: { userId: string; role: string }) => {
        if (
          (member.role === "owner" ||
            member.role === "editor" ||
            member.role === "admin") &&
          member.userId !== completedBy &&
          !notified.has(member.userId)
        ) {
          notified.add(member.userId);
          notifyTaskCompleted(
            member.userId,
            task.title,
            completerName,
            task.id,
            task.listId,
          );
        }
      });
    }

    // Auto-generate next recurring task
    if (task.recurrence) {
      const nextTask = await get().generateNextRecurringTask({
        ...task,
        status: "completed",
        completedBy,
        completedAt,
        completedCount: newCount,
      });
      if (nextTask) {
        set((state) => {
          const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
          taskMap.set(nextTask.id, nextTask);
          return { tasks: Array.from(taskMap.values()) };
        });
      }
    }
  },

  generateNextRecurringTask: async (task) => {
    if (!task.recurrence) return null;

    const nextDate = calculateNextDueDate(task);
    if (!nextDate) return null;

    const {
      id: _,
      status: __,
      completedBy: ___,
      completedAt: ____,
      history: _____,
      completedCount: ______,
      ...baseTask
    } = task;

    const nextTaskData = {
      ...baseTask,
      status: "pending" as TaskStatus,
      completedBy: null,
      completedAt: null,
      dueDate: nextDate.dueDate,
      dueTime: nextDate.dueTime,
      completedCount: 0,
      parentTaskId: task.id,
    };

    const id = await createTaskInDb(nextTaskData);

    const autoCreatedEntry = createHistoryEntry(
      "auto_created",
      task.completedBy || task.createdBy,
      `Tarea recurrente generada desde "${task.title}"`,
    );
    const { id: _autoCreatedEntryId, ...autoCreatedEntryData } =
      autoCreatedEntry;
    await addTaskHistoryEntry(id, autoCreatedEntryData);

    return {
      id,
      ...nextTaskData,
      createdAt: new Date().toISOString(),
    } as Task;
  },

  uncompleteTask: async (id, performedBy) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    // Optimistic update: move task back to pending immediately
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "pending" as TaskStatus,
              completedBy: null,
              completedAt: null,
            }
          : t,
      ),
    }));

    await updateTaskInDb(id, {
      status: "pending",
      completedBy: null,
      completedAt: null,
    });

    const reopenedEntry = createHistoryEntry(
      "reopened",
      performedBy,
      "Tarea reabierta",
    );
    const { id: _reopenedEntryId, ...reopenedEntryData } = reopenedEntry;
    await addTaskHistoryEntry(id, reopenedEntryData);
  },

  deleteTask: async (id: string) => {
    const task = get().tasks.find((t) => t.id === id);

    if (task) {
      const currentUser = useAuthStore.getState().user;
      const deletedBy = currentUser?.id;
      const deletedEntry = createHistoryEntry(
        "deleted",
        deletedBy || "unknown",
        "Tarea eliminada",
      );
      const { id: _deletedEntryId, ...deletedEntryData } = deletedEntry;
      await addTaskHistoryEntry(id, deletedEntryData);
    }

    // Log activity before soft-deleting
    if (task) {
      const currentUser = useAuthStore.getState().user;
      const list = useListStore
        .getState()
        .lists.find((l) => l.id === task.listId);
      if (currentUser) {
        logTaskDeleted(
          {
            id: task.id,
            title: task.title,
            listId: task.listId,
            listName: list?.name,
          },
          {
            id: currentUser.id,
            name: currentUser.name,
            photoURL: currentUser.photoURL,
          },
        );
        // Team activity subcollection
        if (list?.teamId) {
          logTeamActivity(list.teamId, {
            teamId: list.teamId,
            userId: currentUser.id,
            userName: currentUser.name,
            userPhotoURL: currentUser.photoURL,
            action: "task_deleted",
            entityType: "task",
            entityId: task.id,
            entityName: task.title,
            detail: `${currentUser.name} eliminó "${task.title}"`,
          });
        }
      }
    }

    await deleteTaskInDb(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  subscribeToList: (listId) => {
    if (get().taskUnsubscribes.has(listId)) return;

    const unsubscribe = subscribeToListTasks(listId, (incomingTasks) => {
      set((state) => {
        const otherTasks = state.tasks.filter((t) => t.listId !== listId);
        const taskMap = new Map(otherTasks.map((t) => [t.id, t]));
        // Apply optimistic order overrides from pendingOrder
        incomingTasks.forEach((t) => {
          const pending = state.pendingOrder.get(t.id);
          taskMap.set(
            t.id,
            pending !== undefined ? { ...t, order: pending } : t,
          );
        });
        const mergedTasks = Array.from(taskMap.values());
        return { tasks: mergedTasks };
      });
    });

    set((state) => {
      const newUnsubscribes = new Map(state.taskUnsubscribes);
      newUnsubscribes.set(listId, unsubscribe);
      return { taskUnsubscribes: newUnsubscribes };
    });
  },

  unsubscribeFromList: (listId) => {
    get().taskUnsubscribes.get(listId)?.();
    set((state) => {
      const newUnsubscribes = new Map(state.taskUnsubscribes);
      newUnsubscribes.delete(listId);
      return { taskUnsubscribes: newUnsubscribes };
    });
  },

  unsubscribeAll: () => {
    get().taskUnsubscribes.forEach((unsubscribe) => unsubscribe());
    set({ taskUnsubscribes: new Map(), tasks: [] });
  },

  reorderTasks: async (taskIds) => {
    // 1. Optimistic update + register pending order to prevent snapshot snap-back
    set((state) => {
      const newPending = new Map(state.pendingOrder);
      taskIds.forEach((id, i) => newPending.set(id, i));
      const updated = state.tasks.map((t) => {
        const idx = taskIds.indexOf(t.id);
        return idx !== -1 ? { ...t, order: idx } : t;
      });
      return { tasks: updated, pendingOrder: newPending };
    });

    // 2. Persist all at once in parallel
    try {
      await Promise.all(
        taskIds.map((id, i) => updateTaskInDb(id, { order: i })),
      );
    } finally {
      // 3. Clear pending overrides once Firestore has confirmed
      set((state) => {
        const newPending = new Map(state.pendingOrder);
        taskIds.forEach((id) => newPending.delete(id));
        return { pendingOrder: newPending };
      });
    }
  },

  // ---- Attachment methods ----

  addAttachment: async (
    taskId,
    file,
    uploadedBy,
    uploadedByName,
    onProgress,
  ) => {
    // 1) Storage (task doc already exists → rules can verify membership)
    const up = await uploadTaskAttachment(taskId, file, onProgress);

    // 2) Firestore metadata. If it fails, remove the uploaded objects so no
    //    orphan files are left behind.
    let attachmentId: string;
    try {
      attachmentId = await addTaskAttachment(taskId, {
        taskId,
        name: file.name,
        type: up.contentType || file.type,
        size: file.size,
        category: up.category,
        url: up.url,
        storagePath: up.storagePath,
        thumbUrl: up.thumbUrl,
        thumbStoragePath: up.thumbStoragePath,
        uploadedBy,
        uploadedByName,
      });
    } catch (error) {
      await Promise.allSettled(
        [up.storagePath, up.thumbStoragePath]
          .filter((p): p is string => !!p)
          .map((p) => deleteTaskAttachmentFromStorage(p)),
      );
      const code = (error as { code?: string })?.code;
      throw new Error(
        code === "permission-denied"
          ? `${file.name}: no tienes permiso para adjuntar archivos a esta tarea.`
          : `${file.name}: no se pudo registrar el archivo. Inténtalo nuevamente.`,
      );
    }

    // 3) Card summary (non-fatal)
    try {
      await refreshTaskAttachmentSummary(taskId);
    } catch (error) {
      console.warn("[addAttachment] Summary refresh failed:", error);
    }
    return attachmentId;
  },

  deleteAttachment: async (taskId, attachmentId, storagePath, thumbStoragePath) => {
    const removeObject = async (path?: string) => {
      if (!path) return;
      try {
        await deleteTaskAttachmentFromStorage(path);
      } catch (error) {
        // Already gone is fine; anything else is a real failure
        if ((error as { code?: string })?.code !== "storage/object-not-found") throw error;
      }
    };
    await removeObject(storagePath);
    await removeObject(thumbStoragePath);
    await deleteTaskAttachmentMetadata(taskId, attachmentId);
    try {
      await refreshTaskAttachmentSummary(taskId);
    } catch (error) {
      console.warn("[deleteAttachment] Summary refresh failed:", error);
    }
  },

  subscribeToAttachments: (taskId, callback) => {
    return subscribeToTaskAttachments(taskId, callback);
  },
}));
