"use client";

import React, { useMemo, useState } from "react";
import { Task, MemberRole, RecurrenceConfig } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canCompleteTask } from "@/lib/permissions";
import { motion } from "framer-motion";
import TaskCompletionModal from "./TaskCompletionModal";
import TaskDetailPanel from "./TaskDetailPanel";
import TaskCardMetaChip from "./TaskCardMetaChip";
import {
  CheckCircle2,
  Circle,
  GripVertical,
  MapPin,
  Phone,
  CalendarDays,
  Bell,
  Repeat,
} from "lucide-react";
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

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Diaria",
  weekdays: "Días laborales",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
  custom: "Personalizada",
};

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

function formatTaskTime(timeStr?: string | null): string | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":");
  if (!h || !m) return timeStr;
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function formatReminder(at?: string): string | null {
  if (!at) return null;
  const d = new Date(at);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const dayLabel =
    diffDays === 0
      ? "Hoy"
      : diffDays === 1
        ? "Mañana"
        : d.toLocaleDateString("es-ES", { weekday: "short" });
  const time = d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${dayLabel} ${time}`;
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

function getRecurrenceLabel(rec?: RecurrenceConfig | null): string {
  if (!rec) return "";
  return RECURRENCE_LABELS[rec.type] || rec.type;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  const hasDescription = !!task.description?.trim();
  const assignedName = task.assignedTo ? memberNames[task.assignedTo] : null;
  const firstPhone = task.phoneNumbers?.find((p) => p.trim()) || null;
  const reminderText = useMemo(() => {
    const r = task.reminders?.[0];
    return r ? formatReminder(r.at) : null;
  }, [task.reminders]);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !canComplete) return;
    if (isCompleted) {
      uncompleteTask(task.id, user.id);
    } else {
      setShowCompletionModal(true);
    }
  };

  const openDetail = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button,a,input,textarea,select"))
      return;
    setShowDetailPanel(true);
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
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: isDragging ? 0.45 : 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "glass-card relative flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-3.5 rounded-[var(--radius-card)] cursor-pointer",
            isDragging && "z-10",
          )}
          onClick={openDetail}
        >
          {/* Drag handle — subtle, only on hover/desktop */}
          {dragHandleProps && (
            <div
              {...(dragHandleProps.listeners as Record<
                string,
                unknown
              > as React.HTMLAttributes<HTMLDivElement>)}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-1 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-5 h-8 opacity-0 group-hover/task:opacity-100 transition-opacity cursor-grab"
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

          {/* First line: checkbox + title */}
          <div className="flex items-start gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete(e);
              }}
              disabled={!canComplete}
              className={cn(
                "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-transform duration-200",
                canComplete
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-40",
                isCompleted ? "text-blue-500" : "text-[var(--text-muted)]",
              )}
              aria-label={
                isCompleted ? "Marcar como pendiente" : "Completar tarea"
              }
            >
              {isCompleted ? (
                <CheckCircle2 size={24} strokeWidth={1.8} />
              ) : (
                <Circle size={24} strokeWidth={1.8} />
              )}
            </button>
            <p
              className={cn(
                "flex-1 min-w-0 text-[var(--text-lg)] font-bold leading-tight line-clamp-2",
                isCompleted && "line-through opacity-75",
              )}
              style={{ color: "var(--text-primary)" }}
            >
              {task.title}
            </p>
          </div>

          {/* Second line: description */}
          {hasDescription && (
            <p
              className={cn(
                "text-[var(--text-base)] leading-snug line-clamp-2",
                isCompleted && "opacity-70",
              )}
              style={{ color: "var(--text-secondary)" }}
            >
              {task.description}
            </p>
          )}

          {/* Third line: metadata chips */}
          {(task.location ||
            firstPhone ||
            dueText ||
            reminderText ||
            task.recurrence ||
            assignedName) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {task.location && (
                <TaskCardMetaChip
                  icon={<MapPin size={11} />}
                  text={task.location}
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    task.location,
                  )}`}
                  color="#3b82f6"
                  className="max-w-[160px] sm:max-w-[220px]"
                />
              )}
              {firstPhone && (
                <TaskCardMetaChip
                  icon={<Phone size={11} />}
                  text={firstPhone}
                  href={`tel:${firstPhone.replace(/\s/g, "")}`}
                  color="#16a34a"
                />
              )}
              {dueText && (
                <TaskCardMetaChip
                  icon={<CalendarDays size={11} />}
                  text={
                    task.dueTime
                      ? `${dueText} · ${formatTaskTime(task.dueTime)}`
                      : dueText
                  }
                  color={
                    dueUrgent && !isCompleted
                      ? "var(--text-error)"
                      : "var(--text-tertiary)"
                  }
                />
              )}
              {task.recurrence && (
                <TaskCardMetaChip
                  icon={<Repeat size={11} />}
                  text={getRecurrenceLabel(task.recurrence)}
                  color="var(--text-tertiary)"
                />
              )}
              {reminderText && (
                <TaskCardMetaChip
                  icon={<Bell size={11} />}
                  text={reminderText}
                  color="var(--text-warning)"
                />
              )}
              {assignedName && (
                <span
                  className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border text-[var(--text-xs)] font-medium"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span
                    className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                    style={{
                      backgroundColor: "var(--text-link)",
                      color: "#ffffff",
                    }}
                  >
                    {getInitials(assignedName)}
                  </span>
                  {assignedName}
                </span>
              )}
            </div>
          )}
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
    prev.task.dueTime === next.task.dueTime &&
    prev.task.assignedTo === next.task.assignedTo &&
    prev.task.location === next.task.location &&
    prev.task.phoneNumbers?.join(",") === next.task.phoneNumbers?.join(",") &&
    prev.task.tags?.join(",") === next.task.tags?.join(",") &&
    prev.task.description === next.task.description &&
    prev.task.recurrence?.type === next.task.recurrence?.type &&
    prev.task.reminders?.length === next.task.reminders?.length &&
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
