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
        className="list-card-premium relative p-5 rounded-2xl transition-shadow duration-300"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <h3
                className="text-[15px] font-semibold truncate transition-colors leading-snug"
                style={{ color: "var(--text-primary)" }}
              >
                {list.name}
              </h3>
              <ArrowUpRight
                size={13}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <p
              className="text-[11px] flex items-center gap-1.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Clock size={9} />
              <span>{formatDate(list.createdAt)}</span>
            </p>
          </div>
          {/* Type indicator with better icon */}
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0",
              list.type === "shared"
                ? "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600"
                : "",
            )}
            style={
              list.type !== "shared"
                ? {
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-tertiary)",
                  }
                : {}
            }
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={
                urgentTasks > 0
                  ? {
                      backgroundColor: "rgba(245,158,11,0.1)",
                      color: "#d97706",
                    }
                  : {
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }
              }
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
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{
                backgroundColor: "rgba(37,99,235,0.08)",
                color: "#2563eb",
              }}
            >
              <CheckCircle2 size={12} />
              <span className="text-sm font-semibold leading-none tabular-nums">
                {completedCount}
              </span>
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex flex-col items-end gap-1">
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {activeTasks.length > 0 ? Math.round(progress) : 0}%
            </span>
            <div
              className="h-2 w-24 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
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
        <div
          className="flex items-center justify-between mt-4 pt-3.5 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Users size={12} className="opacity-70" />
              <span>{list.members.length}</span>
            </div>
            {archivedCount > 0 && (
              <span
                className="text-[10px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                • {archivedCount} arch.
              </span>
            )}
            {urgentTasks > 0 && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  color: "#d97706",
                  backgroundColor: "rgba(245,158,11,0.1)",
                }}
              >
                {urgentTasks} urgente{urgentTasks !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {isOwner ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
              Owner
            </span>
          ) : (
            <span
              className="text-[10px] font-medium px-2 py-1 rounded-full"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-secondary)",
              }}
            >
              Miembro
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
