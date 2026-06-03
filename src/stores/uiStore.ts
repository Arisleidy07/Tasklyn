import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppTheme = "light" | "dark";

interface UIStore {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  theme: AppTheme;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  isDarkTheme: () => boolean;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,
      theme: "light",
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      isDarkTheme: () => get().theme === "dark",
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        // Don't persist sidebarOpen state
      }),
    },
  ),
);
