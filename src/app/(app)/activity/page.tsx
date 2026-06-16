"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { useListStore } from "@/stores/listStore";
import { useTeamStore } from "@/stores/teamStore";
import { useUserProfiles } from "@/hooks/useUserProfiles";
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
  | "archived";

interface ActivityEntry {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  performedByPhoto?: string;
  performedAt: string;
  taskTitle: string;
  listName: string;
  details?: string;
}

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
};

function groupByDate(entries: ActivityEntry[]) {
  const groups: Record<string, ActivityEntry[]> = {};
  entries.forEach((e) => {
    const d = parseISO(e.performedAt);
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
  const { tasks } = useTaskStore();
  const { getUserLists } = useListStore();
  const { currentTeam } = useTeamStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActionFilter>("all");

  // Collect every foreign UID from tasks (before early return — hooks rule)
  const allUids = useMemo(() => {
    if (!user) return [];
    const uids = new Set<string>();
    tasks.forEach((task) => {
      if (task.createdBy) uids.add(task.createdBy);
      if (task.completedBy) uids.add(task.completedBy);
      if (task.assignedTo) uids.add(task.assignedTo);
      if ((task as any).archivedBy) uids.add((task as any).archivedBy);
      task.history?.forEach((h) => {
        if (h.performedBy) uids.add(h.performedBy);
      });
    });
    uids.delete(user.id);
    return [...uids];
  }, [tasks, user]);

  const { profiles } = useUserProfiles(allUids);

  const entries = useMemo<ActivityEntry[]>(() => {
    if (!user) return [];
    const allLists = getUserLists(user.id);
    const listNameMap = new Map(allLists.map((l) => [l.id, l.name]));
    const getListName = (id: string) => listNameMap.get(id) || "Lista";
    const resolve = (uid: string) =>
      uid === user.id
        ? { name: user.name, photoURL: user.photoURL }
        : {
            name: profiles.get(uid)?.name ?? "...",
            photoURL: profiles.get(uid)?.photoURL,
          };

    const out: ActivityEntry[] = [];
    tasks.forEach((task) => {
      const creator = resolve(task.createdBy);
      out.push({
        id: `${task.id}-created`,
        action: "created",
        performedBy: task.createdBy,
        performedByName: creator.name,
        performedByPhoto: creator.photoURL,
        performedAt: task.createdAt,
        taskTitle: task.title,
        listName: getListName(task.listId),
      });
      if (task.completedAt && task.completedBy) {
        const completer = resolve(task.completedBy);
        out.push({
          id: `${task.id}-completed`,
          action: "completed",
          performedBy: task.completedBy,
          performedByName: completer.name,
          performedByPhoto: completer.photoURL,
          performedAt: task.completedAt,
          taskTitle: task.title,
          listName: getListName(task.listId),
        });
      }
      if (task.assignedTo && task.assignedTo !== task.createdBy) {
        const assigner = resolve(task.createdBy);
        const assignee = resolve(task.assignedTo);
        out.push({
          id: `${task.id}-assigned`,
          action: "assigned",
          performedBy: task.createdBy,
          performedByName: assigner.name,
          performedByPhoto: assigner.photoURL,
          performedAt: task.createdAt,
          taskTitle: task.title,
          listName: getListName(task.listId),
          details: `→ ${assignee.name}`,
        });
      }
      if ((task as any).archivedAt && (task as any).archivedBy) {
        const archiver = resolve((task as any).archivedBy);
        out.push({
          id: `${task.id}-archived`,
          action: "archived",
          performedBy: (task as any).archivedBy,
          performedByName: archiver.name,
          performedByPhoto: archiver.photoURL,
          performedAt: (task as any).archivedAt,
          taskTitle: task.title,
          listName: getListName(task.listId),
        });
      }
      task.history?.forEach((h) => {
        if (h.action === "updated") {
          const actor = resolve(h.performedBy);
          out.push({
            id: `${task.id}-hist-${h.id}`,
            action: "updated",
            performedBy: h.performedBy,
            performedByName: actor.name,
            performedByPhoto: actor.photoURL,
            performedAt: h.performedAt,
            taskTitle: task.title,
            listName: getListName(task.listId),
            details: h.details,
          });
        }
      });
    });

    out.sort(
      (a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
    );
    return out;
  }, [tasks, profiles, user, getUserLists]);

  if (!user) return null;

  const filtered = entries.filter((e) => {
    if (filter !== "all" && e.action !== filter) return false;
    if (
      search &&
      !e.taskTitle.toLowerCase().includes(search.toLowerCase()) &&
      !e.performedByName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const groups = groupByDate(filtered);
  const totalToday = entries.filter((e) =>
    isToday(parseISO(e.performedAt)),
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
              value: entries.filter((e) => {
                try {
                  const d = parseISO(e.performedAt);
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
              value: entries.filter((e) => e.action === "completed").length,
              color: "text-green-600",
            },
            {
              label: "Total eventos",
              value: entries.length,
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
                  filter === f ? "bg-blue-600 text-white border-blue-600" : "",
                )}
                style={
                  filter !== f
                    ? {
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-secondary)",
                        borderColor: "var(--border-color)",
                      }
                    : {}
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
        {filtered.length === 0 ? (
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
          Object.entries(groups).map(([date, items]) => (
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
                        name={entry.performedByName}
                        photoURL={entry.performedByPhoto}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <span className="font-semibold">
                            {entry.performedByName}
                          </span>{" "}
                          <span className={cn("font-medium", meta.color)}>
                            {meta.label}
                          </span>
                          {" la tarea "}
                          <span
                            className="font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            "{entry.taskTitle}"
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
                            {format(parseISO(entry.performedAt), "HH:mm", {
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
