"use client";

import React from "react";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import Header from "@/components/layout/Header";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Settings,
  CheckCircle2,
  Crown,
  FolderOpen,
  Users,
  ClipboardList,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
          className="rounded-xl border shadow-sm p-6 mb-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={
                  user.plan === "pro" || user.plan === "business"
                    ? { backgroundColor: "rgba(37,99,235,0.1)" }
                    : { backgroundColor: "var(--bg-secondary)" }
                }
              >
                <Crown
                  size={24}
                  style={
                    user.plan === "pro" || user.plan === "business"
                      ? { color: "#2563eb" }
                      : { color: "var(--text-tertiary)" }
                  }
                />
              </div>
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Plan{" "}
                  {user.plan === "business"
                    ? "BUSINESS"
                    : user.plan === "pro"
                      ? "PRO"
                      : "Gratis"}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
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
          className="rounded-xl border shadow-sm p-6 mb-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Settings size={20} style={{ color: "var(--text-tertiary)" }} />
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Tema de la aplicación
            </h2>
          </div>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            Elige el estilo visual que prefieras para Tasklyn.
          </p>

          <ThemeToggle size="lg" variant="segment" />
        </motion.div>

        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border shadow-sm p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-4 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <CheckCircle2 size={20} style={{ color: "var(--text-tertiary)" }} />
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
                className="flex flex-col items-center gap-2 p-4 rounded-xl border"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/25">
                  <stat.icon size={14} className="text-white" />
                </div>
                <p
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-[10px] text-center leading-tight"
                  style={{ color: "var(--text-secondary)" }}
                >
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
