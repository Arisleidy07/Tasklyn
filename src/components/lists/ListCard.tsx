"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TaskList } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Users,
  CheckCircle2,
  ArrowUpRight,
  Lock,
  Share2,
  Clock,
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

  const completedCount = listTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const totalCount = listTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const pendingCount = totalCount - completedCount;

  const isOwner = list.owner === user?.id;

  return (
    <Link
      href={`/lists/${list.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-2xl"
    >
      <motion.div
        whileHover={{
          y: -4,
          boxShadow:
            list.type === "shared"
              ? "0 20px 48px -12px rgba(59,130,246,0.3), 0 0 0 1px rgba(59,130,246,0.12)"
              : "0 20px 48px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 25 }}
        className="relative p-5 rounded-2xl border border-gray-200/80 bg-white hover:border-blue-200 transition-all duration-300 overflow-hidden"
      >
        {/* Top accent bar */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-[3px] transition-opacity duration-300",
            list.type === "shared"
              ? "bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-500"
              : "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 opacity-0 group-hover:opacity-100",
          )}
        />

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-indigo-50/0 group-hover:from-blue-50/25 group-hover:to-indigo-50/15 transition-all duration-500 pointer-events-none rounded-2xl" />

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
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock size={9} />
              {formatDate(list.createdAt)}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 shadow-sm",
              list.type === "shared"
                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                : "bg-gradient-to-br from-gray-100 to-gray-200",
            )}
          >
            {list.type === "shared" ? (
              <Share2 size={15} className="text-white" />
            ) : (
              <Lock size={15} className="text-gray-500" />
            )}
          </div>
        </div>

        {/* Task stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-none tabular-nums">
              {pendingCount}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">pendientes</span>
          </div>
          <div className="w-px h-7 bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-blue-600 leading-none tabular-nums">
              {completedCount}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              completadas
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              {completedCount}/{totalCount} tareas
            </span>
            <span className="text-[11px] font-semibold text-gray-600 tabular-nums">
              {totalCount > 0 ? Math.round(progress) : 0}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.15,
              }}
              className={cn(
                "h-full rounded-full",
                list.type === "shared"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                  : "bg-gradient-to-r from-gray-400 to-gray-500",
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-100/80">
          <div className="flex items-center gap-1.5">
            <Users size={11} className="text-gray-400" />
            <span className="text-[11px] text-gray-400">
              {list.members.length} miembro
              {list.members.length !== 1 ? "s" : ""}
            </span>
          </div>
          {isOwner ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border border-blue-100">
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
