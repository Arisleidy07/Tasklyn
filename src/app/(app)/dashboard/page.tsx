"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUIStore } from "@/stores/uiStore";
import { useActivityStore, type ActivityItem } from "@/stores/activityStore";
import Header from "@/components/layout/Header";
import ListCard from "@/components/lists/ListCard";
import CreateListModal from "@/components/lists/CreateListModal";
import {
  SortableListContainer,
  SortableListItem,
} from "@/components/lists/SortableListContainer";
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
  CalendarDays,
  Zap,
  Activity,
  Layout,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { PLAN_FEATURES, type Plan } from "@/types";
import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG } from "@/lib/priority";
import {
  format,
  subDays,
  isSameDay,
  parseISO,
  isBefore,
  addDays,
} from "date-fns";
import { es } from "date-fns/locale";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ============================================
// SPARKLINE CHART COMPONENT (MINI AREA)
// ============================================
function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const series = [{ name: "Value", data }];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      height: 60,
      sparkline: { enabled: true },
      background: "transparent",
      animations: {
        enabled: true,
        speed: 800,
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    colors: [color],
    stroke: {
      curve: "smooth",
      width: 2,
      lineCap: "round",
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.2,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    tooltip: {
      enabled: false,
    },
    grid: {
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    },
  };

  if (!mounted) {
    return <div className="h-[60px] w-full" />;
  }

  return (
    <div className="w-full h-[60px]">
      <Chart options={options} series={series} type="area" height={60} />
    </div>
  );
}

// ============================================
// COUNT UP ANIMATION COMPONENT
// ============================================
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    const duration = 1000;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const pct = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setCount(Math.round(ease * target));
      if (pct < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);
  return (
    <span className="font-mono tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

// ============================================
// TRADING CHART COMPONENT (APEXCHARTS)
// ============================================
function TradingAreaChart({
  data,
}: {
  data: { label: string; done: number; created: number }[];
}) {
  const { theme } = useUIStore();
  const isDark = theme === "dark";
  const [chartReady, setChartReady] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => setChartReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const series = useMemo(
    () => [
      {
        name: "Completadas",
        data: data.map((d) => d.done),
      },
      {
        name: "Creadas",
        data: data.map((d) => d.created),
      },
    ],
    [data],
  );

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      height: 320,
      fontFamily: "Inter, system-ui, sans-serif",
      background: "transparent",
      toolbar: { show: false },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: false,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
      sparkline: {
        enabled: false,
      },
    },
    colors: ["#3b82f6", "#10b981"],
    stroke: {
      curve: "smooth",
      width: 3,
      lineCap: "round",
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "rgba(148, 163, 184, 0.2)",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: data.map((d) => d.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: isDark ? "#94a3b8" : "#64748b",
          fontSize: "11px",
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          colors: isDark ? "#94a3b8" : "#64748b",
          fontSize: "11px",
        },
      },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => `${val} tareas`,
      },
      style: {
        fontSize: "12px",
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontSize: "11px",
      fontFamily: "Inter, sans-serif",
      labels: {
        colors: isDark ? "#94a3b8" : "#64748b",
      },
      markers: {
        offsetX: -4,
      },
      itemMargin: {
        horizontal: 15,
      },
    },
    markers: {
      size: 0,
      strokeWidth: 0,
      hover: {
        size: 6,
      },
    },
  };

  if (!chartReady || data.length === 0) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center">
        <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Cargando gráfico...
        </div>
      </div>
    );
  }

  return (
    <div ref={chartRef} className="w-full">
      <Chart options={options} series={series} type="area" height={320} />
    </div>
  );
}

// ============================================
// KPI CARD COMPONENT (GLASSMORPHISM + SPARKLINE)
// ============================================
interface KPICardProps {
  stat: {
    label: string;
    numericValue: number;
    suffix: string;
    icon: React.ElementType;
    bg: string;
    sparklineColor: string;
    badge: string;
    badgeColor: string;
    sparklineData: number[];
  };
  index: number;
}

