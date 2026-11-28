"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Task, MemberRole } from "@/types";
import TaskCardAttachments from "@/components/attachments/TaskCardAttachments";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canCompleteTask, canEditTask } from "@/lib/permissions";
import { showToast } from "@/stores/toastStore";
import { getPriorityConfig } from "@/lib/priority";
import { motion } from "framer-motion";
import TaskCompletionModal from "./TaskCompletionModal";
import TaskDetailPanel from "./TaskDetailPanel";
import { resolveTaskLocation } from "@/lib/location";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import TaskCardMetaChip from "./TaskCardMetaChip";
import {
  CheckCircle2,
  Circle,
  GripVertical,
  MapPin,
  Phone,
  CalendarDays,
  Bell,
  User,
  Pencil,
  Check,
  X,
  Square,
  CheckSquare,
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
  justDraggedRef?: React.RefObject<boolean>;
  /** Multi-select mode ("Seleccionar"): the card toggles selection. */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

const TITLE_MAX = 250;

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

function TaskItem({
  task,
  role,
  memberNames,
  listMembers,
  dragHandleProps,
  isDragging,
  justDraggedRef,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: TaskItemProps) {
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const skipClickRef = useRef(false);

  const { user } = useAuthStore();
  const { uncompleteTask, updateTask } = useTaskStore();

  const isCompleted = task.status === "completed";
  const canComplete = canCompleteTask(role);
  const canEditTitle = canEditTask(role) && !selectionMode;

  // ---- Quick title edit (inline, no modal) ----
  const startEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftTitle(task.title);
    setEditingTitle(true);
  };
  const cancelEditTitle = () => {
    setEditingTitle(false);
    setDraftTitle("");
  };
  const saveTitle = async () => {
    if (!user || savingTitle) return;
    const next = draftTitle.replace(/\s+/g, " ").trim().slice(0, TITLE_MAX);
    if (!next) {
      showToast({ variant: "error", message: "El título no puede estar vacío" });
      titleInputRef.current?.focus();
      return;
    }
    if (next === task.title) {
      cancelEditTitle();
      return;
    }
    setSavingTitle(true);
    try {
      // Optimistic in the store; reverted automatically if Firestore fails
      await updateTask(task.id, { title: next }, user.id, user.name);
      setEditingTitle(false);
    } catch (error) {
      console.error("[TaskItem] title update failed:", error);
      const code = (error as { code?: string })?.code;
      showToast({
        variant: "error",
        message:
          code === "permission-denied"
            ? "No tienes permiso para editar esta tarea"
            : "No se pudo guardar el título. Inténtalo nuevamente.",
      });
    } finally {
      setSavingTitle(false);
    }
  };
  useEffect(() => {
    if (editingTitle) {
      const el = titleInputRef.current;
      el?.focus();
      el?.select();
    }
  }, [editingTitle]);
  // Leaving selection mode / losing permission closes the editor
  useEffect(() => {
    if (!canEditTitle && editingTitle) setEditingTitle(false);
  }, [canEditTitle, editingTitle]);

  const dueText = useMemo(() => formatTaskDate(task.dueDate), [task.dueDate]);
  const dueUrgent = useMemo(() => isDueUrgent(task.dueDate), [task.dueDate]);
  const hasDescription = !!task.description?.trim();
  const firstPhone = task.phoneNumbers?.find((p) => p.trim()) || null;
  const taskLocation = resolveTaskLocation(task);
  const reminderText = useMemo(() => {
    const r = task.reminders?.[0];
    return r ? formatReminder(r.at) : null;
  }, [task.reminders]);

  // Suppress the click event that sometimes fires after a drag ends.
  useEffect(() => {
    if (isDragging) {
      skipClickRef.current = true;
    } else {
      const t = setTimeout(() => {
        skipClickRef.current = false;
      }, 80);
      return () => clearTimeout(t);
    }
  }, [isDragging]);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !canComplete) return;
    if (isCompleted) {
      uncompleteTask(task.id, user.id);
    } else {
      setShowCompletionModal(true);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      onToggleSelect?.(task.id);
      return;
    }
    if (editingTitle) return;
    if (skipClickRef.current) return;
    if (justDraggedRef?.current) return;
    if ((e.target as HTMLElement).closest("button,a,input,textarea,select"))
      return;
    setShowDetailPanel(true);
  };

  // Resolve real profile names for assignee/completer — memberNames can
  // contain the literal "..." placeholder while profiles are still loading.
  const { getProfile } = useUserProfiles(
    [task.completedBy, task.assignedTo].filter((v): v is string => !!v),
  );
  const cleanName = (n?: string | null): string | null =>
    n && n !== "..." && n !== "Cargando..." ? n : null;
  const resolveDisplayName = (uid?: string | null): string | null => {
    if (!uid) return null;
    return (
      cleanName(memberNames[uid]) ??
      cleanName(getProfile(uid).name) ??
      (uid === user?.id ? cleanName(user?.name) : null)
    );
  };
  const assigneeName = resolveDisplayName(task.assignedTo || null);

  const hasMeta =
    firstPhone ||
    taskLocation ||
    reminderText ||
    dueText ||
    isCompleted ||
    assigneeName;

  // Format completion info
  const completionInfo = (() => {
    if (!isCompleted || !task.completedAt) return null;
    const completedByName =
      resolveDisplayName(task.completedBy || null) || "Usuario";
    const completedDate = new Date(task.completedAt);
    const dateStr = completedDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    const timeStr = completedDate.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return {
      name: completedByName,
      date: dateStr,
      time: timeStr,
    };
  })();

  return (
    <>
      {/* Whole-card drag handle: setNodeRef + listeners + attributes */}
      <div
        ref={dragHandleProps?.setNodeRef as React.Ref<HTMLDivElement>}
        {...(selectionMode || editingTitle ? {} : dragHandleProps?.attributes)}
        {...(selectionMode || editingTitle ? {} : dragHandleProps?.listeners)}
        className="group/task select-none mb-1.5 sm:mb-2 w-full max-w-full"
        data-task-id={task.id}
      >
        <motion.div
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: isDragging ? 0.45 : 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "glass-card relative flex flex-col gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-[var(--radius-card)] cursor-pointer select-none w-full max-w-full overflow-hidden",
            isDragging && "z-10 shadow-2xl",
          )}
          style={
            selectionMode && selected
              ? { boxShadow: "0 0 0 2px var(--text-link)" }
              : undefined
          }
          aria-selected={selectionMode ? selected : undefined}
          onClick={handleCardClick}
        >
          {/* Drag handle indicator (desktop only, visual cue) */}
          {dragHandleProps && !selectionMode && (
            <div
              className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center w-5 h-8 opacity-0 group-hover/task:opacity-100 transition-opacity cursor-grab"
              aria-label="Mantén presionado para mover"
            >
              <GripVertical
                size={14}
                style={{ color: "var(--text-tertiary)" }}
              />
            </div>
          )}

          {/* Title row */}
          <div className="flex items-start gap-2 sm:pl-5">
            {selectionMode ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(task.id);
                }}
                className="flex-shrink-0 flex items-center justify-center w-6 h-6 mt-0.5"
                style={{ color: selected ? "var(--text-link)" : "var(--text-tertiary)" }}
                role="checkbox"
                aria-checked={selected}
                aria-label={selected ? "Quitar de la selección" : "Seleccionar tarea"}
              >
                {selected ? (
                  <CheckSquare size={22} strokeWidth={1.8} />
                ) : (
                  <Square size={22} strokeWidth={1.8} />
                )}
              </button>
            ) : (
              <button
                onClick={handleToggleComplete}
                disabled={!canComplete}
                className={cn(
                  "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-transform duration-200 mt-0.5",
                  canComplete
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-40",
                  isCompleted
                    ? "text-[var(--text-info)]"
                    : "text-[var(--text-tertiary)]",
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
            )}
            <span
              className={cn(
                "flex-shrink-0 w-2.5 h-2.5 rounded-full mt-[7px]",
                getPriorityConfig(task.priority).dot,
                isCompleted && "opacity-50",
              )}
              title={getPriorityConfig(task.priority).label}
              aria-label={`Prioridad: ${getPriorityConfig(task.priority).label}`}
            />
            {editingTitle ? (
              <div
                className="flex-1 min-w-0 flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <input
                  ref={titleInputRef}
                  value={draftTitle}
                  maxLength={TITLE_MAX}
                  disabled={savingTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveTitle();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelEditTitle();
                    }
                  }}
                  aria-label="Título de la tarea"
                  className="flex-1 min-w-0 h-8 px-2 rounded-lg text-[var(--text-base)] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 select-text"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => void saveTitle()}
                  disabled={savingTitle}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-60"
                  style={{ backgroundColor: "var(--text-link)" }}
                  aria-label="Guardar título"
                  title="Guardar (Enter)"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={cancelEditTitle}
                  disabled={savingTitle}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                  aria-label="Cancelar edición"
                  title="Cancelar (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <p
                  className={cn(
                    "flex-1 min-w-0 text-[var(--text-base)] sm:text-[var(--text-lg)] font-semibold leading-snug line-clamp-2 break-words",
                    isCompleted && "line-through opacity-70",
                  )}
                  style={{ color: "var(--text-primary)" }}
                >
                  {task.title}
                </p>
                {canEditTitle && (
                  <button
                    type="button"
                    onClick={startEditTitle}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex-shrink-0 w-7 h-7 -mr-0.5 rounded-md flex items-center justify-center transition-opacity opacity-60 sm:opacity-0 sm:group-hover/task:opacity-100 focus:opacity-100 hover:bg-[var(--bg-hover)]"
                    style={{ color: "var(--text-tertiary)" }}
                    aria-label="Editar título"
                    title="Editar título"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Description */}
          {hasDescription && (
            <p
              className={cn(
                "text-[var(--text-base)] leading-relaxed sm:pl-7 line-clamp-2 break-words",
                isCompleted && "opacity-70",
              )}
              style={{ color: "var(--text-secondary)" }}
            >
              {task.description}
            </p>
          )}

          {/* Metadata chips: Teléfono · Ubicación · Recordatorio · Fecha · Completada */}
          {hasMeta && (
            <div className="flex flex-wrap items-center gap-1.5 sm:pl-7 w-full min-w-0">
              {assigneeName && (
                <TaskCardMetaChip
                  icon={<User size={12} />}
                  text={`Asignado a: ${assigneeName}`}
                  color="var(--text-link)"
                />
              )}
              {firstPhone && (
                <TaskCardMetaChip
                  icon={<Phone size={12} />}
                  text={firstPhone}
                  href={`tel:${firstPhone.replace(/\s/g, "")}`}
                  color="var(--text-success)"
                />
              )}
              {taskLocation && (
                <TaskCardMetaChip
                  icon={<MapPin size={12} />}
                  text={taskLocation.address || "Ver en Google Maps"}
                  href={taskLocation.url}
                  color="var(--text-info)"
                />
              )}
              {reminderText && (
                <TaskCardMetaChip
                  icon={<Bell size={12} />}
                  text={reminderText}
                  color="var(--text-warning)"
                />
              )}
              {dueText && (
                <TaskCardMetaChip
                  icon={<CalendarDays size={12} />}
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
              {completionInfo && (
                <TaskCardMetaChip
                  icon={<CheckCircle2 size={12} />}
                  text={`Completada por ${completionInfo.name} · ${completionInfo.date} ${completionInfo.time}`}
                  color="var(--text-info)"
                />
              )}
            </div>
          )}

          {/* Attachment thumbnails (always visible, max 3 + "+N") */}
          <TaskCardAttachments task={task} />
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
    prev.task.showPreviewInCard === next.task.showPreviewInCard &&
    prev.task.attachmentCount === next.task.attachmentCount &&
    prev.task.attachmentPreviews === next.task.attachmentPreviews &&
    prev.task.description === next.task.description &&
    prev.task.location === next.task.location &&
    prev.task.locationUrl === next.task.locationUrl &&
    prev.task.phoneNumbers === next.task.phoneNumbers &&
    prev.task.completedBy === next.task.completedBy &&
    prev.task.reminders === next.task.reminders &&
    prev.memberNames === next.memberNames &&
    prev.role === next.role &&
    prev.selectionMode === next.selectionMode &&
    prev.selected === next.selected &&
    prev.onToggleSelect === next.onToggleSelect
  );
});
