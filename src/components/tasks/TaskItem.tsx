"use client";

import React, { useState } from "react";
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
  Bell,
  Repeat,
  MapPin,
  Phone,
  FileText,
  User,
  Tag,
  GripVertical,
} from "lucide-react";
import type { DragHandleProps } from "./SortableTaskContainer";
import { cn } from "@/lib/utils";
import { getPriorityConfig } from "@/lib/priority";
import { linkifyLocation, linkifyPhoneNumbers } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  role: MemberRole | null;
  memberNames: Record<string, string>;
  listMembers?: Array<{ userId: string; role: string }>;
  dragHandleProps?: DragHandleProps;
  isDragging?: boolean;
}

export default function TaskItem({
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

  const hasDescription = !!task.description?.trim();
  const hasLocation = !!task.location?.trim();
  const hasPhones = !!task.phoneNumbers?.filter((p) => p.trim()).length;

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
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="group/task select-none"
        style={{
          borderRadius: "14px",
          backgroundColor: isCompleted
            ? "var(--bg-secondary)"
            : "var(--bg-card)",
          boxShadow: isCompleted ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: "6px",
          border: "1px solid var(--border-color)",
          opacity: isDragging ? 0.4 : 1,
        }}
      >
        {/* ── Main clickable row ── */}
        <div
          className="flex items-start gap-2 px-2 pt-3 pb-2 cursor-pointer"
          onClick={() => setShowDetailPanel(true)}
        >
          {/* Drag handle — left of checkbox, in-flow, never overlapping */}
          {dragHandleProps && (
            <div
              ref={dragHandleProps.ref}
              {...(dragHandleProps.attributes as React.HTMLAttributes<HTMLDivElement>)}
              {...(dragHandleProps.listeners as React.HTMLAttributes<HTMLDivElement>)}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "flex-shrink-0 flex items-center justify-center rounded select-none",
                "cursor-grab active:cursor-grabbing",
                /* Mobile: larger hit area, always slightly visible so user knows it's draggable */
                "w-7 h-7 sm:w-5 sm:h-5",
                "opacity-40 sm:opacity-0 sm:group-hover/task:opacity-60",
                "transition-opacity duration-150",
              )}
              style={{
                color: "var(--text-tertiary)",
                touchAction: "none",
                marginTop: "1px",
              }}
              title="Mantener presionado para mover"
            >
              <GripVertical size={16} />
            </div>
          )}

          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete(e);
            }}
            disabled={!canComplete}
            className={cn(
              "flex-shrink-0 mt-0.5 transition-all",
              canComplete
                ? "cursor-pointer hover:scale-110 active:scale-95"
                : "cursor-not-allowed opacity-40",
              isCompleted ? "text-blue-500" : "text-gray-300",
            )}
          >
            {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>

          {/* Title + meta */}
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

            {/* Badges */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
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
              {/* Mobile-only: show icons for hidden content */}
              <span className="sm:hidden inline-flex items-center gap-1.5">
                {hasDescription && (
                  <FileText
                    size={10}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                )}
                {hasLocation && (
                  <MapPin size={10} style={{ color: "var(--text-tertiary)" }} />
                )}
                {hasPhones && (
                  <Phone size={10} style={{ color: "var(--text-tertiary)" }} />
                )}
              </span>
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

            {/* Desktop-only: expanded description/location/phones */}
            {!isCompleted && (hasDescription || hasLocation || hasPhones) && (
              <div className="hidden sm:flex flex-col gap-1.5 mt-2 pr-2">
                {hasDescription && (
                  <p
                    className="text-[12px] leading-relaxed line-clamp-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {task.description}
                  </p>
                )}
                {hasLocation && (
                  <span
                    className="text-[12px] flex items-center gap-1"
                    style={{ color: "var(--text-tertiary)" }}
                    dangerouslySetInnerHTML={{
                      __html: `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--text-tertiary)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${linkifyLocation(task.location!)}</span>`,
                    }}
                  />
                )}
                {hasPhones &&
                  task
                    .phoneNumbers!.filter((p) => p.trim())
                    .map((p, i) => (
                      <span
                        key={i}
                        className="text-[12px]"
                        style={{ color: "var(--text-tertiary)" }}
                        dangerouslySetInnerHTML={{
                          __html: `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--text-tertiary)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.55a16 16 0 0 0 6.06 6.06l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${linkifyPhoneNumbers(p)}</span>`,
                        }}
                      />
                    ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop-only TaskOptionsBar — reminder/due/recurrence directly on card */}
        {!isCompleted && canManageOptions && (
          <div
            className="hidden sm:block px-12 pb-3"
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
