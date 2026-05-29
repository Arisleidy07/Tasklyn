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
  Phone,
  MapPin,
  FileText,
} from "lucide-react";
import {
  cn,
  timeAgo,
  formatActivityDateTime,
  linkifyPhoneNumbers,
  linkifyLocation,
} from "@/lib/utils";

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
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      whileHover={{ y: -1, boxShadow: "0 4px 16px -4px rgba(0,0,0,0.07)" }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group rounded-xl border transition-colors overflow-hidden",
        isCompleted
          ? "border-blue-200 bg-blue-50/30"
          : "border-gray-200 bg-white hover:border-blue-200",
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
              : "Sin permiso para completar tareas"
          }
        >
          {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-2">
              {/* Tarea */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5">
                  Tarea:
                </span>
                <p
                  className={cn(
                    "text-sm font-medium transition-colors flex-1",
                    isCompleted
                      ? "text-gray-400 line-through"
                      : "text-gray-900",
                  )}
                  dangerouslySetInnerHTML={{
                    __html: linkifyPhoneNumbers(task.title),
                  }}
                />
              </div>

              {/* Teléfonos */}
              {task.phoneNumbers && task.phoneNumbers.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                    <Phone size={10} />
                    Teléfonos:
                  </span>
                  <span
                    className="text-sm text-gray-600 flex-1"
                    dangerouslySetInnerHTML={{
                      __html: task.phoneNumbers
                        .map((phone) => linkifyPhoneNumbers(phone))
                        .join(' <span class="text-gray-300">•</span> '),
                    }}
                  />
                </div>
              )}

              {/* Ubicación */}
              {task.location && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} />
                    Ubicación:
                  </span>
                  <span
                    className="text-sm text-gray-600 flex-1"
                    dangerouslySetInnerHTML={{
                      __html: linkifyLocation(task.location),
                    }}
                  />
                </div>
              )}

              {/* Descripción */}
              {task.description && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                    <FileText size={10} />
                    Descripción:
                  </span>
                  <p
                    className="text-sm text-gray-600 flex-1"
                    dangerouslySetInnerHTML={{
                      __html: linkifyPhoneNumbers(task.description),
                    }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center active:scale-90"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center active:scale-90"
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
                Completado por {getUserName(task.completedBy)} •{" "}
                {formatActivityDateTime(task.completedAt || task.createdAt)}
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
                      · {formatActivityDateTime(entry.performedAt)}
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
