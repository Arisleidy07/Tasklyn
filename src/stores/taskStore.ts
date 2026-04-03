"use client";

import { create } from "zustand";
import {
  createTask as createTaskInDb,
  updateTask as updateTaskInDb,
  deleteTask as deleteTaskInDb,
  subscribeToListTasks,
} from "@/lib/firestore";
import type { Task, TaskStatus, TaskHistoryEntry } from "@/types";
import { Unsubscribe } from "firebase/firestore";

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
  }) => Promise<Task>;
  updateTask: (
    id: string,
    updates: Partial<Pick<Task, "title" | "description" | "assignedTo">>,
    performedBy: string,
  ) => Promise<void>;
  completeTask: (id: string, completedBy: string) => Promise<void>;
  uncompleteTask: (id: string, performedBy: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  subscribeToList: (listId: string) => void;
  unsubscribeFromList: (listId: string) => void;
  unsubscribeAll: () => void;
}

function createHistoryEntry(
  action: string,
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

  createTask: async ({ listId, title, description, createdBy, assignedTo }) => {
    const newTaskData = {
      listId,
      title,
      description: description || "",
      status: "pending" as TaskStatus,
      assignedTo: assignedTo || null,
      createdBy,
      completedBy: null,
      completedAt: null,
      history: [
        createHistoryEntry("created", createdBy, `Task "${title}" created`),
      ],
    };

    const id = await createTaskInDb(newTaskData);

    return {
      id,
      ...newTaskData,
      createdAt: new Date().toISOString(),
    } as Task;
  },

  updateTask: async (id, updates, performedBy) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const entries: TaskHistoryEntry[] = [];
    if (updates.title && updates.title !== task.title) {
      entries.push(
        createHistoryEntry(
          "title_changed",
          performedBy,
          `Title changed to "${updates.title}"`,
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
          "Description updated",
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
          `Assigned to ${updates.assignedTo || "nobody"}`,
        ),
      );
    }

    await updateTaskInDb(id, {
      ...updates,
      history: [...task.history, ...entries],
    });
  },

  completeTask: async (id, completedBy) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    await updateTaskInDb(id, {
      status: "completed",
      completedBy,
      completedAt: new Date().toISOString(),
      history: [
        ...task.history,
        createHistoryEntry(
          "completed",
          completedBy,
          "Task marked as completed",
        ),
      ],
    });
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
        return { tasks: [...otherTasks, ...tasks] };
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
