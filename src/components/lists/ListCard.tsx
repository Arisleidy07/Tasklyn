"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TaskList } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Users,
  ArrowUpRight,
  Lock,
  Clock,
  Layout,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface ListCardProps {
  list: TaskList;
}

export default function ListCard({ list }: ListCardProps) {
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();

  const listTasks = useMemo(() => {
    return tasks.filter((t) => t.listId === list.id);
  }, [tasks, list.id]);

  const activeTasks = useMemo(
    () => listTasks.filter((t) => t.status !== "archived"),
    [listTasks],
  );
  const archivedCount = listTasks.length - activeTasks.length;
  const completedCount = activeTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const pendingCount = activeTasks.filter((t) => t.status === "pending").length;
  const progress =
    activeTasks.length > 0 ? (completedCount / activeTasks.length) * 100 : 0;

  const isOwner = list.owner === user?.id;

  // Check for urgent/high priority pending tasks
  const urgentTasks = activeTasks.filter(
    (t) => t.priority === "high" && t.status === "pending",
  ).length;

  return (
    <Link
      href={`/lists/${list.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl"
    >
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        className={cn(
          "list-card-premium relative p-5 rounded-2xl",
          "bg-white border border-gray-200/80",
          "dark:bg-slate-800 dark:border-slate-700/80",
          "hover:border-blue-300/80 dark:hover:border-blue-500/40",
          "hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10",
          "transition-shadow duration-300",
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                {list.name}
              </h3>
              <ArrowUpRight
                size={13}
                className="text-gray-300 dark:text-slate-600 group-hover:text-blue-400 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
              <Clock size={9} />
              <span>{formatDate(list.createdAt)}</span>
            </p>
          </div>
          {/* Type indicator with better icon */}
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0",
              list.type === "shared"
                ? "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-400"
                : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 dark:from-slate-700 dark:to-slate-600 dark:text-slate-400",
            )}
          >
            {list.type === "shared" ? (
              <Users size={15} />
            ) : (
              <Layout size={15} />
            )}
          </div>
        </div>

        {/* Stats + progress */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Pending badge */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                urgentTasks > 0
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                  : "bg-gray-50 text-gray-700 dark:bg-slate-700/60 dark:text-slate-300",
              )}
            >
              {urgentTasks > 0 ? (
                <AlertCircle size={12} />
              ) : (
                <Clock size={12} />
              )}
              <span className="text-sm font-semibold leading-none tabular-nums">
                {pendingCount}
              </span>
            </div>
            {/* Completed badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
              <CheckCircle2 size={12} />
              <span className="text-sm font-semibold leading-none tabular-nums">
                {completedCount}
              </span>
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] font-bold text-gray-800 dark:text-slate-200 tabular-nums">
              {activeTasks.length > 0 ? Math.round(progress) : 0}%
            </span>
            <div className="h-2 w-24 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.15,
                }}
                className={cn(
                  "h-full rounded-full",
                  progress >= 80
                    ? "bg-gradient-to-r from-emerald-500 to-green-500"
                    : progress >= 50
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                      : "bg-gradient-to-r from-amber-500 to-orange-500",
                )}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-100 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400">
              <Users size={12} className="opacity-70" />
              <span>{list.members.length}</span>
            </div>
            {archivedCount > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                • {archivedCount} arch.
              </span>
            )}
            {urgentTasks > 0 && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">
                {urgentTasks} urgente{urgentTasks !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {isOwner ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
              Owner
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              Miembro
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
