"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TaskList } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { Users, ArrowUpRight, Lock, Clock } from "lucide-react";
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
          "list-card-premium relative p-5",
          "bg-white border border-gray-200/80",
          "dark:bg-slate-800 dark:border-slate-700/80",
          "hover:border-blue-200/90 dark:hover:border-blue-500/30",
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
          {/* Type indicator - subtle icon only */}
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
              list.type === "shared"
                ? "bg-blue-50 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400"
                : "bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-500",
            )}
          >
            <Lock size={14} />
          </div>
        </div>

        {/* Stats + progress */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col min-w-[54px]">
              <span className="text-lg font-semibold text-gray-900 dark:text-slate-100 leading-none tabular-nums">
                {pendingCount}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                pendientes
              </span>
            </div>
            <div className="w-px h-7 bg-gray-100 dark:bg-slate-700" />
            <div className="flex flex-col min-w-[54px]">
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400 leading-none tabular-nums">
                {completedCount}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                completadas
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 tabular-nums">
              {activeTasks.length > 0 ? Math.round(progress) : 0}%
            </span>
            <div className="h-1.5 w-20 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1,
                }}
                className={cn(
                  "h-full rounded-full",
                  list.type === "shared"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                    : "bg-gradient-to-r from-gray-400 to-gray-600 dark:from-slate-500 dark:to-slate-400",
                )}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-slate-500">
            <Users size={11} />
            <span>
              {list.members.length} miembro
              {list.members.length !== 1 ? "s" : ""}
            </span>
            {archivedCount > 0 && (
              <>
                <span className="text-gray-300 dark:text-slate-600">•</span>
                <span>
                  {archivedCount} archivada
                  {archivedCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
          {isOwner ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
              Owner
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
              Miembro
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
