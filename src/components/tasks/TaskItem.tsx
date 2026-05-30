"use client";

import React, { useState } from "react";
import { Task, MemberRole } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canCompleteTask, canDeleteTask, canEditTask } from "@/lib/permissions";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import TaskOptionsBar from "./TaskOptionsBar";
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
} from "lucide-react";
import {
  cn,
  timeAgo,
  formatActivityDateTime,
  linkifyPhoneNumbers,
  linkifyLocation,
} from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  role: MemberRole | null;
  memberNames: Record<string, string>;
}

export default function TaskItem({ task, role, memberNames }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const { user } = useAuthStore();
  const { completeTask, uncompleteTask, deleteTask, updateTask, archiveTask } =
    useTaskStore();

  const isCompleted = task.status === "completed";
  const canComplete = canCompleteTask(role);
  const canEdit = canEditTask(role);
  const canDelete = canDeleteTask(role);

  const getUserName = (userId: string) =>
    memberNames[userId] || "Usuario desconocido";

  const handleToggleComplete = () => {
    if (!user || !canComplete) return;
    if (isCompleted) {
      uncompleteTask(task.id, user.id);
    } else {
      completeTask(task.id, user.id, user.name);
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
          "group rounded-xl border transition-colors overflow-hidden",
          isCompleted
            ? "border-blue-200 bg-blue-50/30"
            : "border-gray-200 bg-white hover:border-blue-200",
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                {/* Tarea */}
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5">
                    Tarea
                  </span>
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors flex-1 leading-relaxed",
                      isCompleted
                        ? "text-gray-400 line-through"
                        : "text-gray-900",
                    )}
                    dangerouslySetInnerHTML={{
                      __html: linkifyPhoneNumbers(task.title),
                    }}
                  />
                </div>

                {/* Teléfonos */}
                {task.phoneNumbers && task.phoneNumbers.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                      <Phone size={10} className="text-blue-500" />
                      Teléfonos
                    </span>
                    <span
                      className="text-sm flex-1 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: task.phoneNumbers
                          .map((phone) => linkifyPhoneNumbers(phone))
                          .join(' <span class="text-gray-300 mx-1">•</span> '),
                      }}
                    />
                  </div>
                )}

                {/* Ubicación */}
                {task.location && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} className="text-blue-500" />
                      Ubicación
                    </span>
                    <span
                      className="text-sm flex-1 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: linkifyLocation(task.location),
                      }}
                    />
                  </div>
                )}

                {/* Descripción */}
                {task.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                      <FileText size={10} className="text-gray-400" />
                      Descripción
                    </span>
                    <p
                      className="text-sm text-gray-700 flex-1 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: linkifyPhoneNumbers(task.description),
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                {canEdit && (
                  <button
                    onClick={handleOpenEdit}
                    className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center active:scale-90"
                    title="Editar tarea"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={handleArchive}
                    className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center active:scale-90"
                    title="Archivar tarea"
                  >
                    <Archive size={14} />
                  </button>
                )}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center active:scale-90"
                  title="Ver actividad"
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
                    className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center active:scale-90"
                    title="Eliminar tarea"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center flex-wrap gap-3 mt-3">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock size={10} />
                {timeAgo(task.createdAt)}
              </span>
              {task.assignedTo && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <User size={10} />
                  {getUserName(task.assignedTo)}
                </span>
              )}
              {isCompleted && task.completedBy && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  <CheckCircle2 size={8} />
                  Completado por {getUserName(task.completedBy)} •{" "}
                  {formatActivityDateTime(task.completedAt || task.createdAt)}
                </span>
              )}
              {/* Due date badge */}
              {task.dueDate && !isCompleted && (
                <DueDateBadge dueDate={task.dueDate} dueTime={task.dueTime} />
              )}
              {/* Reminder badge */}
              {task.reminders && task.reminders.length > 0 && !isCompleted && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  <Bell size={8} />
                  Recordatorio
                </span>
              )}
              {/* Recurrence badge */}
              {task.recurrence && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                  <Repeat size={8} />
                  {getRecurrenceShortLabel(task.recurrence)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expanded: History */}
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100"
          >
            <div className="p-4 pt-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-3">
                <History size={12} />
                Actividad
              </p>
              <div className="space-y-2">
                {task.history.slice(-8).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 text-[11px] text-gray-500"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                    <span className="leading-relaxed">
                      <span className="font-semibold text-gray-700">
                        {getUserName(entry.performedBy)}
                      </span>{" "}
                      {entry.details || entry.action}
                      <span className="text-gray-400 ml-1">
                        · {formatActivityDateTime(entry.performedAt)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
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
            className="text-base font-semibold text-gray-900 placeholder:text-gray-300"
            minRows={1}
          />

          {/* Descripción — auto-resize */}
          <AutoResizeTextarea
            value={editDescription}
            onChange={setEditDescription}
            placeholder="Añade una descripción..."
            className="text-sm text-gray-600 placeholder:text-gray-300"
            minRows={1}
          />

          {/* Ubicación */}
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-300 flex-shrink-0" />
            <input
              type="text"
              placeholder="Ubicación o dirección"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </div>

          {/* Teléfonos */}
          <div className="space-y-1.5">
            {editPhones.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <Phone size={14} className="text-gray-300 flex-shrink-0" />
                <input
                  type="tel"
                  placeholder={`Teléfono ${index + 1}`}
                  value={phone}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 bg-transparent border-none focus:outline-none focus:ring-0"
                />
                {editPhones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(index)}
                    className="p-1 rounded-md text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPhone}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-6"
            >
              <Plus size={12} />
              Agregar teléfono
            </button>
          </div>

          {/* Options Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
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
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle
              size={18}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Esta acción es permanente
              </p>
              <p className="text-sm text-red-600 mt-0.5 leading-relaxed">
                ¿Estás seguro de que deseas eliminar esta tarea? No podrás
                recuperarla.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-medium line-clamp-2 px-1">
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
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  let bgClass = "bg-gray-100 text-gray-600";
  let label = dueTime ? `${dueDate} · ${dueTime}` : dueDate;

  if (diffHours < 0) {
    bgClass = "bg-red-50 text-red-600";
    label = "Vencida";
  } else if (diffHours <= 24) {
    bgClass = "bg-amber-50 text-amber-700";
    label = dueTime ? `Hoy · ${dueTime}` : "Vence hoy";
  } else if (diffHours <= 48) {
    label = "Mañana";
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

function getRecurrenceShortLabel(rec: NonNullable<Task["recurrence"]>): string {
  const labels: Record<string, string> = {
    daily: "Diario",
    weekdays: "Laboral",
    weekly: "Semanal",
    monthly: "Mensual",
    yearly: "Anual",
    custom: "Custom",
  };
  return labels[rec.type] || "Repetir";
}
