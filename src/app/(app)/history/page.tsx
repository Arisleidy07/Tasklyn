"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { useTeamStore } from "@/stores/teamStore";
import { useListStore } from "@/stores/listStore";
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

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
      case "updated":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800";
      case "completed":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800";
      case "archived":
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800";
      case "deleted":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
      case "assigned":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800";
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
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
        isCurrentUser
          ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
          : "bg-white border-gray-200 dark:bg-slate-900 dark:border-slate-800",
      )}
    >
      {/* Action Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border",
          getActionColor(entry.action),
        )}
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
            <p className="text-sm text-gray-900 dark:text-slate-100">
              <span className="font-medium">{entry.performedByName}</span>{" "}
              <span className="text-gray-600 dark:text-slate-400">
                {getActionText(entry.action)}
              </span>{" "}
              <span className="font-medium text-gray-900 dark:text-slate-100">
                "{entry.taskTitle}"
              </span>
            </p>

            {/* Additional details */}
            {entry.assignedToName && (
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                asignado a{" "}
                <span className="font-medium">{entry.assignedToName}</span>
              </p>
            )}

            {entry.completedByName &&
              entry.completedByName !== entry.performedByName && (
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  realizado por{" "}
                  <span className="font-medium">{entry.completedByName}</span>
                </p>
              )}

            {entry.details && (
              <p className="text-sm text-gray-500 dark:text-slate-500 mt-1 italic">
                {entry.details}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-slate-400">
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
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm py-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
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
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  useEffect(() => {
    const generateHistoryData = () => {
      if (!user) return;

      const allLists = getUserLists(user.id);
      const listNameMap = new Map(allLists.map((l) => [l.id, l.name]));
      const getListName = (listId: string) =>
        listNameMap.get(listId) || `Lista ${listId.slice(0, 6)}`;

      const history: HistoryEntry[] = [];

      tasks.forEach((task) => {
        // Created entry
        history.push({
          id: `${task.id}-created`,
          action: "created",
          performedBy: task.createdBy,
          performedByName:
            task.createdBy === user.id
              ? user.name
              : `Usuario ${task.createdBy.slice(0, 6)}`,
          performedByPhoto:
            task.createdBy === user.id ? user.photoURL : undefined,
          performedAt: task.createdAt,
          taskTitle: task.title,
          taskId: task.id,
          listName: getListName(task.listId),
          listId: task.listId,
          details: "Tarea creada",
        });

        // Completed entry
        if (task.completedAt && task.completedBy) {
          history.push({
            id: `${task.id}-completed`,
            action: "completed",
            performedBy: task.completedBy,
            performedByName:
              task.completedBy === user.id
                ? user.name
                : `Usuario ${task.completedBy.slice(0, 6)}`,
            performedByPhoto:
              task.completedBy === user.id ? user.photoURL : undefined,
            performedAt: task.completedAt,
            taskTitle: task.title,
            taskId: task.id,
            listName: getListName(task.listId),
            listId: task.listId,
            details: "Tarea marcada como completada",
            completedBy: task.performedBy,
            completedByName:
              task.performedBy === user.id
                ? user.name
                : `Usuario ${task.performedBy?.slice(0, 6)}`,
          });
        }

        // Assigned entry
        if (task.assignedTo) {
          history.push({
            id: `${task.id}-assigned`,
            action: "assigned",
            performedBy: task.createdBy,
            performedByName:
              task.createdBy === user.id
                ? user.name
                : `Usuario ${task.createdBy.slice(0, 6)}`,
            performedByPhoto:
              task.createdBy === user.id ? user.photoURL : undefined,
            performedAt: task.createdAt,
            taskTitle: task.title,
            taskId: task.id,
            listName: getListName(task.listId),
            listId: task.listId,
            details: "Tarea asignada",
            assignedTo: task.assignedTo,
            assignedToName:
              task.assignedTo === user.id
                ? user.name
                : `Usuario ${task.assignedTo.slice(0, 6)}`,
          });
        }

        // History entries from task history
        if (task.history && task.history.length > 0) {
          task.history.forEach((historyEntry) => {
            history.push({
              id: `${task.id}-history-${historyEntry.id}`,
              action: historyEntry.action,
              performedBy: historyEntry.performedBy,
              performedByName:
                historyEntry.performedBy === user.id
                  ? user.name
                  : `Usuario ${historyEntry.performedBy.slice(0, 6)}`,
              performedByPhoto:
                historyEntry.performedBy === user.id
                  ? user.photoURL
                  : undefined,
              performedAt: historyEntry.performedAt,
              taskTitle: task.title,
              taskId: task.id,
              listName: getListName(task.listId),
              listId: task.listId,
              details: historyEntry.details,
              completedBy: historyEntry.completedBy,
              completedByName:
                historyEntry.completedBy === user.id
                  ? user.name
                  : `Usuario ${historyEntry.completedBy?.slice(0, 6)}`,
              assignedTo: historyEntry.assignedTo,
              assignedToName:
                historyEntry.assignedTo === user.id
                  ? user.name
                  : `Usuario ${historyEntry.assignedTo?.slice(0, 6)}`,
            });
          });
        }
      });

      // Sort by date (newest first)
      history.sort(
        (a, b) =>
          new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
      );

      setHistoryData(history);
      setLoading(false);
    };

    generateHistoryData();
  }, [user, tasks]);

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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
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
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="all">Todos los usuarios</option>
              <option value={user.id}>{user.name} (Yo)</option>
            </select>
          </div>
        </div>

        {/* History Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <History
                size={32}
                className="text-gray-400 dark:text-slate-500"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              Sin historial
            </h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
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
