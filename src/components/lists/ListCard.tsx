"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TaskList } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { Users, ArrowUpRight, Lock, Share2, Clock } from "lucide-react";
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
        whileHover={{
          y: -3,
          boxShadow:
            list.type === "shared"
              ? "0 16px 40px -16px rgba(37,99,235,0.35)"
              : "0 14px 30px -18px rgba(15,23,42,0.25)",
        }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        className="relative p-5 rounded-2xl border border-gray-200/80 bg-white/95 hover:border-blue-200/90 transition-all duration-300 overflow-hidden"
      >
        {/* Sutil acento lateral */}
        <div
          className={cn(
            "absolute inset-y-3 left-0 w-[3px] rounded-r-xl",
            list.type === "shared"
              ? "bg-gradient-to-b from-blue-500 via-indigo-500 to-blue-400"
              : "bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200",
          )}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-[15px] font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors leading-snug">
                {list.name}
              </h3>
              <ArrowUpRight
                size={13}
                className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"
              />
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <Clock size={9} />
              <span>{formatDate(list.createdAt)}</span>
            </p>
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 shadow-sm border",
              list.type === "shared"
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500/60"
                : "bg-gradient-to-br from-gray-50 to-gray-200 border-gray-200/80",
            )}
          >
            {list.type === "shared" ? (
              <Share2 size={15} className="text-white" />
            ) : (
              <Lock size={15} className="text-gray-500" />
            )}
          </div>
        </div>

        {/* Stats + progress */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col min-w-[54px]">
              <span className="text-lg font-semibold text-gray-900 leading-none tabular-nums">
                {pendingCount}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">
                pendientes
              </span>
            </div>
            <div className="w-px h-7 bg-gray-100" />
            <div className="flex flex-col min-w-[54px]">
              <span className="text-lg font-semibold text-blue-600 leading-none tabular-nums">
                {completedCount}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">
                completadas
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] font-semibold text-gray-700 tabular-nums">
              {activeTasks.length > 0 ? Math.round(progress) : 0}%
            </span>
            <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
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
                    : "bg-gradient-to-r from-gray-400 to-gray-600",
                )}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Users size={11} className="text-gray-400" />
            <span>
              {list.members.length} miembro
              {list.members.length !== 1 ? "s" : ""}
            </span>
            {archivedCount > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <span>
                  {archivedCount} archivada
                  {archivedCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
          {isOwner ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              Owner
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
              Miembro
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
