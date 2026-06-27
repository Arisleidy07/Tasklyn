"use client";

import React, { useState, useMemo } from "react";
import { Task, MemberRole } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canCompleteTask } from "@/lib/permissions";
import { motion } from "framer-motion";
import TaskCompletionModal from "./TaskCompletionModal";
import TaskDetailPanel from "./TaskDetailPanel";
import { CheckCircle2, Circle, GripVertical, CalendarDays } from "lucide-react";
import type { DragHandleProps } from "./SortableTaskContainer";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  role: MemberRole | null;
  memberNames: Record<string, string>;
  listMembers?: Array<{ userId: string; role: string }>;
  dragHandleProps?: DragHandleProps;
  isDragging?: boolean;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatTaskDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays === -1) return "Ayer";
  if (diffDays > 1 && diffDays < 7) return WEEKDAYS[target.getDay()];
  const day = target.getDate();
  const month = MONTHS[target.getMonth()];
  const year = target.getFullYear();
  const currentYear = today.getFullYear();
  return year === currentYear ? `${day} ${month}` : `${day} ${month} ${year}`;
}

function isDueUrgent(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return target.getTime() <= today.getTime();
}

function TaskItem({
  task,
  role,
  memberNames,
  listMembers,
  dragHandleProps,
  isDragging,
}: TaskItemProps) {
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const { user } = useAuthStore();
  const { uncompleteTask } = useTaskStore();

  const isCompleted = task.status === "completed";
  const canComplete = canCompleteTask(role);

  const dueText = useMemo(() => formatTaskDate(task.dueDate), [task.dueDate]);
  const dueUrgent = useMemo(() => isDueUrgent(task.dueDate), [task.dueDate]);
  const hasNote = !!task.description?.trim();
  const hasRecurrence = !!task.recurrence;

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
      <div
        ref={dragHandleProps?.setNodeRef as React.Ref<HTMLDivElement>}
        {...(dragHandleProps?.attributes as Record<
          string,
          unknown
        > as React.HTMLAttributes<HTMLDivElement>)}
        className="group/task select-none"
      >
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragging ? 0.45 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className={cn(
            "relative flex items-center min-h-[48px] px-4 border-b transition-colors duration-150",
            isDragging && "z-10",
          )}
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.backgroundColor = "var(--bg-card)";
            }
          }}
        >
          {/* Drag handle — subtle, only on hover/desktop */}
          {dragHandleProps && (
            <div
              {...(dragHandleProps.listeners as Record<
                string,
                unknown
              > as React.HTMLAttributes<HTMLDivElement>)}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 bottom-0 hidden sm:flex items-center justify-center w-6 opacity-0 group-hover/task:opacity-100 transition-opacity cursor-grab"
              style={{
                touchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
              }}
              aria-label="Mantén presionado para mover"
            >
              <GripVertical
                size={14}
                style={{ color: "var(--text-tertiary)" }}
              />
            </div>
          )}

          {/* Main row — opens detail panel on empty space */}
          <div
            className="flex-1 flex items-center gap-3 py-2 min-w-0"
            onClick={(e) => {
              if (
                (e.target as HTMLElement).closest(
                  "button,a,input,textarea,select",
                )
              )
                return;
              setShowDetailPanel(true);
            }}
            style={{ cursor: "pointer" }}
          >
            {/* Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete(e);
              }}
              disabled={!canComplete}
              className={cn(
                "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-transform duration-150",
                canComplete
                  ? "cursor-pointer active:scale-90"
                  : "cursor-not-allowed opacity-40",
                isCompleted ? "text-blue-500" : "text-[var(--text-muted)]",
              )}
            >
              {isCompleted ? (
                <CheckCircle2 size={24} strokeWidth={1.8} />
              ) : (
                <Circle size={24} strokeWidth={1.8} />
              )}
            </button>

            {/* Title + compact metadata */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p
                className={cn(
                  "text-[var(--text-base)] font-medium leading-snug line-clamp-2",
                  isCompleted && "line-through opacity-70",
                )}
                style={{
                  color: isCompleted
                    ? "var(--text-secondary)"
                    : "var(--text-primary)",
                }}
              >
                {task.title}
              </p>

              {(dueText || hasNote || hasRecurrence) && (
                <div
                  className={cn(
                    "flex items-center gap-2 mt-0.5 text-[var(--text-xs)] line-clamp-1",
                    isCompleted && "opacity-60",
                  )}
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {dueText && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        dueUrgent && !isCompleted && "text-[var(--text-error)]",
                      )}
                    >
                      <CalendarDays size={11} strokeWidth={1.8} />
                      <span>{dueText}</span>
                    </span>
                  )}
                  {hasRecurrence && !isCompleted && <span>↻</span>}
                  {hasNote && <span>📝</span>}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

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

export default React.memo(TaskItem, (prev, next) => {
  return (
    prev.task.id === next.task.id &&
    prev.task.status === next.task.status &&
    prev.task.title === next.task.title &&
    prev.task.priority === next.task.priority &&
    prev.task.dueDate === next.task.dueDate &&
    prev.task.assignedTo === next.task.assignedTo &&
    prev.task.location === next.task.location &&
    prev.task.phoneNumbers?.join(",") === next.task.phoneNumbers?.join(",") &&
    prev.task.tags?.join(",") === next.task.tags?.join(",") &&
    prev.task.description === next.task.description &&
    prev.task.completedBy === next.task.completedBy &&
    prev.task.performedBy === next.task.performedBy &&
    prev.role === next.role &&
    prev.isDragging === next.isDragging &&
    prev.memberNames[prev.task.assignedTo || ""] ===
      next.memberNames[next.task.assignedTo || ""] &&
    prev.memberNames[prev.task.completedBy || ""] ===
      next.memberNames[next.task.completedBy || ""]
  );
});
