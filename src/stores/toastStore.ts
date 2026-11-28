"use client";

// ============================================
// TASKLYN — Action toasts (success / error / warning with optional action)
// Separate from notification toasts (useNotifications), which mirror
// Firestore notifications. These are local UI feedback messages.
// ============================================
import { create } from "zustand";

export type ActionToastVariant = "success" | "error" | "warning" | "info";

export interface ActionToast {
  id: string;
  message: string;
  description?: string;
  variant: ActionToastVariant;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  durationMs: number;
}

interface ToastState {
  toasts: ActionToast[];
  show: (toast: Omit<ActionToast, "id" | "durationMs" | "variant"> & {
    variant?: ActionToastVariant;
    durationMs?: number;
  }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (toast) => {
    const id = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({
      toasts: [
        ...s.toasts.slice(-2),
        {
          variant: "info",
          durationMs: toast.actionLabel ? 8000 : 4000,
          ...toast,
          id,
        },
      ],
    }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience for non-React code. */
export const showToast = (...args: Parameters<ToastState["show"]>) =>
  useToastStore.getState().show(...args);
