"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTeamStore } from "@/stores/teamStore";
import { useActivityStore, type ActivityItem } from "@/stores/activityStore";
import Header from "@/components/layout/Header";
import Avatar from "@/components/ui/Avatar";
import {
  Activity,
  CheckCircle2,
  Plus,
  Edit3,
  Archive,
  Trash2,
  UserPlus,
  MessageCircle,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type ActionFilter =
  | "all"
  | "created"
  | "completed"
  | "updated"
  | "assigned"
  | "archived"
  | "deleted"
  | "commented";

const ACTION_META: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgStyle: React.CSSProperties;
  }
> = {
  created: {
    label: "creó",
    icon: Plus,
    color: "text-blue-600",
    bgStyle: { backgroundColor: "rgba(37,99,235,0.07)" },
  },
  completed: {
    label: "completó",
    icon: CheckCircle2,
    color: "text-green-600",
    bgStyle: { backgroundColor: "rgba(22,163,74,0.07)" },
  },
  updated: {
    label: "editó",
    icon: Edit3,
    color: "text-yellow-600",
    bgStyle: { backgroundColor: "rgba(202,138,4,0.07)" },
  },
  assigned: {
    label: "asignó",
    icon: UserPlus,
    color: "text-purple-600",
    bgStyle: { backgroundColor: "rgba(147,51,234,0.07)" },
  },
  archived: {
    label: "archivó",
    icon: Archive,
    color: "text-orange-600",
    bgStyle: { backgroundColor: "rgba(234,88,12,0.07)" },
  },
  deleted: {
    label: "eliminó",
    icon: Trash2,
    color: "text-red-600",
    bgStyle: { backgroundColor: "rgba(239,68,68,0.07)" },
  },
  commented: {
    label: "comentó",
    icon: MessageCircle,
    color: "text-violet-600",
    bgStyle: { backgroundColor: "rgba(139,92,246,0.07)" },
  },
};

function groupByDate(entries: ActivityItem[]) {
  const groups: Record<string, ActivityItem[]> = {};
  entries.forEach((e) => {
    const d = parseISO(e.timestamp);
    const key = isToday(d)
      ? "Hoy"
      : isYesterday(d)
        ? "Ayer"
        : format(d, "d 'de' MMMM, yyyy", { locale: es });
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return groups;
}

export default function ActivityPage() {
  const { user } = useAuthStore();
  const { lists, getUserLists } = useListStore();
  const { currentTeam, teams } = useTeamStore();
  const {
    activities,
    subscribeToUserActivity,
    subscribeToListActivity,
    subscribeToTeamActivity,
    cleanup,
  } = useActivityStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActionFilter>("all");

  // Subscribe to all activity sources
  useEffect(() => {
    if (!user) return;

    // Subscribe to user activity
    subscribeToUserActivity(user.id);

    // Subscribe to all list activities
    const userLists = getUserLists(user.id);
    userLists.forEach((list) => {
      subscribeToListActivity(list.id);
    });

    // Subscribe to team activities
    teams.forEach((team) => {
      subscribeToTeamActivity(team.id);
    });

    return () => {
      cleanup();
    };
  }, [user?.id, lists.length, teams.length]);

  // Filter and search activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply action filter
    if (filter !== "all") {
      filtered = filtered.filter((a) => a.action === filter);
    }

    // Apply search
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.userName.toLowerCase().includes(term) ||
          a.targetName.toLowerCase().includes(term) ||
          a.listName?.toLowerCase().includes(term) ||
          a.details?.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [activities, filter, search]);

  // Group by date
  const grouped = useMemo(
    () => groupByDate(filteredActivities),
    [filteredActivities],
  );
  const groupKeys = Object.keys(grouped);

  // Calculate stats
  const totalToday = filteredActivities.filter((e) =>
    isToday(parseISO(e.timestamp)),
  ).length;

  return (
    <>
      <Header
        title="Centro de Actividad"
        description="Todo lo que ocurre en tiempo real"
        showMenuButton={true}
      />

      <div className="p-3 sm:p-4 md:p-8 max-w-[900px] mx-auto space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Hoy", value: totalToday, color: "text-blue-600" },
            {
              label: "Esta semana",
              value: filteredActivities.filter((e) => {
                try {
                  const d = parseISO(e.timestamp);
                  const now = new Date();
                  return now.getTime() - d.getTime() < 7 * 86400000;
                } catch {
                  return false;
                }
              }).length,
              color: "text-indigo-600",
            },
            {
              label: "Completadas",
              value: filteredActivities.filter((e) => e.action === "completed")
                .length,
              color: "text-green-600",
            },
            {
              label: "Total eventos",
              value: filteredActivities.length,
              color: "text-gray-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="p-4 rounded-2xl border"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
              }}
            >
              <p className={cn("text-2xl font-bold tabular-nums", s.color)}>
                {s.value}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por tarea o usuario..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                border: "1px solid var(--border-input)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(
              [
                "all",
                "created",
                "completed",
                "updated",
                "assigned",
                "archived",
              ] as ActionFilter[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-medium transition-colors border",
                  filter === f ? "bg-blue-600 border-blue-600" : "",
                )}
                style={
                  filter !== f
                    ? {
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-secondary)",
                        borderColor: "var(--border-color)",
                      }
                    : { color: "var(--text-on-accent)" }
                }
              >
                {f === "all"
                  ? "Todos"
                  : f === "created"
                    ? "Creadas"
                    : f === "completed"
                      ? "Completadas"
                      : f === "updated"
                        ? "Editadas"
                        : f === "assigned"
                          ? "Asignadas"
                          : "Archivadas"}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <Activity size={28} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              Sin actividad registrada
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {date}
                </p>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: "var(--border-color)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {items.length} eventos
                </span>
              </div>
              <div className="space-y-2">
                {items.map((entry, i) => {
                  const meta = ACTION_META[entry.action] || ACTION_META.updated;
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-start gap-3 p-4 rounded-2xl border transition-colors group"
                      style={{
                        backgroundColor: "var(--bg-card)",
                        borderColor: "var(--border-color)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(37,99,235,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-color)";
                      }}
                    >
                      <Avatar
                        name={entry.userName}
                        photoURL={entry.userPhotoURL}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <span className="font-semibold">
                            {entry.userName}
                          </span>{" "}
                          <span className={cn("font-medium", meta.color)}>
                            {meta.label}
                          </span>
                          {" la tarea "}
                          <span
                            className="font-medium truncate block"
                            style={{ color: "var(--text-primary)" }}
                          >
                            "{entry.targetName}"
                          </span>
                          {entry.details && (
                            <span style={{ color: "var(--text-tertiary)" }}>
                              {" "}
                              {entry.details}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
                              meta.color,
                            )}
                            style={meta.bgStyle}
                          >
                            <Icon size={10} />
                            {meta.label.charAt(0).toUpperCase() +
                              meta.label.slice(1)}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {entry.listName}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "var(--border-color)" }}
                          >
                            ·
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {format(parseISO(entry.timestamp), "HH:mm", {
                              locale: es,
                            })}
                          </span>
                        </div>
                      </div>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={meta.bgStyle}
                      >
                        <Icon size={14} className={meta.color} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
