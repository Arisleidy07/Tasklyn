"use client";

import React, { useState } from "react";
import { Task, MemberRole } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canCompleteTask, canDeleteTask, canEditTask } from "@/lib/permissions";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  role: MemberRole | null;
  memberNames: Record<string, string>;
}

export default function TaskItem({ task, role, memberNames }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuthStore();
  const { completeTask, uncompleteTask, deleteTask } = useTaskStore();

  const isCompleted = task.status === "completed";
  const canComplete = canCompleteTask(role);
  const canEdit = canEditTask(role);
  const canDelete = canDeleteTask(role);

  const getUserName = (userId: string) =>
    memberNames[userId] || "Usuario desconocido";

  const handleToggleComplete = () => {
    if (!user || !canComplete) return;
    if (isCompleted) {
      uncompleteTask(task.id, user.id);
    } else {
      completeTask(task.id, user.id);
    }
  };

  const handleDelete = () => {
    if (!canDelete) return;
    deleteTask(task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "group rounded-xl border transition-all duration-200 overflow-hidden",
        isCompleted
          ? "border-blue-200 bg-blue-50/30"
          : "border-gray-200 bg-white hover:border-gray-300",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={!canComplete}
          className={cn(
            "mt-0.5 flex-shrink-0 transition-colors cursor-pointer",
            canComplete
              ? "hover:text-blue-600"
              : "cursor-not-allowed opacity-50",
            isCompleted ? "text-blue-600" : "text-gray-300",
          )}
          title={
            canComplete
              ? isCompleted
                ? "Reabrir tarea"
                : "Completar tarea"
              : "Solo el propietario puede completar tareas"
          }
        >
          {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium transition-colors",
                  isCompleted ? "text-gray-400 line-through" : "text-gray-900",
                )}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-3 mt-3">
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock size={10} />
              {timeAgo(task.createdAt)}
            </span>
            {task.assignedTo && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <User size={10} />
                {getUserName(task.assignedTo)}
              </span>
            )}
            {isCompleted && task.completedBy && (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                <CheckCircle2 size={8} />
                Completado por {getUserName(task.completedBy)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: History */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-100"
        >
          <div className="p-4 pt-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-3">
              <History size={12} />
              Actividad
            </p>
            <div className="space-y-2">
              {task.history.slice(-5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-2 text-[11px] text-gray-500"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">
                    <span className="font-medium text-gray-700">
                      {getUserName(entry.performedBy)}
                    </span>{" "}
                    {entry.details || entry.action}
                    <span className="text-gray-400 ml-1">
                      · {timeAgo(entry.performedAt)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
