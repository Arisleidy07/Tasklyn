import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppTheme = "light" | "dark" | "glass" | "dark-glass";

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
  isGlassTheme: () => boolean;
  isDarkTheme: () => boolean;
}

const themeOrder: AppTheme[] = ["light", "dark", "glass", "dark-glass"];

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
        set((s) => {
          const currentIndex = themeOrder.indexOf(s.theme);
          const nextIndex = (currentIndex + 1) % themeOrder.length;
          return { theme: themeOrder[nextIndex] };
        }),
      isGlassTheme: () => {
        const theme = get().theme;
        return theme === "glass" || theme === "dark-glass";
      },
      isDarkTheme: () => {
        const theme = get().theme;
        return theme === "dark" || theme === "dark-glass";
      },
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