function KPICard({ stat, index }: KPICardProps) {
  return (
    <motion.div
      key={stat.label}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "group relative p-4 sm:p-5 rounded-2xl overflow-hidden",
        "border backdrop-blur-md transition-all duration-300",
      )}
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg"
          style={{ backgroundColor: stat.bg }}
        >
          <stat.icon size={18} style={{ color: "var(--text-on-accent)" }} />
        </div>
        <span
          className={cn(
            "text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm",
            stat.badgeColor,
          )}
        >
          {stat.badge}
        </span>
      </div>

      <p
        className="text-2xl sm:text-3xl font-bold tracking-tight relative z-10"
        style={{ color: "var(--text-primary)" }}
      >
        <CountUp target={stat.numericValue} suffix={stat.suffix} />
      </p>
      <p
        className="text-xs font-medium relative z-10"
        style={{ color: "var(--text-secondary)" }}
      >
        {stat.label}
      </p>

      {/* Sparkline Chart */}
      <div className="mt-3 relative z-10">
        <SparklineChart data={stat.sparklineData} color={stat.sparklineColor} />
      </div>
    </motion.div>
  );
}

// ============================================
// ACTIVITY TIMELINE COMPONENT (REAL ACTIVITY)
// ============================================
function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  const getTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - parseISO(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Ahora";
      if (mins < 60) return `${mins}m`;
      const h = Math.floor(mins / 60);
      if (h < 24) return `${h}h`;
      const d = Math.floor(h / 24);
      if (d < 7) return `${d}d`;
      return `${Math.floor(d / 7)}s`;
    } catch {
      return "";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "completed":
        return "#10b981"; // green
      case "created":
        return "#2563eb"; // blue
      case "updated":
        return "#f59e0b"; // amber
      case "deleted":
        return "#ef4444"; // red
      case "commented":
        return "#8b5cf6"; // violet
      case "assigned":
        return "#06b6d4"; // cyan
      case "archived":
        return "#6b7280"; // gray
      default:
        return "#2563eb";
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "completed":
        return "completó";
      case "created":
        return "creó";
      case "updated":
        return "modificó";
      case "deleted":
        return "eliminó";
      case "commented":
        return "comentó en";
      case "assigned":
        return "asignó";
      case "archived":
        return "archivó";
      default:
        return "modificó";
    }
  };

  return (
    <div className="relative">
      <div
        className="absolute left-[19px] top-3 bottom-3 w-[2px]"
        style={{ backgroundColor: "var(--border-divider)" }}
      />

      <div className="space-y-0">
        {activities.slice(0, 4).map((item, i) => {
          const timeAgo = getTimeAgo(item.timestamp);
          const actionColor = getActionColor(item.action);
          const actionText = getActionText(item.action);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={cn(
                "flex items-start gap-3 pl-2 pr-3 py-3 relative group cursor-pointer transition-colors rounded-xl",
                i < activities.length - 1 && "mb-1",
              )}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div
                className="relative z-10 w-2.5 h-2.5 rounded-full mt-2.5 flex-shrink-0 border-2"
                style={{
                  backgroundColor: actionColor,
                  borderColor: "var(--bg-primary)",
                }}
              />

              <div className="relative flex-shrink-0">
                {item.userPhotoURL ? (
                  <div
                    className="w-8 h-8 rounded-full p-[2px]"
                    style={{ backgroundColor: actionColor }}
                  >
                    <img
                      src={item.userPhotoURL}
                      alt={item.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${actionColor}80, ${actionColor})`,
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm leading-snug"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span className="font-semibold">{item.userName}</span>{" "}
                  <span className="font-medium" style={{ color: actionColor }}>
                    {actionText}
                  </span>{" "}
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    "{item.targetName}"
                  </span>
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {item.listName || "Lista personal"}
                </p>
              </div>

              <span
                className="text-[10px] font-medium tabular-nums flex-shrink-0"
                style={{ color: "var(--text-tertiary)" }}
              >
                {timeAgo}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// SHARED LIST ROW COMPONENT (WITH LINK)
// ============================================
function SharedListRow({
  list,
  index,
}: {
  list: { id: string; name: string; members: any[]; type: string };
  index: number;
}) {
  const colors = [
    {
      border: "hover:border-blue-500/40",
      glow: "group-hover:shadow-blue-500/20",
    },
    {
      border: "hover:border-purple-500/40",
      glow: "group-hover:shadow-purple-500/20",
    },
    {
      border: "hover:border-emerald-500/40",
      glow: "group-hover:shadow-emerald-500/20",
    },
    {
      border: "hover:border-amber-500/40",
      glow: "group-hover:shadow-amber-500/20",
    },
  ];
  const color = colors[index % colors.length];

  return (
    <Link href={`/lists/${list.id}`} className="block">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 + index * 0.08, duration: 0.4 }}
        className={cn(
          "group flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer",
          "border transition-all duration-300",
          "hover:border-blue-300",
        )}
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <Layout size={16} style={{ color: "var(--text-tertiary)" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium truncate transition-colors"
            style={{ color: "var(--text-primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
            }}
          >
            {list.name}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            {list.members.length} miembro{list.members.length !== 1 ? "s" : ""}
          </p>
        </div>

        <ArrowUpRight
          size={14}
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-0.5 translate-x-0.5"
          style={{ color: "var(--text-tertiary)" }}
        />
      </motion.div>
    </Link>
  );
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view") as
    | "todas"
    | "personal"
    | "shared"
    | null;
  const section = searchParams.get("section");
  const isListsSection = section === "lists" || view !== null;
  const activeTab: "todas" | "personal" | "shared" =
    view === "shared" ? "shared" : view === "personal" ? "personal" : "todas";

  const { user } = useAuthStore();
  const { getPersonalLists, getSharedLists, getUserLists, lists } =
    useListStore();
  const { tasks } = useTaskStore();
  const {
    activities,
    subscribeToUserActivity,
    subscribeToListActivity,
    cleanup,
  } = useActivityStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Subscribe to activity for user and all their lists
  useEffect(() => {
    if (!user) return;

    // Subscribe to user activity
    subscribeToUserActivity(user.id);

    // Subscribe to activity from all lists the user has access to
    const userLists = getUserLists(user.id);
    userLists.forEach((list) => {
      subscribeToListActivity(list.id);
    });

    return () => {
      cleanup();
    };
  }, [user?.id, lists.length]);

  // All data calculations BEFORE any conditional returns
  const { reorderLists } = useListStore();
  const personalLists = user
    ? [...getPersonalLists(user.id)].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      )
    : [];
  const sharedLists = user
    ? [...getSharedLists(user.id)].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      )
    : [];
  const allLists = user ? getUserLists(user.id) : [];
  const userPlan = (user?.plan || "free") as Plan;
  const limits = PLAN_FEATURES[userPlan] || PLAN_FEATURES["free"];
  const canCreate = allLists.length < limits.maxLists;

  const allListIds = new Set(allLists.map((l) => l.id));
  const userTasks = tasks.filter((t) => allListIds.has(t.listId));
  const completedTasks = userTasks.filter((t) => t.status === "completed");
  const pendingTasks = userTasks.filter((t) => t.status === "pending");

  const today = new Date();

  const weekData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
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
  }, [completedTasks, userTasks, today]);

  const handleTabChange = (tab: "todas" | "personal" | "shared") => {
    router.replace(`/dashboard?section=lists&view=${tab}`);
  };

  if (!user) return null;

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

  const totalTasks = completedTasks.length + pendingTasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Generate sparkline data based on weekly trend
  const generateSparklineData = (baseValue: number, variance: number = 5) => {
    return Array.from({ length: 10 }, (_, i) => {
      const trend =
        Math.sin(i * 0.8) * variance + baseValue + Math.random() * 2;
      return Math.max(0, Math.round(trend));
    });
  };

  const stats = [
    {
      label: "Listas totales",
      numericValue: allLists.length,
      suffix: "",
      icon: FolderOpen,
      bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      sparklineColor: "#6366f1",
      badge: `${allLists.length} total`,
      badgeColor: "bg-blue-50 text-blue-600",
      sparklineData: generateSparklineData(allLists.length, 2),
    },
    {
      label: "Tareas totales",
      numericValue: userTasks.length,
      suffix: "",
      icon: TrendingUp,
      bg: "bg-gradient-to-br from-purple-500 to-pink-600",
      sparklineColor: "#a855f7",
      badge: `${completedTasks.length} completadas`,
      badgeColor: "bg-purple-50 text-purple-600",
      sparklineData: generateSparklineData(userTasks.length / 5, 3),
    },
    {
      label: "Tasa de éxito",
      numericValue: completionRate,
      suffix: "%",
      icon: CheckCircle2,
      bg: "bg-gradient-to-br from-green-500 to-emerald-600",
      sparklineColor: "#10b981",
      badge: `${completedTasks.length} completadas`,
      badgeColor: "bg-green-50 text-green-600",
      sparklineData: generateSparklineData(completionRate / 10, 1),
    },
    {
      label: "Pendientes",
      numericValue: pendingTasks.length,
      suffix: "",
      icon: Clock,
      bg: "bg-gradient-to-br from-yellow-500 to-orange-600",
      sparklineColor: "#ef4444",
      badge: "por completar",
      badgeColor: "bg-amber-50 text-amber-600",
      sparklineData: generateSparklineData(pendingTasks.length / 3, 2),
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

      {isListsSection && (
        <div
          className="backdrop-blur-sm border-b"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8">
            {[
              {
                key: "todas" as const,
                label: "Todas",
                count: allLists.length,
                icon: <Layout size={14} />,
              },
              {
                key: "personal" as const,
                label: "Personales",
                count: personalLists.length,
                icon: <FolderOpen size={14} />,
              },
              {
                key: "shared" as const,
                label: "Compartidas",
                count: sharedLists.length,
                icon: <Users size={14} />,
              },
            ].map(({ key, label, count, icon }) => {
              const isTabActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className="relative flex items-center gap-2 py-3.5 px-4 sm:px-5 text-sm font-medium transition-all duration-200"
                  style={{
                    color: isTabActive ? "#2563eb" : "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isTabActive)
                      e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isTabActive)
                      e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {icon}
                  <span>{label}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md font-semibold transition-colors"
                    style={{
                      backgroundColor: isTabActive
                        ? "var(--bg-info)"
                        : "var(--bg-secondary)",
                      color: isTabActive
                        ? "var(--text-link)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {count}
                  </span>
                  {isTabActive && (
                    <motion.span
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ backgroundColor: "#2563eb" }}
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

      <div className="p-3 sm:p-4 md:p-8 max-w-[1400px] mx-auto">
        {!isListsSection && (
          <>
            {/* KPI Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
            >
              {stats.map((stat, i) => (
                <KPICard key={stat.label} stat={stat} index={i} />
              ))}
            </motion.div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-4">
                {/* Trading Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="p-5 rounded-2xl border backdrop-blur-md shadow-sm"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: "var(--bg-info)" }}
                      >
                        <TrendingUp
                          size={18}
                          style={{ color: "var(--text-link)" }}
                        />
                      </div>
                      <div>
                        <h3
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Rendimiento semanal
                        </h3>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Tareas completadas vs creadas
                        </p>
                      </div>
                    </div>
                  </div>
                  {mounted && <TradingAreaChart data={weekData} />}
                </motion.div>

                {/* Shared Lists */}
                {sharedLists.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="p-5 rounded-2xl border backdrop-blur-md shadow-sm"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: "var(--bg-info)" }}
                        >
                          <Users
                            size={18}
                            style={{ color: "var(--text-link)" }}
                          />
                        </div>
                        <div>
                          <h3
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Listas compartidas
                          </h3>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {sharedLists.length} lista
                            {sharedLists.length !== 1 ? "s" : ""} compartida
                            {sharedLists.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/dashboard?section=lists&view=todas"
                        className="text-xs font-semibold hover:opacity-80 transition-colors"
                        style={{ color: "var(--text-link)" }}
                      >
                        Ver todas las listas
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {sharedLists.slice(0, 4).map((list, i) => (
                        <SharedListRow key={list.id} list={list} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Column - 1/3 width */}
              <div className="space-y-4">
                {/* Priority Breakdown */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="p-5 rounded-2xl border backdrop-blur-md shadow-sm"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: "var(--bg-info)" }}
                    >
                      🎯
                    </div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Prioridades
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {(
                      Object.entries(PRIORITY_CONFIG) as [
                        keyof typeof PRIORITY_CONFIG,
                        (typeof PRIORITY_CONFIG)[keyof typeof PRIORITY_CONFIG],
                      ][]
                    ).map(([key, cfg]) => {
                      const count =
                        priorityCounts[key as keyof typeof priorityCounts] ?? 0;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between px-3 py-2 rounded-lg"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm leading-none">
                              {cfg.emoji}
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <span
                            className="text-xs font-bold tabular-nums"
                            style={{ color: cfg.text.replace("text-", "") }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Activity Timeline */}
                {activities.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="p-5 rounded-2xl border backdrop-blur-md shadow-sm"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: "var(--bg-info)" }}
                        >
                          <Activity
                            size={18}
                            style={{ color: "var(--text-link)" }}
                          />
                        </div>
                        <div>
                          <h3
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Actividad reciente
                          </h3>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Últimas {Math.min(activities.length, 4)} acciones
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/activity"
                        className="text-xs font-semibold hover:opacity-80 transition-colors"
                        style={{ color: "var(--text-link)" }}
                      >
                        Ver toda la actividad
                      </Link>
                    </div>
                    <ActivityTimeline activities={activities} />
                  </motion.div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Lists Section */}
        {isListsSection && (
          <div className="mt-6">
            {activeTab === "todas" && (
              <>
                {allLists.length === 0 ? (
                  <EmptyState
                    icon={<ListTodo size={24} />}
                    title="Aún no tienes listas"
                    description="Crea tu primera lista para empezar a organizar tus tareas."
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
                  <SortableListContainer
                    lists={allLists.sort(
                      (a, b) => (a.order ?? 0) - (b.order ?? 0),
                    )}
                    wrapperClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                    onReorder={(newOrder) =>
                      reorderLists(newOrder.map((l) => l.id))
                    }
                  >
                    {(list, index, total, moveUp, moveDown) => (
                      <SortableListItem
                        key={list.id}
                        list={list}
                        index={index}
                        total={total}
                        onMoveUp={moveUp}
                        onMoveDown={moveDown}
                        showMoveButtons
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.35 }}
                        >
                          <ListCard list={list} />
                        </motion.div>
                      </SortableListItem>
                    )}
                  </SortableListContainer>
                )}
              </>
            )}

            {activeTab === "personal" && (
              <>
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
                  <SortableListContainer
                    lists={personalLists}
                    wrapperClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                    onReorder={(newOrder) =>
                      reorderLists(newOrder.map((l) => l.id))
                    }
                  >
                    {(list, index, total, moveUp, moveDown) => (
                      <SortableListItem
                        key={list.id}
                        list={list}
                        index={index}
                        total={total}
                        onMoveUp={moveUp}
                        onMoveDown={moveDown}
                        showMoveButtons
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.35 }}
                        >
                          <ListCard list={list} />
                        </motion.div>
                      </SortableListItem>
                    )}
                  </SortableListContainer>
                )}
              </>
            )}

            {activeTab === "shared" && (
              <>
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
                  <SortableListContainer
                    lists={sharedLists}
                    wrapperClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                    onReorder={(newOrder) =>
                      reorderLists(newOrder.map((l) => l.id))
                    }
                  >
                    {(list, index, total, moveUp, moveDown) => (
                      <SortableListItem
                        key={list.id}
                        list={list}
                        index={index}
                        total={total}
                        onMoveUp={moveUp}
                        onMoveDown={moveDown}
                        showMoveButtons
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.35 }}
                        >
                          <ListCard list={list} />
                        </motion.div>
                      </SortableListItem>
                    )}
                  </SortableListContainer>
                )}
              </>
            )}
          </div>
        )}

        {/* Empty State - No lists */}
        {!isListsSection && allLists.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-8 rounded-xl border-2 border-dashed text-center"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(37,99,235,0.1)" }}
            >
              <Plus size={24} style={{ color: "var(--text-link)" }} />
            </div>
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Crea tu primera lista
            </h3>
            <p
              className="text-sm mt-1.5 max-w-sm mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
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

        {/* Plan limit warning */}
        {!isListsSection && !canCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 p-5 rounded-xl border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Has alcanzado el límite de {limits.maxLists} listas en el plan{" "}
              {userPlan}.
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
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
