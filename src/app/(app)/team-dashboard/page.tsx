"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { useTaskStore } from "@/stores/taskStore";
import { useListStore } from "@/stores/listStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  Award,
  Activity,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Plus,
  X,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

// ---- SVG Bar Chart ----
interface BarChartData {
  label: string;
  completed: number;
  pending: number;
}
function BarChart({
  data,
  height = 160,
}: {
  data: BarChartData[];
  height?: number;
}) {
  const maxVal = Math.max(...data.map((d) => d.completed + d.pending), 1);
  const barW = 100 / (data.length * 2.8);
  return (
    <svg width="100%" height={height + 20} className="overflow-visible">
      <defs>
        <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {[0, 50, 100].map((pct) => (
        <line
          key={pct}
          x1="0"
          y1={height - (pct / 100) * height}
          x2="100%"
          y2={height - (pct / 100) * height}
          stroke="currentColor"
          strokeOpacity={0.06}
          strokeWidth={1}
        />
      ))}
      {data.map((d, i) => {
        const totalH = ((d.completed + d.pending) / maxVal) * height;
        const compH = (d.completed / maxVal) * height;
        const x = (i / data.length) * 100 + barW * 0.4;
        return (
          <g key={i}>
            <rect
              x={`${x}%`}
              y={height - totalH}
              width={`${barW}%`}
              height={Math.max(totalH - compH, 0)}
              rx={3}
              fill="#f59e0b"
              fillOpacity={0.45}
            />
            <rect
              x={`${x}%`}
              y={height - compH}
              width={`${barW}%`}
              height={compH}
              rx={3}
              fill="url(#barBlue)"
            />
            <text
              x={`${x + barW / 2}%`}
              y={height + 14}
              fontSize={9}
              textAnchor="middle"
              fill="currentColor"
              fillOpacity={0.45}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- Donut Chart ----
function DonutChart({
  completed,
  total,
  size = 130,
}: {
  completed: number;
  total: number;
  size?: number;
}) {
  const r = (size - 22) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? completed / total : 0;
  return (
    <svg width={size} height={size}>
      <defs>
        <linearGradient id="donutG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.1}
        strokeWidth={14}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="url(#donutG)"
        strokeWidth={14}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        fontSize={18}
        fontWeight="bold"
        fill="currentColor"
      >
        {Math.round(pct * 100)}%
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize={9}
        fill="currentColor"
        fillOpacity={0.45}
      >
        cumplimiento
      </text>
    </svg>
  );
}

// ---- Goals Modal ----
interface CreateGoalModalProps {
  onClose: () => void;
  onSubmit: (goal: any) => Promise<string | void>;
  teamId: string;
  userId: string;
}
function CreateGoalModal({
  onClose,
  onSubmit,
  teamId,
  userId,
}: CreateGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("100");
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly">(
    "monthly",
  );
  const [type, setType] = useState<"tasks" | "completion" | "custom">("tasks");
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const now = new Date();
    const end = new Date(now);
    if (period === "weekly") end.setDate(end.getDate() + 7);
    else if (period === "monthly") end.setMonth(end.getMonth() + 1);
    else end.setMonth(end.getMonth() + 3);
    try {
      await onSubmit({
        teamId,
        title: title.trim(),
        description: description.trim(),
        targetValue: parseInt(targetValue) || 100,
        currentValue: 0,
        type,
        period,
        startDate: now.toISOString(),
        endDate: end.toISOString(),
        createdBy: userId,
        achieved: false,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-gray-200/80 dark:border-slate-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Target size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Nueva Meta
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Define un objetivo para el equipo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: 200 tareas este mes"
                autoFocus
                maxLength={80}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Tipo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="tasks">Tareas</option>
                  <option value="completion">% Cumplimiento</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Período
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Meta ({type === "completion" ? "% objetivo" : "cantidad"})
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                min={1}
                max={type === "completion" ? 100 : 99999}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Crear meta"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}

// ---- KPI Card ----
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease";
  icon: React.ElementType;
  bg: string;
  description?: string;
}

function KPICard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  bg,
  description,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        boxShadow: "0 20px 40px -12px rgba(59,130,246,0.2)",
      }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative p-5 rounded-2xl border border-gray-200/80 bg-white hover:border-blue-200 transition-all duration-300 overflow-hidden dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-500/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
            bg,
          )}
        >
          <Icon size={20} className="text-white" />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              changeType === "increase"
                ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
            )}
          >
            {changeType === "increase" ? (
              <ArrowUp size={10} />
            ) : (
              <ArrowDown size={10} />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mt-0.5">
        {title}
      </p>
      {description && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
          {description}
        </p>
      )}
    </motion.div>
  );
}

export default function TeamDashboardPage() {
  const { user } = useAuthStore();
  const {
    teams,
    currentTeam,
    setCurrentTeam,
    goals,
    subscribeToGoals,
    unsubscribeFromGoals,
    createGoal,
  } = useTeamStore();
  const { tasks } = useTaskStore();
  const { getUserLists } = useListStore();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month" | "year"
  >("month");
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    if (teams.length > 0 && !currentTeam) setCurrentTeam(teams[0]);
  }, [teams, currentTeam, setCurrentTeam]);

  useEffect(() => {
    if (currentTeam?.id) {
      subscribeToGoals(currentTeam.id);
      return () => unsubscribeFromGoals();
    }
  }, [currentTeam?.id]);

  const memberUids = useMemo(() => {
    if (!currentTeam || !user) return [];
    return currentTeam.members
      .map((m) => m.userId)
      .filter((uid) => uid !== user.id);
  }, [currentTeam, user]);

  const { getProfile: getMemberProfile } = useUserProfiles(memberUids);

  if (!user) return null;

  if (!currentTeam) {
    return (
      <>
        <Header
          title="Panel de Equipo"
          description="Crea un equipo para ver estadísticas"
          showMenuButton={true}
        />
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Sin equipos aún
          </h3>
          <p className="text-gray-500 dark:text-slate-400 mb-4">
            Ve a Equipos para crear tu primer equipo.
          </p>
          <button
            onClick={() => (window.location.href = "/teams")}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Ir a Equipos
          </button>
        </div>
      </>
    );
  }

  // Real team statistics
  const allLists = getUserLists(user.id);
  const teamMemberIds = new Set(currentTeam.members.map((m) => m.userId));
  const teamTasks = tasks.filter(
    (t) =>
      t.teamId === currentTeam.id ||
      teamMemberIds.has(t.assignedTo || "") ||
      teamMemberIds.has(t.createdBy),
  );
  const completedTasks = teamTasks.filter((t) => t.status === "completed");
  const pendingTasks = teamTasks.filter((t) => t.status === "pending");
  const overdueTasks = teamTasks.filter(
    (t) =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed",
  );
  const teamLists = allLists.filter(
    (l) =>
      l.teamId === currentTeam.id ||
      currentTeam.members.some((m) =>
        l.members.some((lm) => lm.userId === m.userId),
      ),
  );
  const completionRate =
    teamTasks.length > 0
      ? Math.round((completedTasks.length / teamTasks.length) * 100)
      : 0;

  // Last 7 days chart data
  const last7Days: BarChartData[] = Array.from({ length: 7 }).map((_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayCompleted = teamTasks.filter(
      (t) => t.completedAt && isSameDay(parseISO(t.completedAt), day),
    ).length;
    const dayPending = teamTasks.filter(
      (t) =>
        t.dueDate &&
        isSameDay(parseISO(t.dueDate), day) &&
        t.status === "pending",
    ).length;
    return {
      label: format(day, "EEE", { locale: es }).slice(0, 3),
      completed: dayCompleted,
      pending: dayPending,
    };
  });

  // Per-member productivity
  const memberStats = currentTeam.members
    .map((m) => {
      const mTasks = teamTasks.filter(
        (t) => t.assignedTo === m.userId || t.completedBy === m.userId,
      );
      return {
        userId: m.userId,
        completed: mTasks.filter((t) => t.status === "completed").length,
        total: mTasks.length,
      };
    })
    .sort((a, b) => b.completed - a.completed);

  const kpiData: KPICardProps[] = [
    {
      title: "Total Tareas",
      value: teamTasks.length,
      icon: BarChart3,
      bg: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25",
      description: "En el equipo",
    },
    {
      title: "Completadas",
      value: completedTasks.length,
      change: completionRate,
      changeType: "increase" as const,
      icon: CheckCircle2,
      bg: "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25",
      description: `${completionRate}% cumplimiento`,
    },
    {
      title: "Pendientes",
      value: pendingTasks.length,
      icon: Clock,
      bg: "bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-500/25",
      description: "En progreso",
    },
    {
      title: "Vencidas",
      value: overdueTasks.length,
      change: overdueTasks.length > 0 ? overdueTasks.length : undefined,
      changeType: "decrease" as const,
      icon: AlertTriangle,
      bg: "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25",
      description: "Requieren atención",
    },
    {
      title: "Miembros",
      value: currentTeam.members.length,
      icon: Users,
      bg: "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/25",
      description: "Activos",
    },
    {
      title: "Listas activas",
      value: teamLists.length,
      icon: FolderOpen,
      bg: "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/25",
      description: "Del equipo",
    },
  ];

  return (
    <>
      <Header
        title="Panel de Equipo"
        description={`Estadísticas en tiempo real · ${currentTeam.name}`}
        showMenuButton={true}
        actions={
          <div className="flex items-center gap-2">
            {teams.length > 1 && (
              <select
                value={currentTeam.id}
                onChange={(e) => {
                  const t = teams.find((t) => t.id === e.target.value);
                  if (t) setCurrentTeam(t);
                }}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="today">Hoy</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
              <option value="year">Año</option>
            </select>
          </div>
        }
      />

      <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {kpiData.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <KPICard {...kpi} />
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 p-6 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center">
                  <Activity
                    size={18}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                    Actividad — Últimos 7 días
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Completadas vs pendientes por día
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  Completadas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400/60" />
                  Pendientes
                </span>
              </div>
            </div>
            <div className="pl-6">
              <BarChart data={last7Days} height={160} />
            </div>
          </motion.div>

          {/* Donut */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-2 mb-4 self-start">
              <TrendingUp size={18} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                Productividad
              </h3>
            </div>
            <DonutChart
              completed={completedTasks.length}
              total={teamTasks.length}
              size={140}
            />
            <div className="grid grid-cols-2 gap-3 mt-4 w-full text-center">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20">
                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                  {completedTasks.length}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                  Completadas
                </p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/20">
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                  {pendingTasks.length}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
                  Pendientes
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Goals + Member stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goals */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="p-6 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/20 flex items-center justify-center">
                  <Target
                    size={18}
                    className="text-green-600 dark:text-green-400"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                    Objetivos del Equipo
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {goals.length} meta{goals.length !== 1 ? "s" : ""} activa
                    {goals.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGoalModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
              >
                <Plus size={14} /> Nueva meta
              </button>
            </div>
            <div className="space-y-4">
              {goals.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                  <Target
                    size={24}
                    className="text-gray-300 dark:text-slate-600 mx-auto mb-2"
                  />
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Sin metas definidas
                  </p>
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Crear primera meta
                  </button>
                </div>
              ) : (
                goals.slice(0, 4).map((goal) => {
                  const pct =
                    goal.targetValue > 0
                      ? Math.min(
                          (goal.currentValue / goal.targetValue) * 100,
                          100,
                        )
                      : 0;
                  const daysLeft = Math.max(
                    0,
                    Math.ceil(
                      (new Date(goal.endDate).getTime() - Date.now()) /
                        86400000,
                    ),
                  );
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-slate-300 truncate flex-1 mr-2">
                          {goal.title}
                        </span>
                        <span className="text-gray-500 dark:text-slate-400 flex-shrink-0 tabular-nums">
                          {goal.currentValue}/{goal.targetValue}
                          {goal.type === "completion" ? "%" : ""}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={cn(
                            "h-2 rounded-full",
                            pct >= 100
                              ? "bg-gradient-to-r from-green-500 to-emerald-600"
                              : pct >= 60
                                ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                                : "bg-gradient-to-r from-yellow-500 to-orange-500",
                          )}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                            goal.period === "weekly"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                              : goal.period === "monthly"
                                ? "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                                : "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
                          )}
                        >
                          {goal.period === "weekly"
                            ? "Semanal"
                            : goal.period === "monthly"
                              ? "Mensual"
                              : "Trimestral"}
                        </span>
                        <span>
                          {daysLeft > 0 ? `${daysLeft}d restantes` : "Vencida"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Per-member stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-500/20 flex items-center justify-center">
                <Award
                  size={18}
                  className="text-yellow-600 dark:text-yellow-400"
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  Productividad por Miembro
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Tareas completadas
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {memberStats.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">
                  Sin actividad registrada
                </p>
              ) : (
                memberStats.slice(0, 5).map((m, idx) => {
                  const maxC = Math.max(
                    ...memberStats.map((s) => s.completed),
                    1,
                  );
                  const pct = (m.completed / maxC) * 100;
                  return (
                    <div key={m.userId} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                          idx === 0
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                            : idx === 1
                              ? "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                              : idx === 2
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
                                : "bg-gray-50 text-gray-500 dark:bg-slate-800/50 dark:text-slate-500",
                        )}
                      >
                        {idx === 0
                          ? "🥇"
                          : idx === 1
                            ? "🥈"
                            : idx === 2
                              ? "🥉"
                              : idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                            {m.userId === user.id
                              ? `${user.name} (Tú)`
                              : getMemberProfile(m.userId).name}
                          </p>
                          <span className="text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums ml-2">
                            {m.completed}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 0.7,
                              ease: "easeOut",
                              delay: idx * 0.08,
                            }}
                            className={cn(
                              "h-1.5 rounded-full",
                              idx === 0
                                ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                                : idx === 1
                                  ? "bg-gradient-to-r from-gray-400 to-slate-500"
                                  : "bg-gradient-to-r from-blue-400 to-indigo-500",
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Goal modal */}
      <AnimatePresence>
        {showGoalModal && (
          <CreateGoalModal
            onClose={() => setShowGoalModal(false)}
            onSubmit={createGoal}
            teamId={currentTeam.id}
            userId={user.id}
          />
        )}
      </AnimatePresence>
    </>
  );
}
