"use client";

import { create } from "zustand";
import {
  createTask as createTaskInDb,
  updateTask as updateTaskInDb,
  deleteTask as deleteTaskInDb,
  subscribeToListTasks,
} from "@/lib/firestore";
import type {
  Task,
  TaskStatus,
  TaskHistoryEntry,
  RecurrenceConfig,
  TaskReminder,
} from "@/types";
import { Unsubscribe } from "firebase/firestore";
import {
  notifyTaskCompleted,
  notifyTaskAssigned,
  notifyTaskEdited,
} from "@/lib/notify";
import { toISODate } from "@/lib/dateUtils";

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  taskUnsubscribes: Map<string, Unsubscribe>;
  getTasksByList: (listId: string) => Task[];
  getTask: (id: string) => Task | undefined;
  createTask: (params: {
    listId: string;
    title: string;
    description?: string;
    createdBy: string;
    assignedTo?: string | null;
    location?: string;
    phoneNumbers?: string[];
    dueDate?: string | null;
    dueTime?: string | null;
    reminders?: TaskReminder[];
    recurrence?: RecurrenceConfig | null;
    priority?: "low" | "medium" | "high" | "urgent";
    tags?: string[];
  }) => Promise<Task>;
  updateTask: (
    id: string,
    updates: Partial<
      Pick<
        Task,
        | "title"
        | "description"
        | "assignedTo"
        | "location"
        | "phoneNumbers"
        | "dueDate"
        | "dueTime"
        | "reminders"
        | "recurrence"
        | "priority"
        | "tags"
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
  ) => Promise<void>;
  uncompleteTask: (id: string, performedBy: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  subscribeToList: (listId: string) => void;
  unsubscribeFromList: (listId: string) => void;
  unsubscribeAll: () => void;
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
): TaskHistoryEntry {
  return {
    id: Math.random().toString(36).slice(2),
    action,
    performedBy,
    performedAt: new Date().toISOString(),
    details,
  };
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  taskUnsubscribes: new Map(),

  getTasksByList: (listId) => get().tasks.filter((t) => t.listId === listId),

  getTask: (id) => get().tasks.find((t) => t.id === id),

  createTask: async ({
    listId,
    title,
    description,
    createdBy,
    assignedTo,
    location,
    phoneNumbers,
    dueDate,
    dueTime,
    reminders,
    recurrence,
  }) => {
    const newTaskData = {
      listId,
      title,
      description: description || "",
      status: "pending" as TaskStatus,
      assignedTo: assignedTo || null,
      createdBy,
      completedBy: null,
      completedAt: null,
      location: location || undefined,
      phoneNumbers: phoneNumbers || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      reminders: reminders || undefined,
      recurrence: recurrence || undefined,
      parentTaskId: null,
      completedCount: 0,
      history: [
        createHistoryEntry("created", createdBy, `Tarea "${title}" creada`),
      ],
    };

    const id = await createTaskInDb(newTaskData);

    return {
      id,
      ...newTaskData,
      createdAt: new Date().toISOString(),
    } as Task;
  },

  updateTask: async (id, updates, performedBy, performerName) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const entries: TaskHistoryEntry[] = [];
    if (updates.title && updates.title !== task.title) {
      entries.push(
        createHistoryEntry(
          "title_changed",
          performedBy,
          `Título cambiado a "${updates.title}"`,
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
          "Descripción actualizada",
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
          `Asignado a ${updates.assignedTo || "nadie"}`,
        ),
      );
    }
    if (updates.location !== undefined && updates.location !== task.location) {
      entries.push(
        createHistoryEntry(
          "location_changed",
          performedBy,
          "Ubicación actualizada",
        ),
      );
    }
    if (
      updates.phoneNumbers !== undefined &&
      JSON.stringify(updates.phoneNumbers) !== JSON.stringify(task.phoneNumbers)
    ) {
      entries.push(
        createHistoryEntry(
          "phones_changed",
          performedBy,
          "Teléfonos actualizados",
        ),
      );
    }
    if (updates.dueDate !== undefined && updates.dueDate !== task.dueDate) {
      entries.push(
        createHistoryEntry(
          "due_date_changed",
          performedBy,
          updates.dueDate
            ? `Vencimiento: ${formatDate(updates.dueDate)}`
            : "Vencimiento eliminado",
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

    await updateTaskInDb(id, {
      ...updates,
      history: [...task.history, ...entries],
    });

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
    if (
      performerName &&
      performedBy !== task.createdBy &&
      (updates.title ||
        updates.description ||
        updates.dueDate ||
        updates.location)
    ) {
      notifyTaskEdited(
        task.createdBy,
        task.title,
        performerName,
        task.id,
        task.listId,
      );
    }
  },

  archiveTask: async (id, archivedBy) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTaskInDb(id, {
      status: "archived",
      archivedAt: new Date().toISOString(),
      archivedBy,
      history: [
        ...task.history,
        createHistoryEntry("archived", archivedBy, "Tarea archivada"),
      ],
    });
  },

  unarchiveTask: async (id, performedBy) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTaskInDb(id, {
      status: "pending",
      archivedAt: null,
      archivedBy: null,
      history: [
        ...task.history,
        createHistoryEntry(
          "restored",
          performedBy,
          "Tarea restaurada del archivo",
        ),
      ],
    });
  },

  completeTask: async (id, completedBy, completerName, listMembers) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const completedAt = new Date().toISOString();
    const newCount = (task.completedCount || 0) + 1;

    await updateTaskInDb(id, {
      status: "completed",
      completedBy,
      completedAt,
      completedCount: newCount,
      history: [
        ...task.history,
        createHistoryEntry("completed", completedBy, "Tarea completada"),
      ],
    });

    // Notify relevant members (owner and editors, excluding the completer)
    if (completerName && listMembers) {
      listMembers.forEach((member) => {
        // Notify owner and editors, but not the person who completed it
        if (
          (member.role === "owner" || member.role === "editor") &&
          member.userId !== completedBy
        ) {
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
      history: [
        createHistoryEntry(
          "auto_created",
          task.completedBy || task.createdBy,
          `Tarea recurrente generada desde "${task.title}"`,
        ),
      ],
    };

    const id = await createTaskInDb(nextTaskData);

    return {
      id,
      ...nextTaskData,
      createdAt: new Date().toISOString(),
    } as Task;
  },

  uncompleteTask: async (id, performedBy) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    await updateTaskInDb(id, {
      status: "pending",
      completedBy: null,
      completedAt: null,
      history: [
        ...task.history,
        createHistoryEntry("reopened", performedBy, "Task reopened"),
      ],
    });
  },

  deleteTask: async (id) => {
    await deleteTaskInDb(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  subscribeToList: (listId) => {
    // Unsubscribe existing listener for this list
    get().taskUnsubscribes.get(listId)?.();

    const unsubscribe = subscribeToListTasks(listId, (tasks) => {
      set((state) => {
        const otherTasks = state.tasks.filter((t) => t.listId !== listId);
        // Merge tasks, replacing any with same ID to prevent duplicates
        const taskMap = new Map(otherTasks.map((t) => [t.id, t]));
        tasks.forEach((t) => taskMap.set(t.id, t));
        const mergedTasks = Array.from(taskMap.values());
        console.log(
          "subscribeToList: merged tasks for list",
          listId,
          mergedTasks.map((t) => t.id),
        );
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
}));
