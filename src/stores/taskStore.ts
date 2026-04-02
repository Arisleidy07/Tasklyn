'use client';

import { create } from 'zustand';
import { Task, TaskStatus, TaskHistoryEntry } from '@/types';
import { generateId } from '@/lib/utils';

interface TaskState {
  tasks: Task[];
  getTasksByList: (listId: string) => Task[];
  getTask: (id: string) => Task | undefined;
  createTask: (params: {
    listId: string;
    title: string;
    description?: string;
    createdBy: string;
    assignedTo?: string | null;
  }) => Task;
  updateTask: (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'assignedTo'>>,
    performedBy: string
  ) => void;
  completeTask: (id: string, completedBy: string) => void;
  uncompleteTask: (id: string, performedBy: string) => void;
  deleteTask: (id: string) => void;
  deleteTasksByList: (listId: string) => void;
}

function createHistoryEntry(action: string, performedBy: string, details?: string): TaskHistoryEntry {
  return {
    id: generateId(),
    action,
    performedBy,
    performedAt: new Date().toISOString(),
    details,
  };
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

  getTasksByList: (listId) =>
    get().tasks.filter((t) => t.listId === listId),

  getTask: (id) => get().tasks.find((t) => t.id === id),

  createTask: ({ listId, title, description, createdBy, assignedTo }) => {
    const newTask: Task = {
      id: generateId(),
      listId,
      title,
      description: description || '',
      status: 'pending',
      assignedTo: assignedTo || null,
      createdBy,
      completedBy: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      history: [createHistoryEntry('created', createdBy, `Task "${title}" created`)],
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },

  updateTask: (id, updates, performedBy) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        const entries: TaskHistoryEntry[] = [];
        if (updates.title && updates.title !== t.title) {
          entries.push(createHistoryEntry('title_changed', performedBy, `Title changed to "${updates.title}"`));
        }
        if (updates.description !== undefined && updates.description !== t.description) {
          entries.push(createHistoryEntry('description_changed', performedBy, 'Description updated'));
        }
        if (updates.assignedTo !== undefined && updates.assignedTo !== t.assignedTo) {
          entries.push(createHistoryEntry('assigned', performedBy, `Assigned to ${updates.assignedTo || 'nobody'}`));
        }
        return {
          ...t,
          ...updates,
          history: [...t.history, ...entries],
        };
      }),
    }));
  },

  completeTask: (id, completedBy) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          status: 'completed' as TaskStatus,
          completedBy,
          completedAt: new Date().toISOString(),
          history: [
            ...t.history,
            createHistoryEntry('completed', completedBy, 'Task marked as completed'),
          ],
        };
      }),
    }));
  },

  uncompleteTask: (id, performedBy) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          status: 'pending' as TaskStatus,
          completedBy: null,
          completedAt: null,
          history: [
            ...t.history,
            createHistoryEntry('reopened', performedBy, 'Task reopened'),
          ],
        };
      }),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  deleteTasksByList: (listId) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.listId !== listId) }));
  },
}));
