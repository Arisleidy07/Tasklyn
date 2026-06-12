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
  Flag,
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
      completeTask(task.id, user.id, user.name, listMembers);
    }
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
          isCompleted
            ? "border-blue-200 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-500/5"
            : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-blue-200 dark:hover:border-blue-500/40",
          dropdownOpen && "z-20",
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

          {/* Content column */}
          <div className="flex-1 min-w-0">
            {/* ── Title row: content left, actions right ── */}
            <div className="flex items-start gap-2">
              {/* Left: title + badges */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[15px] font-medium transition-colors leading-snug",
                    isCompleted
                      ? "text-gray-400 dark:text-slate-500 line-through"
                      : "text-gray-900 dark:text-slate-100",
                  )}
                  style={{
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: linkifyPhoneNumbers(task.title),
                  }}
                />

                {/* Priority badge */}
                {task.priority && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1",
                      task.priority === "urgent" &&
                        "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
                      task.priority === "high" &&
                        "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
                      task.priority === "medium" &&
                        "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400",
                      task.priority === "low" &&
                        "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
                    )}
                  >
                    <Flag size={8} />
                    {task.priority === "urgent"
                      ? "Crítica"
                      : task.priority === "high"
                        ? "Alta"
                        : task.priority === "medium"
                          ? "Media"
                          : "Baja"}
                  </span>
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {task.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-medium"
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
                      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
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
                    className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                {canArchive && (
                  <button
                    onClick={handleArchive}
                    className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                    title="Archivar"
                  >
                    <Archive size={14} />
                  </button>
                )}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center active:scale-90"
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
                    className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors cursor-pointer flex items-center justify-center active:scale-90"
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
                <span className="text-xs font-bold text-gray-700 dark:text-slate-400 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
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
                <span className="text-xs font-bold text-gray-700 dark:text-slate-400 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
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
                <span className="text-xs font-bold text-gray-700 dark:text-slate-400 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                  <FileText
                    size={10}
                    className="text-gray-400 dark:text-slate-500"
                  />
                  Descripción
                </span>
                <p
                  className="text-sm text-gray-700 dark:text-slate-300 flex-1 leading-relaxed break-words whitespace-normal"
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
              <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500">
                <Clock size={10} />
                {timeAgo(task.createdAt)}
              </span>
              {task.assignedTo && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500">
                  <User size={10} />
                  {getUserName(task.assignedTo)}
                </span>
              )}
              {isCompleted && task.completedBy && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
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
              className="border-t border-gray-100 dark:border-slate-700"
            >
              <div className="p-4 pt-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">
                  <History size={12} />
                  Actividad
                </p>
                <div className="space-y-2">
                  {task.history.slice(-8).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-2 text-[11px] text-gray-500 dark:text-slate-400"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600 mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed">
                        <span className="font-semibold text-gray-700 dark:text-slate-300">
                          {getUserName(entry.performedBy)}
                        </span>{" "}
                        {entry.details || entry.action}
                        <span className="text-gray-400 dark:text-slate-500 ml-1">
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
            className="text-base font-semibold text-gray-900 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-slate-600"
            minRows={1}
          />

          {/* Descripción — auto-resize */}
          <AutoResizeTextarea
            value={editDescription}
            onChange={setEditDescription}
            placeholder="Añade una descripción..."
            className="text-sm text-gray-600 dark:text-slate-300 placeholder:text-gray-300 dark:placeholder:text-slate-600"
            minRows={1}
          />

          {/* Ubicación */}
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
            <AutoResizeTextarea
              value={editLocation}
              onChange={setEditLocation}
              placeholder="Ubicación o dirección"
              className="text-sm text-gray-700 dark:text-slate-300 placeholder:text-gray-300 dark:placeholder:text-slate-600"
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
                  className="flex-1 text-sm text-gray-700 dark:text-slate-300 placeholder:text-gray-300 dark:placeholder:text-slate-600"
                  minRows={1}
                />
                {editPhones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(index)}
                    className="p-1 rounded-md text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPhone}
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors ml-6"
            >
              <Plus size={12} />
              Agregar teléfono
            </button>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center gap-2">
            <Flag size={14} className="text-gray-300 flex-shrink-0" />
            <select
              value={editPriority || ""}
              onChange={(e) =>
                setEditPriority(
                  (e.target.value as Task["priority"]) || undefined,
                )
              }
              className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 flex-1"
            >
              <option value="">Sin prioridad</option>
              <option value="urgent">🔴 Crítica</option>
              <option value="high">🟠 Alta</option>
              <option value="medium">🟡 Media</option>
              <option value="low">🟢 Baja</option>
            </select>
          </div>

          {/* Options Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
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
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40">
            <AlertTriangle
              size={18}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-400">
                Esta acción es permanente
              </p>
              <p className="text-sm text-red-600 dark:text-red-400/80 mt-0.5 leading-relaxed">
                ¿Estás seguro de que deseas eliminar esta tarea? No podrás
                recuperarla.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300 font-medium line-clamp-2 px-1">
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

  let bgClass =
    "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400";
  let label = dueTime ? `${dueDate} · ${dueTime}` : dueDate;

  if (diffMs < 0) {
    bgClass = "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400";
    label = "Vencida";
  } else if (diffDays === 0) {
    bgClass = "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400";
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
      className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${bgClass}`}
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
    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
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
