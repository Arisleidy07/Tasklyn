"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { useTeamStore } from "@/stores/teamStore";
import { useListStore } from "@/stores/listStore";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Edit3,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  ChevronDown,
  Activity,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  formatDistanceToNow,
} from "date-fns";
import { es } from "date-fns/locale";

interface HistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  performedByPhoto?: string;
  performedAt: string;
  taskTitle: string;
  taskId: string;
  listName: string;
  listId: string;
  details?: string;
  completedBy?: string | null;
  completedByName?: string;
  assignedTo?: string;
  assignedToName?: string;
}

interface HistoryCardProps {
  entry: HistoryEntry;
  isCurrentUser: boolean;
}

function HistoryCard({ entry, isCurrentUser }: HistoryCardProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <FileText size={16} className="text-blue-500" />;
      case "updated":
        return <Edit3 size={16} className="text-yellow-500" />;
      case "completed":
        return <CheckCircle2 size={16} className="text-green-500" />;
      case "archived":
        return <Archive size={16} className="text-gray-500" />;
      case "deleted":
        return <Trash2 size={16} className="text-red-500" />;
      case "assigned":
        return <Users size={16} className="text-purple-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "created":
        return "creó";
      case "updated":
        return "actualizó";
      case "completed":
        return "completó";
      case "archived":
        return "archivó";
      case "deleted":
        return "eliminó";
      case "assigned":
        return "asignó";
      default:
        return "modificó";
    }
  };

  const getActionStyle = (action: string): React.CSSProperties => {
    switch (action) {
      case "created":
        return {
          backgroundColor: "rgba(37,99,235,0.07)",
          color: "#2563eb",
          border: "1px solid rgba(37,99,235,0.2)",
        };
      case "updated":
        return {
          backgroundColor: "rgba(202,138,4,0.07)",
          color: "#ca8a04",
          border: "1px solid rgba(202,138,4,0.2)",
        };
      case "completed":
        return {
          backgroundColor: "rgba(22,163,74,0.07)",
          color: "#16a34a",
          border: "1px solid rgba(22,163,74,0.2)",
        };
      case "archived":
        return {
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-color)",
        };
      case "deleted":
        return {
          backgroundColor: "rgba(239,68,68,0.07)",
          color: "#dc2626",
          border: "1px solid rgba(239,68,68,0.2)",
        };
      case "assigned":
        return {
          backgroundColor: "rgba(147,51,234,0.07)",
          color: "#9333ea",
          border: "1px solid rgba(147,51,234,0.2)",
        };
      default:
        return {
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-color)",
        };
    }
  };

  const performedAt = parseISO(entry.performedAt);
  const timeAgo = formatDistanceToNow(performedAt, {
    addSuffix: true,
    locale: es,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-4 p-4 rounded-xl border transition-all duration-200"
      style={
        isCurrentUser
          ? {
              backgroundColor: "rgba(37,99,235,0.04)",
              borderColor: "rgba(37,99,235,0.2)",
            }
          : {
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
            }
      }
    >
      {/* Action Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={getActionStyle(entry.action)}
      >
        {getActionIcon(entry.action)}
      </div>

      {/* User Avatar */}
      <Avatar
        name={entry.performedByName}
        photoURL={entry.performedByPhoto}
        size="sm"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              <span className="font-medium">{entry.performedByName}</span>{" "}
              <span style={{ color: "var(--text-secondary)" }}>
                {getActionText(entry.action)}
              </span>{" "}
              <span
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                "{entry.taskTitle}"
              </span>
            </p>

            {/* Additional details */}
            {entry.assignedToName && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                asignado a{" "}
                <span className="font-medium">{entry.assignedToName}</span>
              </p>
            )}

            {entry.completedByName &&
              entry.completedByName !== entry.performedByName && (
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  realizado por{" "}
                  <span className="font-medium">{entry.completedByName}</span>
                </p>
              )}

            {entry.details && (
              <p
                className="text-sm mt-1 italic"
                style={{ color: "var(--text-tertiary)" }}
              >
                {entry.details}
              </p>
            )}

            <div
              className="flex items-center gap-3 mt-2 text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              <span className="flex items-center gap-1">
                <FileText size={12} />
                {entry.listName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {timeAgo}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface HistoryGroupProps {
  date: string;
  entries: HistoryEntry[];
  currentUserId: string;
}

function HistoryGroup({ date, entries, currentUserId }: HistoryGroupProps) {
  const isTodayGroup = isToday(parseISO(date));
  const isYesterdayGroup = isYesterday(parseISO(date));

  const getGroupTitle = () => {
    if (isTodayGroup) return "Hoy";
    if (isYesterdayGroup) return "Ayer";
    return format(parseISO(date), "d 'de' MMMM", { locale: es });
  };

  return (
    <div className="space-y-3">
      <div
        className="sticky top-0 z-10 backdrop-blur-sm py-2"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--bg-page) 95%, transparent)",
        }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          {getGroupTitle()}
        </h3>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <HistoryCard
            key={`${entry.id}-${index}`}
            entry={entry}
            isCurrentUser={entry.performedBy === currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();
  const { currentTeam } = useTeamStore();
  const { getUserLists } = useListStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  // Collect all foreign UIDs for batch profile resolution (before early return)
  const allUids = useMemo(() => {
    if (!user) return [];
    const uids = new Set<string>();
    tasks.forEach((task) => {
      if (task.createdBy) uids.add(task.createdBy);
      if (task.completedBy) uids.add(task.completedBy);
      if ((task as any).performedBy) uids.add((task as any).performedBy);
      if (task.assignedTo) uids.add(task.assignedTo);
      task.history?.forEach((h) => {
        if (h.performedBy) uids.add(h.performedBy);
        if (h.completedBy) uids.add(h.completedBy);
        if (h.assignedTo) uids.add(h.assignedTo);
      });
    });
    uids.delete(user.id);
    return [...uids];
  }, [tasks, user]);

  const { profiles } = useUserProfiles(allUids);

  const historyData = useMemo<HistoryEntry[]>(() => {
    if (!user) return [];
    const allLists = getUserLists(user.id);
    const listNameMap = new Map(allLists.map((l) => [l.id, l.name]));
    const getListName = (listId: string) => listNameMap.get(listId) || "Lista";
    const resolveName = (uid: string | undefined) => {
      if (!uid) return undefined;
      if (uid === user.id) return user.name;
      return profiles.get(uid)?.name ?? "Cargando...";
    };
    const resolvePhoto = (uid: string | undefined) => {
      if (!uid) return undefined;
      if (uid === user.id) return user.photoURL;
      return profiles.get(uid)?.photoURL;
    };

    const history: HistoryEntry[] = [];

    tasks.forEach((task) => {
      history.push({
        id: `${task.id}-created`,
        action: "created",
        performedBy: task.createdBy,
        performedByName: resolveName(task.createdBy) ?? "Cargando...",
        performedByPhoto: resolvePhoto(task.createdBy),
        performedAt: task.createdAt,
        taskTitle: task.title,
        taskId: task.id,
        listName: getListName(task.listId),
        listId: task.listId,
        details: "Tarea creada",
      });

      if (task.completedAt && task.completedBy) {
        history.push({
          id: `${task.id}-completed`,
          action: "completed",
          performedBy: task.completedBy,
          performedByName: resolveName(task.completedBy) ?? "Cargando...",
          performedByPhoto: resolvePhoto(task.completedBy),
          performedAt: task.completedAt,
          taskTitle: task.title,
          taskId: task.id,
          listName: getListName(task.listId),
          listId: task.listId,
          details: "Tarea marcada como completada",
          completedBy: (task as any).performedBy,
          completedByName: resolveName((task as any).performedBy),
        });
      }

      if (task.assignedTo) {
        history.push({
          id: `${task.id}-assigned`,
          action: "assigned",
          performedBy: task.createdBy,
          performedByName: resolveName(task.createdBy) ?? "Cargando...",
          performedByPhoto: resolvePhoto(task.createdBy),
          performedAt: task.createdAt,
          taskTitle: task.title,
          taskId: task.id,
          listName: getListName(task.listId),
          listId: task.listId,
          details: "Tarea asignada",
          assignedTo: task.assignedTo,
          assignedToName: resolveName(task.assignedTo),
        });
      }

      task.history?.forEach((historyEntry) => {
        history.push({
          id: `${task.id}-history-${historyEntry.id}`,
          action: historyEntry.action,
          performedBy: historyEntry.performedBy,
          performedByName:
            resolveName(historyEntry.performedBy) ?? "Cargando...",
          performedByPhoto: resolvePhoto(historyEntry.performedBy),
          performedAt: historyEntry.performedAt,
          taskTitle: task.title,
          taskId: task.id,
          listName: getListName(task.listId),
          listId: task.listId,
          details: historyEntry.details,
          completedBy: historyEntry.completedBy,
          completedByName: resolveName(historyEntry.completedBy),
          assignedTo: historyEntry.assignedTo,
          assignedToName: resolveName(historyEntry.assignedTo),
        });
      });
    });

    history.sort(
      (a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
    );
    return history;
  }, [tasks, profiles, user, getUserLists]);

  // Filter history data
  const filteredHistory = historyData.filter((entry) => {
    const matchesSearch =
      entry.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.performedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.listName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      selectedAction === "all" || entry.action === selectedAction;
    const matchesUser =
      selectedUser === "all" || entry.performedBy === selectedUser;

    return matchesSearch && matchesAction && matchesUser;
  });

  // Group by date
  const groupedHistory = filteredHistory.reduce(
    (groups, entry) => {
      const date = entry.performedAt.split("T")[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    },
    {} as Record<string, HistoryEntry[]>,
  );

  if (!user) return null;

  return (
    <>
      <Header
        title="Historial Empresarial"
        description={
          currentTeam
            ? `Actividad del equipo ${currentTeam.name}`
            : "Todas las actividades y cambios en tus tareas"
        }
        showMenuButton={true}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Filter size={14} />
            </Button>
          </div>
        }
      />

      <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar en el historial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                border: "1px solid var(--border-input)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-xl"
              style={{
                border: "1px solid var(--border-input)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            >
              <option value="all">Todas las acciones</option>
              <option value="created">Creadas</option>
              <option value="updated">Actualizadas</option>
              <option value="completed">Completadas</option>
              <option value="assigned">Asignadas</option>
              <option value="archived">Archivadas</option>
              <option value="deleted">Eliminadas</option>
            </select>

            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-xl"
              style={{
                border: "1px solid var(--border-input)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            >
              <option value="all">Todos los usuarios</option>
              <option value={user.id}>{user.name} (Yo)</option>
            </select>
          </div>
        </div>

        {/* History Content */}
        {Object.keys(groupedHistory).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <History size={32} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Sin historial
            </h3>
            <p
              className="max-w-sm mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              {searchQuery || selectedAction !== "all" || selectedUser !== "all"
                ? "No se encontraron actividades con los filtros seleccionados."
                : "No hay actividades registradas aún."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, entries]) => (
              <HistoryGroup
                key={date}
                date={date}
                entries={entries}
                currentUserId={user.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
