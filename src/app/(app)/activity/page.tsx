"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { useListStore } from "@/stores/listStore";
import { useTeamStore } from "@/stores/teamStore";
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

type ActionFilter = "all" | "created" | "completed" | "updated" | "assigned" | "archived";

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

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  created:   { label: "creó",      icon: Plus,         color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/30" },
  completed: { label: "completó",  icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50 dark:bg-green-950/30" },
  updated:   { label: "editó",     icon: Edit3,        color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
  assigned:  { label: "asignó",    icon: UserPlus,     color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
  archived:  { label: "archivó",   icon: Archive,      color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  deleted:   { label: "eliminó",   icon: Trash2,       color: "text-red-600",    bg: "bg-red-50 dark:bg-red-950/30" },
};

function groupByDate(entries: ActivityEntry[]) {
  const groups: Record<string, ActivityEntry[]> = {};
  entries.forEach((e) => {
    const d = parseISO(e.performedAt);
    const key = isToday(d) ? "Hoy" : isYesterday(d) ? "Ayer" : format(d, "d 'de' MMMM, yyyy", { locale: es });
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

  if (!user) return null;

  const allLists = getUserLists(user.id);
  const listNameMap = new Map(allLists.map((l) => [l.id, l.name]));
  const getListName = (id: string) => listNameMap.get(id) || `Lista ${id.slice(0, 6)}`;
  const getName = (uid: string) => uid === user.id ? user.name : `Usuario ${uid.slice(0, 8)}`;
  const getPhoto = (uid: string) => uid === user.id ? user.photoURL : undefined;

  const entries = useMemo<ActivityEntry[]>(() => {
    const out: ActivityEntry[] = [];
    tasks.forEach((task) => {
      out.push({
        id: `${task.id}-created`,
        action: "created",
        performedBy: task.createdBy,
        performedByName: getName(task.createdBy),
        performedByPhoto: getPhoto(task.createdBy),
        performedAt: task.createdAt,
        taskTitle: task.title,
        listName: getListName(task.listId),
      });
      if (task.completedAt && task.completedBy) {
        out.push({
          id: `${task.id}-completed`,
          action: "completed",
          performedBy: task.completedBy,
          performedByName: getName(task.completedBy),
          performedByPhoto: getPhoto(task.completedBy),
          performedAt: task.completedAt,
          taskTitle: task.title,
          listName: getListName(task.listId),
        });
      }
      if (task.assignedTo && task.assignedTo !== task.createdBy) {
        out.push({
          id: `${task.id}-assigned`,
          action: "assigned",
          performedBy: task.createdBy,
          performedByName: getName(task.createdBy),
          performedByPhoto: getPhoto(task.createdBy),
          performedAt: task.createdAt,
          taskTitle: task.title,
          listName: getListName(task.listId),
          details: `→ ${getName(task.assignedTo)}`,
        });
      }
      if (task.archivedAt && task.archivedBy) {
        out.push({
          id: `${task.id}-archived`,
          action: "archived",
          performedBy: task.archivedBy,
          performedByName: getName(task.archivedBy),
          performedByPhoto: getPhoto(task.archivedBy),
          performedAt: task.archivedAt,
          taskTitle: task.title,
          listName: getListName(task.listId),
        });
      }
      task.history?.forEach((h) => {
        if (h.action === "updated") {
          out.push({
            id: `${task.id}-hist-${h.id}`,
            action: "updated",
            performedBy: h.performedBy,
            performedByName: getName(h.performedBy),
            performedByPhoto: getPhoto(h.performedBy),
            performedAt: h.performedAt,
            taskTitle: task.title,
            listName: getListName(task.listId),
            details: h.details,
          });
        }
      });
    });

    out.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
    return out;
  }, [tasks]);

  const filtered = entries.filter((e) => {
    if (filter !== "all" && e.action !== filter) return false;
    if (search && !e.taskTitle.toLowerCase().includes(search.toLowerCase()) &&
        !e.performedByName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const groups = groupByDate(filtered);
  const totalToday = entries.filter((e) => isToday(parseISO(e.performedAt))).length;

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
            { label: "Esta semana", value: entries.filter(e => { try { const d = parseISO(e.performedAt); const now = new Date(); return (now.getTime() - d.getTime()) < 7 * 86400000; } catch { return false; } }).length, color: "text-indigo-600" },
            { label: "Completadas", value: entries.filter(e => e.action === "completed").length, color: "text-green-600" },
            { label: "Total eventos", value: entries.length, color: "text-gray-600" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800">
              <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por tarea o usuario..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "created", "completed", "updated", "assigned", "archived"] as ActionFilter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-2 rounded-xl text-xs font-medium transition-colors border",
                  filter === f
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                )}>
                {f === "all" ? "Todos" : f === "created" ? "Creadas" : f === "completed" ? "Completadas" : f === "updated" ? "Editadas" : f === "assigned" ? "Asignadas" : "Archivadas"}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Activity size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-slate-400">Sin actividad registrada</p>
          </div>
        ) : (
          Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{date}</p>
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                <span className="text-xs text-gray-400 dark:text-slate-500">{items.length} eventos</span>
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
                      className="flex items-start gap-3 p-4 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/40 transition-colors group"
                    >
                      <Avatar name={entry.performedByName} photoURL={entry.performedByPhoto} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-slate-200">
                          <span className="font-semibold">{entry.performedByName}</span>
                          {" "}
                          <span className={cn("font-medium", meta.color)}>{meta.label}</span>
                          {" la tarea "}
                          <span className="font-medium text-gray-900 dark:text-slate-100">"{entry.taskTitle}"</span>
                          {entry.details && <span className="text-gray-500 dark:text-slate-400"> {entry.details}</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", meta.bg, meta.color)}>
                            <Icon size={10} />
                            {meta.label.charAt(0).toUpperCase() + meta.label.slice(1)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-slate-500">{entry.listName}</span>
                          <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            {format(parseISO(entry.performedAt), "HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", meta.bg)}>
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
