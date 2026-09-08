"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PLAN_FEATURES } from "@/types";
import {
  Crown,
  FolderOpen,
  Users,
  ClipboardList,
  ArrowRight,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { lists } = useListStore();
  const { tasks } = useTaskStore();
  if (!user) return null;

  const planFeatures = PLAN_FEATURES[user.plan] || PLAN_FEATURES["free"];
  const personalListsCount = lists.filter((l) => l.owner === user.id).length;
  const sharedListsCount = lists.filter(
    (l) =>
      l.owner !== user.id &&
      l.members.some((m: { userId: string }) => m.userId === user.id),
  ).length;
  const planName =
    user.plan === "business"
      ? "BUSINESS"
      : user.plan === "pro"
        ? "PRO"
        : "Gratis";
  const maxTasksInList = lists.reduce(
    (max, l) => Math.max(max, tasks.filter((t) => t.listId === l.id).length),
    0,
  );
  const formatLimit = (n: number) => (n === Infinity ? "ilimitadas" : `${n}`);

  const planDescription =
    user.plan === "business"
      ? "Plan empresarial con todas las funciones"
      : `${formatLimit(planFeatures.maxLists)} listas, ${formatLimit(planFeatures.maxTasksPerList)} tareas por lista${user.plan === "free" ? ` y ${planFeatures.maxCollaborators} personas por lista` : " y funciones avanzadas"}`;

  const usage = [
    {
      label: "Listas",
      value: personalListsCount,
      limit: planFeatures.maxLists,
      icon: FolderOpen,
    },
    {
      label: "Tareas en tu lista más grande",
      value: maxTasksInList,
      limit: planFeatures.maxTasksPerList,
      icon: ClipboardList,
    },
    {
      label: "Compartidas",
      value: sharedListsCount,
      icon: Users,
    },
  ];

  return (
    <>
      <Header
        title="Configuración"
        description="Personaliza tu experiencia en TASKLYN"
        showMenuButton={true}
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto pb-28 md:pb-10 space-y-6">
        {/* Cuenta */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border shadow-sm p-5 sm:p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <UserRound
                  size={22}
                  style={{ color: "var(--text-tertiary)" }}
                />
              </div>
              <div className="min-w-0">
                <h2
                  className="text-lg font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  Cuenta
                </h2>
                <p
                  className="text-sm truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {user.email}
                </p>
              </div>
            </div>
            <Link href="/profile" className="w-full sm:w-auto flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                icon={<ArrowRight size={14} />}
                className="w-full sm:w-auto"
              >
                Ver perfil
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Plan */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border shadow-sm p-5 sm:p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor:
                    user.plan === "pro" || user.plan === "business"
                      ? "rgba(37,99,235,0.1)"
                      : "var(--bg-secondary)",
                }}
              >
                <Crown
                  size={24}
                  style={{
                    color:
                      user.plan === "pro" || user.plan === "business"
                        ? "#2563eb"
                        : "var(--text-tertiary)",
                  }}
                />
              </div>
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Plan {planName}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {planDescription}
                </p>
              </div>
            </div>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                icon={<ArrowRight size={14} />}
                className="w-full sm:w-auto"
              >
                Ver planes
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Theme */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border shadow-sm p-5 sm:p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="mb-4">
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Apariencia
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Elige el estilo visual que prefieras para Tasklyn.
            </p>
          </div>
          <ThemeToggle size="lg" variant="segment" />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border shadow-sm p-5 sm:p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            Uso del plan
          </h2>
          <div className="space-y-4">
            {usage.map((item) => {
              const pct =
                typeof item.limit === "number" && item.limit > 0
                  ? Math.min(100, Math.round((item.value / item.limit) * 100))
                  : null;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div
                      className="flex items-center gap-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <item.icon size={14} />
                      <span>{item.label}</span>
                    </div>
                    <span
                      className="font-semibold tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.value}
                      {typeof item.limit === "number" ? ` / ${item.limit}` : ""}
                    </span>
                  </div>
                  {pct !== null && (
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}
