"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import Header from "@/components/layout/Header";
import ListCard from "@/components/lists/ListCard";
import CreateListModal from "@/components/lists/CreateListModal";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import {
  Plus,
  ListTodo,
  FolderOpen,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ArrowDown,
  Flag,
  CalendarDays,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { PLAN_FEATURES, type Plan } from "@/types";
import { cn } from "@/lib/utils";
import {
  format,
  subDays,
  isSameDay,
  parseISO,
  isBefore,
  addDays,
} from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view") as "personal" | "shared" | null;
  const section = searchParams.get("section");
  const isListsSection = section === "lists" || view !== null;
  const activeTab: "personal" | "shared" =
    view === "shared" ? "shared" : "personal";
  const { user } = useAuthStore();
  const { getPersonalLists, getSharedLists, getUserLists } = useListStore();
  const { tasks } = useTaskStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!user) return null;

  const handleTabChange = (tab: "personal" | "shared") => {
    router.replace(`/dashboard?section=lists&view=${tab}`);
  };

  const personalLists = getPersonalLists(user.id);
  const sharedLists = getSharedLists(user.id);
  const allLists = getUserLists(user.id);
  // Safely get plan features with fallback to free plan
  const userPlan = (user.plan || "free") as Plan;
  const limits = PLAN_FEATURES[userPlan] || PLAN_FEATURES["free"];
  const canCreate = allLists.length < limits.maxLists;

  const allListIds = new Set(allLists.map((l) => l.id));
  const userTasks = tasks.filter((t) => allListIds.has(t.listId));
  const completedTasks = userTasks.filter((t) => t.status === "completed");
  const pendingTasks = userTasks.filter((t) => t.status === "pending");

  // --- Smart Dashboard data ---
  const today = new Date();

  const createdToday = userTasks.filter((t) => {
    try {
      return isSameDay(parseISO(t.createdAt), today);
    } catch {
      return false;
    }
  }).length;

  const completedToday = completedTasks.filter((t) => {
    try {
      return t.completedAt && isSameDay(parseISO(t.completedAt), today);
    } catch {
      return false;
    }
  }).length;

  // Last 7 days chart data
  const weekData = Array.from({ length: 7 }).map((_, i) => {
    const day = subDays(today, 6 - i);
    const done = completedTasks.filter((t) => {
      try {
        return t.completedAt && isSameDay(parseISO(t.completedAt), day);
      } catch {
        return false;
      }
    }).length;
    const created = userTasks.filter((t) => {
      try {
        return isSameDay(parseISO(t.createdAt), day);
      } catch {
        return false;
      }
    }).length;
    return {
      label: format(day, "EEE", { locale: es }).slice(0, 3),
      done,
      created,
      isToday: isSameDay(day, today),
    };
  });

  const maxWeek = Math.max(
    ...weekData.map((d) => Math.max(d.done, d.created)),
    1,
  );

  // Upcoming deadlines (next 7 days)
  const upcoming = userTasks
    .filter((t) => t.status === "pending" && t.dueDate)
    .filter((t) => {
      try {
        const d = parseISO(t.dueDate!);
        return !isBefore(d, today) && isBefore(d, addDays(today, 8));
      } catch {
        return false;
      }
    })
    .sort(
      (a, b) => parseISO(a.dueDate!).getTime() - parseISO(b.dueDate!).getTime(),
    )
    .slice(0, 5);

  // Priority breakdown
  const priorityCounts = {
    urgent: userTasks.filter(
      (t) => t.priority === "urgent" && t.status === "pending",
    ).length,
    high: userTasks.filter(
      (t) => t.priority === "high" && t.status === "pending",
    ).length,
    medium: userTasks.filter(
      (t) => t.priority === "medium" && t.status === "pending",
    ).length,
    low: userTasks.filter((t) => t.priority === "low" && t.status === "pending")
      .length,
  };

  const listNameMap = new Map(allLists.map((l) => [l.id, l.name]));

  // Calculate dynamic trends based on actual ratios
  const totalTasks = completedTasks.length + pendingTasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const sharedRatio =
    allLists.length > 0
      ? Math.round((sharedLists.length / allLists.length) * 100)
      : 0;

  const stats = [
    {
      label: "Listas totales",
      value: allLists.length,
      icon: FolderOpen,
      color: "blue",
      bg: "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25",
      text: "text-white",
      trend: allLists.length,
      trendLabel: "totales",
    },
    {
      label: "Compartidas",
      value: sharedLists.length,
      icon: Users,
      color: "purple",
      bg: "bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/25",
      text: "text-white",
      trend: sharedRatio,
      trendLabel: "% del total",
    },
    {
      label: "Tasa de éxito",
      value: `${completionRate}%`,
      icon: CheckCircle2,
      color: "green",
      bg: "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/25",
      text: "text-white",
      trend: completionRate,
      trendLabel: "completadas",
    },
    {
      label: "Pendientes",
      value: pendingTasks.length,
      icon: Clock,
      color: "yellow",
      bg: "bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-500/25",
      text: "text-white",
      trend: pendingTasks.length,
      trendLabel: "por hacer",
    },
  ];

  return (
    <>
      <Header
        title={isListsSection ? "Mis listas" : "Panel de control"}
        description={
          isListsSection
            ? activeTab === "personal"
              ? `${personalLists.length} lista${personalLists.length !== 1 ? "s" : ""} personal${personalLists.length !== 1 ? "es" : ""}`
              : `${sharedLists.length} lista${sharedLists.length !== 1 ? "s" : ""} compartida${sharedLists.length !== 1 ? "s" : ""}`
            : `Bienvenido, ${user.name.split(" ")[0]}`
        }
        showMenuButton={true}
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            disabled={!canCreate}
          >
            <span className="hidden sm:inline">Nueva lista</span>
          </Button>
        }
      />

      {/* Tab bar — Personales / Compartidas */}
      {isListsSection && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800">
          <div className="flex max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8">
            {(["personal", "shared"] as const).map((tab) => {
              const isTabActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`relative flex items-center gap-2 py-3.5 px-4 sm:px-5 text-sm font-medium transition-all duration-200 ${
                    isTabActive
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab === "personal" ? (
                    <FolderOpen size={14} />
                  ) : (
                    <Users size={14} />
                  )}
                  <span>
                    {tab === "personal" ? "Personales" : "Compartidas"}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-semibold transition-colors ${
                      isTabActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab === "personal"
                      ? personalLists.length
                      : sharedLists.length}
                  </span>
                  {isTabActive && (
                    <motion.span
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4 md:p-8 space-y-6 sm:space-y-8 md:space-y-10 max-w-[1400px] mx-auto">
        {/* Stats - solo mostrar en vista general */}
        {!isListsSection && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 20px 40px -12px rgba(59,130,246,0.2)",
                }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-white hover:border-blue-200 transition-all duration-300 overflow-hidden dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/0 group-hover:to-blue-50/20 dark:to-blue-500/0 dark:group-hover:to-blue-500/10 transition-all duration-500 pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm",
                      stat.bg,
                    )}
                  >
                    <stat.icon
                      size={18}
                      className={cn("text-white", stat.text)}
                    />
                  </div>

                  {stat.trend !== undefined && stat.trendLabel && (
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                        stat.color === "green"
                          ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                          : stat.color === "yellow"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
                      )}
                    >
                      {stat.trend}
                      <span className="opacity-75">{stat.trendLabel}</span>
                    </div>
                  )}
                </div>

                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
                  {stat.label}
                </p>

                {/* Animated background effect */}
                <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-400/10 animate-pulse" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Smart widgets — only in overview */}
        {!isListsSection && userTasks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weekly activity chart */}
            <div className="lg:col-span-2 p-5 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Actividad semanal
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Últimos 7 días
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    <span className="text-gray-500">Creadas</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                    <span className="text-gray-500">Completadas</span>
                  </span>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-32">
                {weekData.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="w-full flex gap-0.5 items-end h-24">
                      <div
                        className="flex-1 rounded-t-md bg-blue-200 dark:bg-blue-900/50 transition-all duration-500"
                        style={{
                          height: `${Math.round((d.created / maxWeek) * 96)}px`,
                          minHeight: d.created > 0 ? "4px" : "0",
                        }}
                      />
                      <div
                        className="flex-1 rounded-t-md bg-green-400 dark:bg-green-600 transition-all duration-500"
                        style={{
                          height: `${Math.round((d.done / maxWeek) * 96)}px`,
                          minHeight: d.done > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium capitalize",
                        d.isToday
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 dark:text-slate-500",
                      )}
                    >
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Today summary */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                    <Zap size={13} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-slate-100">
                      {createdToday}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">
                      creadas hoy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                    <CheckCircle2 size={13} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-slate-100">
                      {completedToday}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">
                      completadas hoy
                    </p>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    {completionRate}%
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    productividad
                  </p>
                </div>
              </div>
            </div>

            {/* Right column: Priorities + Upcoming */}
            <div className="space-y-4">
              {/* Priority breakdown */}
              <div className="p-5 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Flag size={13} className="text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Prioridades pendientes
                  </h3>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      key: "urgent",
                      label: "Crítica",
                      color: "bg-red-500",
                      text: "text-red-600",
                      bg: "bg-red-50 dark:bg-red-950/20",
                    },
                    {
                      key: "high",
                      label: "Alta",
                      color: "bg-orange-500",
                      text: "text-orange-600",
                      bg: "bg-orange-50 dark:bg-orange-950/20",
                    },
                    {
                      key: "medium",
                      label: "Media",
                      color: "bg-yellow-500",
                      text: "text-yellow-600",
                      bg: "bg-yellow-50 dark:bg-yellow-950/20",
                    },
                    {
                      key: "low",
                      label: "Baja",
                      color: "bg-green-500",
                      text: "text-green-600",
                      bg: "bg-green-50 dark:bg-green-950/20",
                    },
                  ].map(({ key, label, color, text, bg }) => {
                    const count =
                      priorityCounts[key as keyof typeof priorityCounts];
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg",
                          bg,
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", color)} />
                          <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                            {label}
                          </span>
                        </div>
                        <span
                          className={cn("text-xs font-bold tabular-nums", text)}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming deadlines */}
              {upcoming.length > 0 && (
                <div className="p-5 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays size={13} className="text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Próximos vencimientos
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {upcoming.map((t) => {
                      const daysLeft = Math.ceil(
                        (parseISO(t.dueDate!).getTime() - today.getTime()) /
                          86400000,
                      );
                      return (
                        <div key={t.id} className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full flex-shrink-0",
                              daysLeft === 0
                                ? "bg-red-500"
                                : daysLeft <= 2
                                  ? "bg-orange-500"
                                  : "bg-blue-500",
                            )}
                          />
                          <p className="text-xs text-gray-700 dark:text-slate-300 truncate flex-1">
                            {t.title}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-semibold tabular-nums flex-shrink-0",
                              daysLeft === 0
                                ? "text-red-600"
                                : daysLeft <= 2
                                  ? "text-orange-600"
                                  : "text-blue-600",
                            )}
                          >
                            {daysLeft === 0 ? "Hoy" : `${daysLeft}d`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listas personales */}
        {(!isListsSection || activeTab === "personal") && (
          <section>
            {!isListsSection && (
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center">
                    <FolderOpen
                      size={16}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Mis listas
                    </h2>
                    <p className="text-xs text-gray-500">
                      {personalLists.length}{" "}
                      {personalLists.length === 1 ? "lista" : "listas"}
                    </p>
                  </div>
                </div>
                {personalLists.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus size={14} />}
                  >
                    Añadir lista
                  </Button>
                )}
              </div>
            )}
            {personalLists.length === 0 ? (
              <EmptyState
                icon={<ListTodo size={24} />}
                title="Aún no tienes listas personales"
                description="Crea tu primera lista personal para empezar a organizar tus tareas."
                action={
                  <Button
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus size={14} />}
                  >
                    Crear lista
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {personalLists.map((list, i) => (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <ListCard list={list} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Listas compartidas */}
        {(!isListsSection || activeTab === "shared") && (
          <section>
            {!isListsSection && (
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Users size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Listas compartidas
                    </h2>
                    <p className="text-xs text-gray-500">
                      {sharedLists.length}{" "}
                      {sharedLists.length === 1 ? "lista" : "listas"}
                    </p>
                  </div>
                </div>
                {sharedLists.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus size={14} />}
                  >
                    Añadir lista
                  </Button>
                )}
              </div>
            )}
            {sharedLists.length === 0 ? (
              <EmptyState
                icon={<Users size={24} />}
                title="Aún no tienes listas compartidas"
                description="Crea una lista compartida o acepta una invitación para colaborar con otros."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus size={14} />}
                  >
                    Crear lista compartida
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {sharedLists.map((list, i) => (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <ListCard list={list} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Crear primera lista - solo mostrar en vista general */}
        {!isListsSection && allLists.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-xl border-2 border-dashed border-gray-200 text-center"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Plus size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Crea tu primera lista
            </h3>
            <p className="text-sm text-gray-500 mt-1.5 max-w-sm mx-auto">
              Empieza creando una lista personal o compartida para organizar tus
              tareas.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<ArrowRight size={16} />}
              >
                Comenzar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Aviso de límite del plan */}
        {!isListsSection && !canCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 rounded-xl bg-gray-50 border border-gray-200"
          >
            <p className="text-sm text-gray-700 font-semibold">
              Has alcanzado el límite de {limits.maxLists} listas en el plan{" "}
              {userPlan}.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Actualiza a PRO para listas ilimitadas, tareas y miembros del
              equipo.
            </p>
          </motion.div>
        )}
      </div>

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
