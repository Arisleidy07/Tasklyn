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
  User,
  Tag,
  GripVertical,
  UserCheck,
  UserCog,
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

  // Resolve completion names
  const completedByName = task.completedBy
    ? memberNames[task.completedBy] || "Usuario"
    : null;
  const performedByName = task.performedBy
    ? memberNames[task.performedBy] || "Usuario"
    : null;
  const showCompletionInfo = isCompleted && completedByName;

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
        {...(dragHandleProps?.listeners as Record<
          string,
          unknown
        > as React.HTMLAttributes<HTMLDivElement>)}
        className="group/task select-none"
        style={{
          marginBottom: "4px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{
            opacity: isDragging ? 0.35 : 1,
            scale: isDragging ? 1.0 : 1,
            y: 0,
          }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            borderRadius: "12px",
            backgroundColor: isCompleted
              ? "var(--bg-secondary)"
              : "var(--bg-card)",
            boxShadow: isCompleted ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
            border: "1px solid var(--border-color)",
          }}
        >
          {/* ── Main clickable row ── */}
          <div
            className="flex items-start gap-2 px-3 pt-2.5 pb-2"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("button,a")) return;
              setShowDetailPanel(true);
            }}
            style={{ cursor: "pointer" }}
          >
            {/* Grip — visual hint only; drag activates via long-press on entire card */}
            {dragHandleProps && (
              <div
                className="flex-shrink-0 mt-1 flex items-center justify-center pointer-events-none"
                style={{ padding: "4px 2px" }}
                aria-hidden="true"
              >
                <GripVertical
                  size={14}
                  className="opacity-20 sm:opacity-0 sm:group-hover/task:opacity-30 transition-opacity duration-150"
                  style={{ color: "var(--text-tertiary)" }}
                />
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
                style={{
                  color: "var(--text-primary)",
                  wordBreak: "break-word",
                }}
              >
                {task.title}
              </p>

              {/* Badges row: priority + assigned + tags */}
              {(pc ||
                (task.assignedTo && memberNames[task.assignedTo]) ||
                (task.tags && task.tags.length > 0)) && (
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
              )}

              {/* Expanded info: description / location / phones — visible on ALL screens */}
              {(hasDescription || hasLocation || hasPhones) && (
                <div className="flex flex-col gap-1.5 mt-2 pr-1">
                  {hasDescription && (
                    <p
                      className="text-[12px] leading-relaxed line-clamp-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {task.description}
                    </p>
                  )}
                  {hasLocation && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(task.location!)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                        style={{ color: "#3b82f6" }}
                      >
                        {task.location}
                      </a>
                    </span>
                  )}
                  {hasPhones &&
                    task
                      .phoneNumbers!.filter((p) => p.trim())
                      .map((p, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 text-[11px]"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.55a16 16 0 0 0 6.06 6.06l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <a
                            href={`tel:${p.replace(/\s/g, "")}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                            style={{ color: "#16a34a" }}
                          >
                            {p}
                          </a>
                        </span>
                      ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Completion info — visible only when completed ── */}
          {showCompletionInfo && (
            <div
              className="px-3 pb-3 pt-1"
              style={{ paddingLeft: dragHandleProps ? "2.75rem" : "2.5rem" }}
            >
              <div
                className="flex flex-col gap-1.5 px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: "rgba(22,163,74,0.06)",
                  border: "1px solid rgba(22,163,74,0.15)",
                }}
              >
                <div className="flex items-center gap-1.5 text-[11px]">
                  <UserCheck size={12} style={{ color: "#16a34a" }} />
                  <span style={{ color: "var(--text-tertiary)" }}>
                    Completada por:{" "}
                  </span>
                  <span
                    className="font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {completedByName}
                  </span>
                </div>
                {performedByName && performedByName !== completedByName && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <UserCog size={12} style={{ color: "#8b5cf6" }} />
                    <span style={{ color: "var(--text-tertiary)" }}>
                      Realizada por:{" "}
                    </span>
                    <span
                      className="font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {performedByName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TaskOptionsBar — reminder/due/recurrence — visible on all screens when not completed */}
          {!isCompleted && canManageOptions && (
            <div
              className="px-3 pb-3"
              style={{ paddingLeft: dragHandleProps ? "2.75rem" : "2.5rem" }}
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
