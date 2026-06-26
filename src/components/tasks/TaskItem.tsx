"use client";

import React, { useState, useMemo } from "react";
import { Task, MemberRole } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canCompleteTask, canManageTaskOptions } from "@/lib/permissions";
import { motion } from "framer-motion";
import TaskCompletionModal from "./TaskCompletionModal";
import TaskDetailPanel from "./TaskDetailPanel";
import TaskOptionsBar from "./TaskOptionsBar";
import {
  CheckCircle2,
  Circle,
  CalendarDays,
  User,
  MapPin,
  Phone,
  GripVertical,
  UserCheck,
  UserCog,
  FileText,
  Tag,
} from "lucide-react";
import type { DragHandleProps } from "./SortableTaskContainer";
import { cn } from "@/lib/utils";
import { getPriorityConfig } from "@/lib/priority";

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
  const { uncompleteTask, updateTask } = useTaskStore();

  const isCompleted = task.status === "completed";
  const canComplete = canCompleteTask(role);
  const canManageOptions = canManageTaskOptions(role);

  const pc = task.priority ? getPriorityConfig(task.priority) : null;
  const dueText = useMemo(() => formatTaskDate(task.dueDate), [task.dueDate]);
  const assignedName = task.assignedTo ? memberNames[task.assignedTo] : null;
  const hasSecondary =
    pc ||
    dueText ||
    assignedName ||
    task.tags?.length ||
    task.location ||
    task.phoneNumbers?.some((p) => p.trim());

  const completedByName = task.completedBy
    ? memberNames[task.completedBy] || "Usuario"
    : null;
  const performedByName = task.performedBy
    ? memberNames[task.performedBy] || "Usuario"
    : null;
  const showCompletionInfo = isCompleted && completedByName;
  const firstPhone = task.phoneNumbers?.find((p) => p.trim());

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !canComplete) return;
    if (isCompleted) {
      uncompleteTask(task.id, user.id);
    } else {
      setShowCompletionModal(true);
    }
  };

  const saveField = async (updates: Partial<Task>) => {
    if (!user) return;
    await updateTask(task.id, updates, user.id, user.name);
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
            "relative flex items-stretch min-h-[44px] transition-colors duration-150",
            isDragging && "z-10",
          )}
          style={{
            backgroundColor: isDragging ? "var(--bg-secondary)" : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          {/* Drag handle */}
          {dragHandleProps && (
            <div
              {...(dragHandleProps.listeners as Record<
                string,
                unknown
              > as React.HTMLAttributes<HTMLDivElement>)}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 flex items-center justify-center sm:opacity-0 sm:group-hover/task:opacity-100 transition-opacity"
              style={{
                touchAction: "none",
                cursor: "grab",
                width: "28px",
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

          {/* Main row — only empty space opens detail */}
          <div
            className="flex-1 flex items-center gap-3 py-2 pr-3 min-w-0"
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

            {/* Title + metadata */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p
                className={cn(
                  "text-[var(--text-base)] font-medium leading-snug",
                  isCompleted && "line-through opacity-70",
                )}
                style={{
                  color: isCompleted
                    ? "var(--text-secondary)"
                    : "var(--text-primary)",
                  wordBreak: "break-word",
                }}
              >
                {task.title}
              </p>

              <div
                className={cn(
                  "flex items-center gap-2 mt-0.5 line-clamp-1",
                  isCompleted && "opacity-60",
                )}
              >
                {task.description && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-xs)] max-w-[160px] sm:max-w-[220px]">
                    <FileText
                      size={11}
                      strokeWidth={1.8}
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <span
                      className="truncate"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {task.description}
                    </span>
                  </span>
                )}

                {dueText && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-xs)]">
                    <CalendarDays
                      size={11}
                      strokeWidth={1.8}
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {dueText}
                    </span>
                  </span>
                )}

                {assignedName && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-xs)]">
                    <User
                      size={11}
                      strokeWidth={1.8}
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {assignedName}
                    </span>
                  </span>
                )}

                {task.location && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(task.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[var(--text-xs)] hover:underline"
                  >
                    <MapPin
                      size={11}
                      strokeWidth={1.8}
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <span
                      className="truncate max-w-[100px] sm:max-w-[140px]"
                      style={{ color: "var(--text-link)" }}
                    >
                      {task.location}
                    </span>
                  </a>
                )}

                {firstPhone && (
                  <a
                    href={`tel:${firstPhone.replace(/\s/g, "")}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[var(--text-xs)] hover:underline"
                  >
                    <Phone
                      size={11}
                      strokeWidth={1.8}
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <span style={{ color: "var(--text-success)" }}>
                      {firstPhone}
                    </span>
                  </a>
                )}

                {task.tags && task.tags.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-xs)]">
                    <Tag
                      size={11}
                      strokeWidth={1.8}
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {task.tags[0]}
                      {task.tags.length > 1 && ` +${task.tags.length - 1}`}
                    </span>
                  </span>
                )}

                {pc && !isCompleted && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[var(--text-xs)] font-medium",
                      pc.text,
                    )}
                  >
                    <span>{pc.emoji}</span>
                    <span>{pc.label}</span>
                  </span>
                )}

                {isCompleted && showCompletionInfo && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-xs)]">
                    <UserCheck
                      size={11}
                      strokeWidth={1.8}
                      style={{ color: "#16a34a" }}
                    />
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {completedByName}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Task options */}
            {!isCompleted && canManageOptions && (
              <div
                className="hidden sm:flex items-center self-center"
                onClick={(e) => e.stopPropagation()}
              >
                <TaskOptionsBar
                  dueDate={task.dueDate}
                  dueTime={task.dueTime}
                  reminders={task.reminders || []}
                  recurrence={task.recurrence}
                  onReminderChange={(r) => saveField({ reminders: r })}
                  onDueDateChange={(d) =>
                    saveField({
                      dueDate: d,
                      dueTime: d ? task.dueTime || null : null,
                    })
                  }
                  onRecurrenceChange={(r) => saveField({ recurrence: r })}
                />
              </div>
            )}
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
