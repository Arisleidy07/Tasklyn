"use client";

import { create } from "zustand";
import {
  createTechnicianReport,
  updateTechnicianReport,
  deleteTechnicianReport,
  getTechnicianReport,
  subscribeToMyReports,
  subscribeToAllReports,
  subscribeToReportsByTask,
} from "@/lib/firestore";
import {
  uploadReportEvidence,
  deleteReportEvidence,
} from "@/lib/storage";
import type { TechnicianReport, ReportEvidence } from "@/types";
import { Unsubscribe } from "firebase/firestore";
import { useAuthStore } from "./authStore";

interface ReportState {
  myReports: TechnicianReport[];
  allReports: TechnicianReport[];
  taskReports: Map<string, TechnicianReport[]>;
  isLoading: boolean;
  currentReport: TechnicianReport | null;
  unsubscribes: Map<string, Unsubscribe>;

  // Actions
  loadMyReports: () => void;
  loadAllReports: (teamId: string) => void;
  loadReportsByTask: (taskId: string) => void;
  unloadReportsByTask: (taskId: string) => void;
  createReport: (report: Omit<TechnicianReport, "id" | "createdAt">) => Promise<string>;
  updateReport: (reportId: string, updates: Partial<TechnicianReport>) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  getReport: (reportId: string) => Promise<TechnicianReport | null>;
  setCurrentReport: (report: TechnicianReport | null) => void;
  clearAll: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  myReports: [],
  allReports: [],
  taskReports: new Map(),
  isLoading: false,
  currentReport: null,
  unsubscribes: new Map(),

  loadMyReports: () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    // Unsubscribe previous listener if exists
    const existingUnsub = get().unsubscribes.get("myReports");
    if (existingUnsub) {
      existingUnsub();
    }

    const unsub = subscribeToMyReports(user.id, (reports) => {
      set({ myReports: reports });
    });

    set((state) => {
      const newUnsubscribes = new Map(state.unsubscribes);
      newUnsubscribes.set("myReports", unsub);
      return { unsubscribes: newUnsubscribes };
    });
  },

  loadAllReports: (teamId: string) => {
    // Unsubscribe previous listener if exists
    const existingUnsub = get().unsubscribes.get("allReports");
    if (existingUnsub) {
      existingUnsub();
    }

    const unsub = subscribeToAllReports(teamId, (reports) => {
      set({ allReports: reports });
    });

    set((state) => {
      const newUnsubscribes = new Map(state.unsubscribes);
      newUnsubscribes.set("allReports", unsub);
      return { unsubscribes: newUnsubscribes };
    });
  },

  loadReportsByTask: (taskId: string) => {
    // Unsubscribe previous listener for this task if exists
    const existingUnsub = get().unsubscribes.get(`task-${taskId}`);
    if (existingUnsub) {
      existingUnsub();
    }

    const unsub = subscribeToReportsByTask(taskId, (reports) => {
      set((state) => {
        const newTaskReports = new Map(state.taskReports);
        newTaskReports.set(taskId, reports);
        return { taskReports: newTaskReports };
      });
    });

    set((state) => {
      const newUnsubscribes = new Map(state.unsubscribes);
      newUnsubscribes.set(`task-${taskId}`, unsub);
      return { unsubscribes: newUnsubscribes };
    });
  },

  unloadReportsByTask: (taskId: string) => {
    const existingUnsub = get().unsubscribes.get(`task-${taskId}`);
    if (existingUnsub) {
      existingUnsub();
    }

    set((state) => {
      const newUnsubscribes = new Map(state.unsubscribes);
      newUnsubscribes.delete(`task-${taskId}`);
      const newTaskReports = new Map(state.taskReports);
      newTaskReports.delete(taskId);
      return { unsubscribes: newUnsubscribes, taskReports: newTaskReports };
    });
  },

  createReport: async (report) => {
    set({ isLoading: true });
    try {
      const reportId = await createTechnicianReport(report);
      return reportId;
    } catch (error) {
      console.error("[createReport] Error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateReport: async (reportId, updates) => {
    set({ isLoading: true });
    try {
      await updateTechnicianReport(reportId, updates);
    } catch (error) {
      console.error("[updateReport] Error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteReport: async (reportId) => {
    set({ isLoading: true });
    try {
      await deleteTechnicianReport(reportId);
    } catch (error) {
      console.error("[deleteReport] Error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getReport: async (reportId) => {
    try {
      const report = await getTechnicianReport(reportId);
      return report;
    } catch (error) {
      console.error("[getReport] Error:", error);
      throw error;
    }
  },

  setCurrentReport: (report) => {
    set({ currentReport: report });
  },

  clearAll: () => {
    // Unsubscribe all listeners
    const { unsubscribes } = get();
    unsubscribes.forEach((unsub) => unsub());
    set({
      myReports: [],
      allReports: [],
      taskReports: new Map(),
      isLoading: false,
      currentReport: null,
      unsubscribes: new Map(),
    });
  },
}));
