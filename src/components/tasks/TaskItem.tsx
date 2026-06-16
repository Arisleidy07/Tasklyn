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

  const getUserName = (userId: string) => memberNames[userId] || "...";

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
        whileHover={{ y: -1, boxShadow: "0 4px 16px -4px rgba(0,0,0,0.07)" }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "group rounded-xl border transition-colors relative",
          dropdownOpen && "z-20",
        )}
        style={
          isCompleted
            ? {
                borderColor: "rgba(147,197,253,0.5)",
                backgroundColor: "rgba(37,99,235,0.03)",
              }
            : {
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-card)",
              }
        }
      >
        <div className="flex items-start gap-2 p-2">
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
            {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          </button>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            {/* ── Title row: content left, actions right ── */}
            <div className="flex items-start gap-1">
              {/* Left: title + badges */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[13px] font-medium transition-colors leading-snug",
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

                {/* Priority badge */}
                {task.priority &&
                  (() => {
                    const pc = getPriorityConfig(task.priority);
                    return (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 border",
                          pc.bg,
                          pc.bgDark,
                          pc.text,
                          pc.textDark,
                          pc.border,
                          pc.borderDark,
                        )}
                      >
                        <span className="text-[9px] leading-none">
                          {pc.emoji}
                        </span>
                        {pc.label}
                      </span>
                    );
                  })()}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {task.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: "rgba(37,99,235,0.08)",
                          color: "#2563eb",
                        }}
                      >
                        <Tag size={7} />#{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Option badges (always shown when set) */}
                {(task.dueDate ||
                  (task.reminders && task.reminders.length > 0) ||
                  task.recurrence) && (
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {task.dueDate && (
                      <DueDateBadge
                        dueDate={task.dueDate}
                        dueTime={task.dueTime}
                      />
                    )}
                    {task.reminders && task.reminders.length > 0 && (
                      <ReminderBadge reminder={task.reminders[0]} />
                    )}
                    {task.recurrence && (
                      <span
                        className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "rgba(16,185,129,0.08)",
                          color: "#059669",
                        }}
                      >
                        <Repeat size={8} />
                        {getRecurrenceShortLabel(task.recurrence)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right: action buttons */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {canEdit && (
                  <button
                    onClick={handleOpenEdit}
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
                    onClick={handleArchive}
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
                  onClick={() => setExpanded(!expanded)}
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

            {/* ── Details: phones, location, description ── */}
            {task.phoneNumbers && task.phoneNumbers.length > 0 && (
              <div className="flex items-start gap-2 mt-2">
                <span
                  className="text-xs font-bold uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Phone size={10} className="text-blue-500" />
                  Teléfonos
                </span>
                <span
                  className="text-sm flex-1 leading-relaxed break-words whitespace-normal"
                  dangerouslySetInnerHTML={{
                    __html: task.phoneNumbers
                      .map((phone) => linkifyPhoneNumbers(phone))
                      .join(' <span class="text-gray-300 mx-1">•</span> '),
                  }}
                />
              </div>
            )}
            {task.location && (
              <div className="flex items-start gap-2 mt-2">
                <span
                  className="text-xs font-bold uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <MapPin size={10} className="text-blue-500" />
                  Ubicación
                </span>
                <span
                  className="text-sm flex-1 leading-relaxed break-words whitespace-normal"
                  dangerouslySetInnerHTML={{
                    __html: linkifyLocation(task.location),
                  }}
                />
              </div>
            )}
            {task.description && (
              <div className="flex items-start gap-2 mt-2">
                <span
                  className="text-xs font-bold uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <FileText
                    size={10}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  Descripción
                </span>
                <p
                  className="text-sm flex-1 leading-relaxed break-words whitespace-normal"
                  style={{ color: "var(--text-secondary)" }}
                  dangerouslySetInnerHTML={{
                    __html: linkifyPhoneNumbers(task.description),
                  }}
                />
              </div>
            )}

            {/* ── Options bar (editors/owners on active tasks) ── */}
            {canManageOptions && !isCompleted && (
              <div className="mt-2">
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
                        // Si se elimina la fecha, limpiamos también la hora
                        dueTime: d ? task.dueTime || null : null,
                      },
                      user.id,
                    );
                  }}
                  onRecurrenceChange={(r) => {
                    if (!user) return;

                    const updates: Partial<Task> = {
                      recurrence: r,
                    };

                    // Si activas una repetición y no hay vencimiento, fija uno por defecto (hoy)
                    if (r && !task.dueDate) {
                      updates.dueDate = toISODate(new Date());
                    }

                    updateTask(task.id, updates, user.id, user.name);
                  }}
                  onDropdownOpenChange={setDropdownOpen}
                />
              </div>
            )}

            {/* ── Meta ── */}
            <div className="flex items-center flex-wrap gap-2 mt-2">
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
                  {formatActivityDateTime(task.completedAt || task.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expanded: History */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="history"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="p-4 pt-3">
                <p
                  className="flex items-center gap-1.5 text-xs font-medium mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <History size={12} />
                  Actividad
                </p>
                <div className="space-y-2">
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
      >
        <div className="space-y-4">
          {/* Título — auto-resize textarea */}
          <AutoResizeTextarea
            value={editTitle}
            onChange={setEditTitle}
            placeholder="Título de la tarea"
            autoFocus
            className="text-base font-semibold"
            minRows={1}
          />

          {/* Descripción — auto-resize */}
          <AutoResizeTextarea
            value={editDescription}
            onChange={setEditDescription}
            placeholder="Añade una descripción..."
            className="text-sm"
            minRows={1}
          />

          {/* Ubicación */}
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
            <AutoResizeTextarea
              value={editLocation}
              onChange={setEditLocation}
              placeholder="Ubicación o dirección"
              className="text-sm"
              minRows={1}
            />
          </div>

          {/* Teléfonos */}
          <div className="space-y-1.5">
            {editPhones.map((phone, index) => (
              <div key={index} className="flex items-start gap-2">
                <Phone
                  size={14}
                  className="text-gray-300 flex-shrink-0 mt-0.5"
                />
                <AutoResizeTextarea
                  value={phone}
                  onChange={(v) => handlePhoneChange(index, v)}
                  placeholder={`Teléfono ${index + 1}`}
                  className="flex-1 text-sm"
                  minRows={1}
                />
                {editPhones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(index)}
                    className="p-1 rounded-md transition-colors flex-shrink-0"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-tertiary)";
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
              className="flex items-center gap-1.5 text-xs transition-colors ml-6"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-tertiary)";
              }}
            >
              <Plus size={12} />
              Agregar teléfono
            </button>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center gap-2">
            <span className="text-base leading-none flex-shrink-0">
              {getPriorityConfig(editPriority).emoji}
            </span>
            <select
              value={editPriority || ""}
              onChange={(e) =>
                setEditPriority(
                  (e.target.value as Task["priority"]) || undefined,
                )
              }
              className="text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 flex-1 outline-none"
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

          {/* Options Bar */}
          <div
            className="flex items-center justify-between pt-2 border-t"
            style={{ borderColor: "var(--border-color)" }}
          >
            <TaskOptionsBar
              dueDate={editDueDate}
              dueTime={editDueTime}
              reminders={editReminders}
              recurrence={editRecurrence}
              onReminderChange={(r) => setEditReminders(r)}
              onDueDateChange={(d) => setEditDueDate(d)}
              onRecurrenceChange={(r) => setEditRecurrence(r)}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editTitle.trim() || isSavingEdit}
                isLoading={isSavingEdit}
              >
                Guardar
              </Button>
            </div>
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
