"use client";

import React, { useState } from "react";
import { Task, MemberRole } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import {
  canCompleteTask,
  canDeleteTask,
  canEditTask,
  canArchiveTask,
  canManageTaskOptions,
} from "@/lib/permissions";
import { motion } from "framer-motion";
import TaskCompletionModal from "./TaskCompletionModal";
import TaskDetailPanel from "./TaskDetailPanel";
import {
  CheckCircle2,
  Circle,
  CalendarDays,
  Bell,
  Repeat,
  MapPin,
  Phone,
  FileText,
  ChevronRight,
  User,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPriorityConfig } from "@/lib/priority";

interface TaskItemProps {
  task: Task;
  role: MemberRole | null;
  memberNames: Record<string, string>;
  listMembers?: Array<{ userId: string; role: string }>;
}

export default function TaskItem({
  task,
  role,
  memberNames,
  listMembers,
}: TaskItemProps) {
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const { user } = useAuthStore();
  const { uncompleteTask } = useTaskStore();

  const isCompleted = task.status === "completed";
  const canComplete = canCompleteTask(role);
  const canEdit = canEditTask(role);
  const canDelete = canDeleteTask(role);
  const canArchive = canArchiveTask(role);
  const canManageOptions = canManageTaskOptions(role);

  const pc = task.priority ? getPriorityConfig(task.priority) : null;

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !canComplete) return;
    if (isCompleted) {
      uncompleteTask(task.id, user.id);
    } else {
      setShowCompletionModal(true);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setShowDetailPanel(true)}
        className="group cursor-pointer select-none"
        style={{
          borderRadius: "14px",
          backgroundColor: isCompleted ? "var(--bg-secondary)" : "var(--bg-card)",
          boxShadow: isCompleted
            ? "none"
            : "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)",
          marginBottom: "6px",
          padding: "11px 14px",
          border: "1px solid var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3 min-h-[36px]">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            disabled={!canComplete}
            className={cn(
              "flex-shrink-0 transition-all",
              canComplete
                ? "cursor-pointer hover:scale-110 active:scale-95"
                : "cursor-not-allowed opacity-40",
              isCompleted ? "text-blue-500" : "text-gray-300",
            )}
          >
            {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>

          {/* Title + indicators */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-[14px] font-medium leading-snug",
                isCompleted && "line-through opacity-50",
              )}
              style={{ color: "var(--text-primary)", wordBreak: "break-word" }}
            >
              {task.title}
            </p>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {pc && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                    pc.bg,
                    pc.bgDark,
                    pc.text,
                    pc.textDark,
                    pc.border,
                    pc.borderDark,
                  )}
                >
                  <span className="text-[8px]">{pc.emoji}</span>
                  {pc.label}
                </span>
              )}

              {task.dueDate && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <CalendarDays size={10} />
                  {new Date(task.dueDate).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}

              {task.reminders && task.reminders.length > 0 && (
                <Bell size={10} style={{ color: "var(--text-tertiary)" }} />
              )}

              {task.recurrence && (
                <Repeat size={10} style={{ color: "#059669" }} />
              )}

              {task.description && (
                <FileText size={10} style={{ color: "var(--text-tertiary)" }} />
              )}

              {task.location && (
                <MapPin size={10} style={{ color: "var(--text-tertiary)" }} />
              )}

              {task.phoneNumbers &&
                task.phoneNumbers.filter((p) => p.trim()).length > 0 && (
                  <Phone
                    size={10}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                )}

              {task.assignedTo && memberNames[task.assignedTo] && (
                <span
                  className="inline-flex items-center gap-1 text-[10px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <User size={10} />
                  {memberNames[task.assignedTo]}
                </span>
              )}

              {task.tags && task.tags.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-[10px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Tag size={10} />
                  {task.tags[0]}
                  {task.tags.length > 1 && ` +${task.tags.length - 1}`}
                </span>
              )}
            </div>
          </div>

          {/* Chevron arrow */}
          <ChevronRight
            size={14}
            className="flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity duration-150"
            style={{ color: "var(--text-tertiary)" }}
          />
        </div>
      </motion.div>

      <TaskDetailPanel
        task={task}
        isOpen={showDetailPanel}
        onClose={() => setShowDetailPanel(false)}
        role={role}
        memberNames={memberNames}
        listMembers={listMembers}
      />

      <TaskCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        taskId={task.id}
        taskTitle={task.title}
        onConfirm={() => setShowCompletionModal(false)}
        listMembers={listMembers}
      />
    </>
  );
}
