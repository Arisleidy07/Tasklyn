"use client";

import React from "react";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore, type AppTheme } from "@/stores/uiStore";
import Header from "@/components/layout/Header";
import {
  Settings,
  CheckCircle2,
  Crown,
  FolderOpen,
  Users,
  ClipboardList,
  Sun,
  Moon,
  Sparkles,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const themes: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
  { id: "light", label: "Claro", icon: <Sun size={18} /> },
  { id: "dark", label: "Oscuro", icon: <Moon size={18} /> },
  { id: "glass", label: "Cristal", icon: <Sparkles size={18} /> },
  { id: "dark-glass", label: "Cristal Oscuro", icon: <Layers size={18} /> },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { lists } = useListStore();
  const { tasks } = useTaskStore();
  const { theme, setTheme } = useUIStore();
  if (!user) return null;

  const personalListsCount = lists.filter((l) => l.owner === user.id).length;
  const sharedListsCount = lists.filter(
    (l) =>
      l.owner !== user.id &&
      l.members.some((m: { userId: string }) => m.userId === user.id),
  ).length;
  const totalTasks = tasks.filter((t) =>
    lists.some((l) => l.id === t.listId),
  ).length;

  return (
    <>
      <Header
        title="Configuración"
        description="Personaliza tu experiencia en TASKLYN"
        showMenuButton={true}
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        {/* Plan actual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl border shadow-sm p-6 mb-6",
            "bg-white border-gray-200",
            "dark:bg-slate-900 dark:border-slate-800",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  user.plan === "pro" || user.plan === "business"
                    ? "bg-blue-100 dark:bg-blue-500/20"
                    : "bg-gray-100 dark:bg-slate-800",
                )}
              >
                <Crown
                  size={24}
                  className={
                    user.plan === "pro" || user.plan === "business"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-slate-500"
                  }
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Plan{" "}
                  {user.plan === "business"
                    ? "BUSINESS"
                    : user.plan === "pro"
                      ? "PRO"
                      : "Gratis"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {user.plan === "business"
                    ? "Plan empresarial con todas las funciones"
                    : user.plan === "pro"
                      ? "Acceso ilimitado a todas las funciones"
                      : "3 listas máximo, 50 tareas por lista"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Theme Selector - Premium Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-xl border shadow-sm p-6 mb-6",
            "bg-white border-gray-200",
            "dark:bg-slate-900 dark:border-slate-800",
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Settings size={20} className="text-gray-400 dark:text-slate-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Tema de la aplicación
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Elige el estilo visual que prefieras para Tasklyn.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "theme-option relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200",
                  theme === t.id
                    ? "border-blue-500 shadow-lg shadow-blue-500/20"
                    : "border-transparent hover:scale-[1.02]",
                  t.id === "light" && "theme-preview-light",
                  t.id === "dark" && "theme-preview-dark",
                  t.id === "glass" && "theme-preview-glass",
                  t.id === "dark-glass" && "theme-preview-dark-glass",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    theme === t.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200/80 text-gray-600 dark:bg-slate-700 dark:text-slate-400",
                  )}
                >
                  {t.icon}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    theme === t.id
                      ? "text-gray-900 dark:text-slate-100"
                      : "text-gray-600 dark:text-slate-400",
                  )}
                >
                  {t.label}
                </span>
                {theme === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "rounded-xl border shadow-sm p-6",
            "bg-white border-gray-200",
            "dark:bg-slate-900 dark:border-slate-800",
          )}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle2
              size={20}
              className="text-gray-400 dark:text-slate-500"
            />
            Tus estadísticas
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Listas",
                value: personalListsCount,
                icon: FolderOpen,
              },
              {
                label: "Compartidas",
                value: sharedListsCount,
                icon: Users,
              },
              {
                label: "Tareas",
                value: totalTasks,
                icon: ClipboardList,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border",
                  "bg-gray-50 border-gray-100",
                  "dark:bg-slate-800 dark:border-slate-700",
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/25">
                  <stat.icon size={14} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 text-center leading-tight">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}
