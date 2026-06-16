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
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import TaskOptionsBar from "./TaskOptionsBar";
import TaskComments from "./TaskComments";
import TaskCompletionModal from "./TaskCompletionModal";
import { notifyMentionsFromText } from "@/lib/notify";
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
  Edit2,
  Archive,
  Plus,
  X,
  AlertTriangle,
  Bell,
  CalendarDays,
  Repeat,
  Tag,
} from "lucide-react";
import {
  cn,
  timeAgo,
  formatActivityDateTime,
  linkifyPhoneNumbers,
  linkifyLocation,
} from "@/lib/utils";
import { toISODate } from "@/lib/dateUtils";
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
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhones, setEditPhones] = useState<string[]>([""]);
  const [editDueDate, setEditDueDate] = useState<string | null>(null);
  const [editDueTime, setEditDueTime] = useState<string | null>(null);
  const [editReminders, setEditReminders] = useState<
    { id: string; at: string; sent: boolean }[]
  >([]);
  const [editRecurrence, setEditRecurrence] =
    useState<Task["recurrence"]>(null);
  const [editPriority, setEditPriority] = useState<Task["priority"]>(undefined);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const { user } = useAuthStore();
  const { completeTask, uncompleteTask, deleteTask, updateTask, archiveTask } =
    useTaskStore();

  const isCompleted = task.status === "completed";
  const canComplete = canCompleteTask(role);
  const canEdit = canEditTask(role);
  const canDelete = canDeleteTask(role);
  const canArchive = canArchiveTask(role);
  const canManageOptions = canManageTaskOptions(role);

  const getUserName = (userId: string) => memberNames[userId] || "Cargando...";

  const handleToggleComplete = () => {
    if (!user || !canComplete) return;
    if (isCompleted) {
      uncompleteTask(task.id, user.id);
    } else {
      setShowCompletionModal(true);
    }
  };

  const handleCompletionConfirm = async (performedBy: string | null) => {
    // TaskCompletionModal already handles the completion logic
    // Just close the modal
    setShowCompletionModal(false);
  };

  const handleOpenEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditLocation(task.location || "");
    setEditPhones(task.phoneNumbers?.length ? [...task.phoneNumbers] : [""]);
    setEditDueDate(task.dueDate || null);
    setEditDueTime(task.dueTime || null);
    setEditReminders(task.reminders || []);
    setEditRecurrence(task.recurrence || null);
    setEditPriority(task.priority);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !user) return;
    setIsSavingEdit(true);
    try {
      const validPhones = editPhones.filter((p) => p.trim());
      await updateTask(
        task.id,
        {
          title: editTitle.trim(),
          description: editDescription.trim(),
          location: editLocation.trim() || undefined,
          phoneNumbers: validPhones.length > 0 ? validPhones : undefined,
          dueDate: editDueDate,
          dueTime: editDueTime,
          reminders: editReminders.length > 0 ? editReminders : undefined,
          recurrence: editRecurrence,
          priority: editPriority,
        },
        user.id,
        user.name,
      );

      // Check for @mentions and notify
      const textToCheck = `${editTitle} ${editDescription}`;
      await notifyMentionsFromText(
        textToCheck,
        editTitle.trim(),
        user.name,
        task.id,
        task.listId,
        memberNames,
      );

      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating task:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleArchive = () => {
    if (!user) return;
    archiveTask(task.id, user.id);
  };

  const handleConfirmDelete = () => {
    deleteTask(task.id);
    setShowDeleteConfirm(false);
  };

  const handleAddPhone = () => setEditPhones([...editPhones, ""]);

  const handleRemovePhone = (index: number) =>
    setEditPhones(editPhones.filter((_, i) => i !== index));

  const handlePhoneChange = (index: number, value: string) => {
    const updated = [...editPhones];
    updated[index] = value;
    setEditPhones(updated);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "group transition-all relative border-b",
          dropdownOpen && "z-20",
        )}
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: isCompleted ? "rgba(37,99,235,0.02)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isCompleted) {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isCompleted) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <div className="flex items-center gap-3 py-3 px-3 sm:px-4 min-h-[56px] sm:min-h-[60px]">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleComplete();
            }}
            disabled={!canComplete}
            className={cn(
              "flex-shrink-0 transition-colors cursor-pointer",
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
            {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </button>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            {/* ── Title row: content left, actions right ── */}
            <div className="flex items-center gap-2">
              {/* Left: title + badges */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[13px] sm:text-[15px] font-medium transition-colors leading-tight line-clamp-2",
                    isCompleted && "line-through",
                  )}
                  style={{
                    color: isCompleted
                      ? "var(--text-tertiary)"
                      : "var(--text-primary)",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: linkifyPhoneNumbers(task.title),
                  }}
                />

                {/* Secondary info row */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* Priority badge */}
                  {task.priority &&
                    (() => {
                      const pc = getPriorityConfig(task.priority);
                      return (
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
                          <span className="text-[8px] leading-none">
                            {pc.emoji}
                          </span>
                          {pc.label}
                        </span>
                      );
                    })()}

                  {/* Due date */}
                  {task.dueDate && (
                    <DueDateBadge
                      dueDate={task.dueDate}
                      dueTime={task.dueTime}
                    />
                  )}

                  {/* Reminder */}
                  {task.reminders && task.reminders.length > 0 && (
                    <ReminderBadge reminder={task.reminders[0]} />
                  )}

                  {/* Recurrence */}
                  {task.recurrence && (
                    <span
                      className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(16,185,129,0.08)",
                        color: "#059669",
                      }}
                    >
                      <Repeat size={8} />
                      {getRecurrenceShortLabel(task.recurrence)}
                    </span>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1">
                      {task.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: "rgba(37,99,235,0.08)",
                            color: "#2563eb",
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                      {task.tags.length > 2 && (
                        <span
                          className="text-[9px] font-medium"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          +{task.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Description, location, phones row */}
                {(task.description || task.location || task.phones) && (
                  <div
                    className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] sm:text-[12px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {task.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={11} />
                        <span className="truncate">{task.location}</span>
                      </span>
                    )}
                    {task.phones && task.phones.length > 0 && (
                      <span className="flex items-center gap-1 truncate">
                        <Phone size={11} />
                        <span className="truncate">{task.phones[0]}</span>
                      </span>
                    )}
                    {task.description && (
                      <span className="truncate line-clamp-1">
                        {task.description}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit();
                    }}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#2563eb";
                      e.currentTarget.style.backgroundColor =
                        "rgba(37,99,235,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-tertiary)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                {canArchive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive();
                    }}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#d97706";
                      e.currentTarget.style.backgroundColor =
                        "rgba(245,158,11,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-tertiary)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Archivar"
                  >
                    <Archive size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Historial"
                >
                  {expanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.backgroundColor =
                        "rgba(239,68,68,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-tertiary)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Expanded details (activity & comments) ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="border-t"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="p-3 sm:p-4">
                {/* Options bar */}
                {canManageOptions && !isCompleted && (
                  <div className="mb-3">
                    <TaskOptionsBar
                      dueDate={task.dueDate}
                      dueTime={task.dueTime}
                      reminders={task.reminders || []}
                      recurrence={task.recurrence}
                      onReminderChange={(r) =>
                        user && updateTask(task.id, { reminders: r }, user.id)
                      }
                      onDueDateChange={(d) => {
                        if (!user) return;
                        updateTask(
                          task.id,
                          {
                            dueDate: d,
                            dueTime: d ? task.dueTime || null : null,
                          },
                          user.id,
                        );
                      }}
                      onRecurrenceChange={(r) => {
                        if (!user) return;
                        const updates: Partial<Task> = { recurrence: r };
                        if (r && !task.dueDate) {
                          updates.dueDate = toISODate(new Date());
                        }
                        updateTask(task.id, updates, user.id, user.name);
                      }}
                      onDropdownOpenChange={setDropdownOpen}
                    />
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Clock size={10} />
                    {timeAgo(task.createdAt)}
                  </span>
                  {task.assignedTo && (
                    <span
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <User size={10} />
                      {getUserName(task.assignedTo)}
                    </span>
                  )}
                  {isCompleted && task.completedBy && (
                    <span
                      className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(37,99,235,0.1)",
                        color: "var(--text-link)",
                      }}
                    >
                      <CheckCircle2 size={8} />
                      Completado por {getUserName(task.completedBy)} •{" "}
                      {formatActivityDateTime(
                        task.completedAt || task.createdAt,
                      )}
                    </span>
                  )}
                </div>

                {/* History */}
                <p
                  className="flex items-center gap-1.5 text-xs font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <History size={12} />
                  Actividad
                </p>
                <div className="space-y-2 mb-4">
                  {task.history.slice(-8).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-2 text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: "var(--bg-tertiary)" }}
                      />
                      <span className="leading-relaxed">
                        <span
                          className="font-semibold"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {getUserName(entry.performedBy)}
                        </span>{" "}
                        {entry.details || entry.action}
                        <span
                          className="ml-1"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          · {formatActivityDateTime(entry.performedAt)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Comments */}
                <TaskComments
                  taskId={task.id}
                  listId={task.listId}
                  memberNames={memberNames}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar tarea"
        size="task"
      >
        <div className="space-y-6">
          {/* Section: Título */}
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              Título
            </label>
            <AutoResizeTextarea
              value={editTitle}
              onChange={setEditTitle}
              placeholder="Título de la tarea"
              autoFocus
              className="text-base sm:text-lg font-semibold"
              minRows={1}
            />
          </div>

          {/* Section: Descripción */}
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              Descripción
            </label>
            <AutoResizeTextarea
              value={editDescription}
              onChange={setEditDescription}
              placeholder="Añade una descripción..."
              className="text-sm sm:text-base"
              minRows={2}
            />
          </div>

          {/* Section: Ubicación */}
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <MapPin size={12} style={{ color: "var(--text-tertiary)" }} />
              Ubicación
            </label>
            <AutoResizeTextarea
              value={editLocation}
              onChange={setEditLocation}
              placeholder="Ubicación o dirección"
              className="text-sm sm:text-base"
              minRows={1}
            />
          </div>

          {/* Section: Teléfonos */}
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Phone size={12} style={{ color: "var(--text-tertiary)" }} />
              Teléfonos
            </label>
            <div className="space-y-2">
              {editPhones.map((phone, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AutoResizeTextarea
                    value={phone}
                    onChange={(v) => handlePhoneChange(index, v)}
                    placeholder={`Teléfono ${index + 1}`}
                    className="flex-1 text-sm sm:text-base"
                    minRows={1}
                  />
                  {editPhones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(index)}
                      className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.backgroundColor =
                          "rgba(239,68,68,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-tertiary)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPhone}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-2 rounded-lg"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Plus size={12} />
                Agregar teléfono
              </button>
            </div>
          </div>

          {/* Section: Prioridad */}
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              Prioridad
            </label>
            <select
              value={editPriority || ""}
              onChange={(e) =>
                setEditPriority(
                  (e.target.value as Task["priority"]) || undefined,
                )
              }
              className="w-full text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 outline-none"
              style={{
                border: "1px solid var(--border-input)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">⚪ Sin prioridad</option>
              <option value="urgent">🔴 Crítica</option>
              <option value="high">🟠 Alta</option>
              <option value="medium">🟡 Media</option>
              <option value="low">🟢 Baja</option>
            </select>
          </div>

          {/* Section: Opciones de fecha/recurrencia */}
          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              Fecha y recordatorios
            </label>
            <TaskOptionsBar
              dueDate={editDueDate}
              dueTime={editDueTime}
              reminders={editReminders}
              recurrence={editRecurrence}
              onReminderChange={(r) => setEditReminders(r)}
              onDueDateChange={(d) => setEditDueDate(d)}
              onRecurrenceChange={(r) => setEditRecurrence(r)}
            />
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-3 pt-4 border-t"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editTitle.trim() || isSavingEdit}
              isLoading={isSavingEdit}
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Eliminar tarea"
      >
        <div className="space-y-4">
          <div
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{
              backgroundColor: "rgba(239,68,68,0.06)",
              borderColor: "rgba(239,68,68,0.2)",
            }}
          >
            <AlertTriangle
              size={18}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "#ef4444" }}
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                Esta acción es permanente
              </p>
              <p
                className="text-sm mt-0.5 leading-relaxed"
                style={{ color: "#ef4444" }}
              >
                ¿Estás seguro de que deseas eliminar esta tarea? No podrás
                recuperarla.
              </p>
            </div>
          </div>
          <p
            className="text-sm font-medium line-clamp-2 px-1"
            style={{ color: "var(--text-secondary)" }}
          >
            &quot;{task.title}&quot;
          </p>
          <div className="flex gap-3 pt-1">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              className="flex-1"
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Task Completion Modal ── */}
      <TaskCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        taskId={task.id}
        taskTitle={task.title}
        onConfirm={handleCompletionConfirm}
        listMembers={listMembers}
      />
    </>
  );
}

// ---- Helper Components & Functions ----

function DueDateBadge({
  dueDate,
  dueTime,
}: {
  dueDate: string;
  dueTime?: string | null;
}) {
  const now = new Date();
  const due = new Date(dueDate + (dueTime ? `T${dueTime}` : "T23:59:59"));
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let badgeStyle: React.CSSProperties = {
    backgroundColor: "rgba(37,99,235,0.08)",
    color: "#2563eb",
  };
  let label = dueTime ? `${dueDate} · ${dueTime}` : dueDate;

  if (diffMs < 0) {
    badgeStyle = { backgroundColor: "rgba(239,68,68,0.08)", color: "#dc2626" };
    label = "Vencida";
  } else if (diffDays === 0) {
    badgeStyle = { backgroundColor: "rgba(37,99,235,0.08)", color: "#2563eb" };
    label = dueTime ? `Hoy · ${dueTime}` : "Vence hoy";
  } else if (diffDays === 1) {
    label = "Mañana";
  } else if (diffDays < 7) {
    const dateStr = due.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
    });
    label = dateStr;
  } else {
    const dateStr = due.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    label = dateStr;
  }

  return (
    <span
      className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={badgeStyle}
    >
      <CalendarDays size={8} />
      {label}
    </span>
  );
}

function ReminderBadge({
  reminder,
}: {
  reminder: { id: string; at: string; sent: boolean };
}) {
  const at = new Date(reminder.at);
  const now = new Date();
  const diffMs = at.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let label = "";

  if (diffMs < 0) {
    label = "Vencido";
  } else if (diffMinutes < 1) {
    label = "Ahora";
  } else if (diffMinutes < 60) {
    label = `En ${diffMinutes} min`;
  } else if (diffHours < 24) {
    if (diffHours === 1) {
      label = "En 1 hora";
    } else {
      label = `En ${diffHours} horas`;
    }
  } else if (diffDays === 1) {
    const timeStr = at.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    label = `Mañana · ${timeStr}`;
  } else if (diffDays === 0) {
    const timeStr = at.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    label = `Hoy · ${timeStr}`;
  } else {
    const dateStr = at.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    const timeStr = at.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    label = `${dateStr} · ${timeStr}`;
  }

  return (
    <span
      className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: "rgba(245,158,11,0.08)", color: "#d97706" }}
    >
      <Bell size={8} />
      {label}
    </span>
  );
}

function getRecurrenceShortLabel(rec: NonNullable<Task["recurrence"]>): string {
  if (rec.type === "custom") {
    if (rec.daysOfWeek && rec.daysOfWeek.length > 0) {
      return "Semanal (personalizado)";
    }
    if (rec.interval && rec.interval > 1) {
      return `Cada ${rec.interval} días`;
    }
    return "Personalizado";
  }

  const labels: Record<string, string> = {
    daily: "Diario",
    weekdays: "Laboral",
    weekly: "Semanal",
    monthly: "Mensual",
    yearly: "Anual",
  };
  return labels[rec.type] || "Repetir";
}
