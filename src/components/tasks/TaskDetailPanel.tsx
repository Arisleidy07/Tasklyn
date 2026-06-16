"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Task, MemberRole } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import {
  canEditTask,
  canDeleteTask,
  canArchiveTask,
  canManageTaskOptions,
  canCompleteTask,
} from "@/lib/permissions";
import TaskOptionsBar from "./TaskOptionsBar";
import TaskComments from "./TaskComments";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import Button from "@/components/ui/Button";
import { getPriorityConfig } from "@/lib/priority";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import {
  linkifyAll,
  linkifyLocation,
  linkifyPhoneNumbers,
  timeAgo,
} from "@/lib/utils";
import {
  X,
  Edit2,
  Trash2,
  Archive,
  Phone,
  MapPin,
  FileText,
  Check,
  Tag,
  User,
  Clock,
  ChevronDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  role: MemberRole | null;
  memberNames: Record<string, string>;
  listMembers?: Array<{ userId: string; role: string }>;
}

export default function TaskDetailPanel({
  task,
  isOpen,
  onClose,
  role,
  memberNames,
  listMembers,
}: TaskDetailPanelProps) {
  const { user } = useAuthStore();
  const { updateTask, deleteTask, archiveTask } = useTaskStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);
  const [editPhones, setEditPhones] = useState<string[]>([""]);
  const [editingPhones, setEditingPhones] = useState(false);
  const [editPriority, setEditPriority] = useState<Task["priority"]>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const canEdit = canEditTask(role);
  const canDelete = canDeleteTask(role);
  const canArchive = canArchiveTask(role);
  const canManageOptions = canManageTaskOptions(role);

  // Resolve all userIds in task to real names
  const userIdsToResolve = useMemo(() => {
    if (!task) return [];
    const ids = new Set<string>();
    if (task.createdBy) ids.add(task.createdBy);
    if (task.completedBy) ids.add(task.completedBy);
    if (task.performedBy) ids.add(task.performedBy);
    if (task.assignedTo) ids.add(task.assignedTo);
    task.history?.forEach((h) => {
      if (h.performedBy) ids.add(h.performedBy);
    });
    return Array.from(ids);
  }, [task?.id, task?.history?.length, task?.completedBy]);

  const { getProfile } = useUserProfiles(userIdsToResolve);

  const resolveName = (
    uid: string | null | undefined,
    fallback?: string,
  ): string => {
    if (!uid) return fallback || "—";
    if (user && uid === user.id) return user.name;
    return memberNames[uid] || getProfile(uid).name || fallback || uid;
  };

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (task && isOpen) {
      setEditTitle(task.title);
      setEditDescription(task.description || "");
      setEditLocation(task.location || "");
      setEditPhones(task.phoneNumbers?.length ? [...task.phoneNumbers] : [""]);
      setEditPriority(task.priority);
      setEditingTitle(false);
      setEditingDescription(false);
      setEditingLocation(false);
      setEditingPhones(false);
      setShowDeleteConfirm(false);
    }
  }, [task?.id, isOpen]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!task) return null;

  const saveField = async (updates: Partial<Task>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateTask(task.id, updates, user.id, user.name);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) return;
    setEditingTitle(false);
    if (editTitle.trim() !== task.title)
      await saveField({ title: editTitle.trim() });
  };

  const handleSaveDescription = async () => {
    setEditingDescription(false);
    if (editDescription !== (task.description || ""))
      await saveField({ description: editDescription.trim() });
  };

  const handleSaveLocation = async () => {
    setEditingLocation(false);
    if (editLocation !== (task.location || ""))
      await saveField({ location: editLocation.trim() || undefined });
  };

  const handleSavePhones = async () => {
    setEditingPhones(false);
    const validPhones = editPhones.filter((p) => p.trim());
    const current = task.phoneNumbers || [];
    if (JSON.stringify(validPhones) !== JSON.stringify(current))
      await saveField({
        phoneNumbers: validPhones.length ? validPhones : undefined,
      });
  };

  const handleSavePriority = async (p: Task["priority"]) => {
    setEditPriority(p);
    setDropdownOpen(false);
    if (p !== task.priority) await saveField({ priority: p });
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };
  const handleArchive = () => {
    if (!user) return;
    archiveTask(task.id, user.id);
    onClose();
  };

  const pc = editPriority ? getPriorityConfig(editPriority) : null;
  const isCompleted = task.status === "completed";

  // ─── PANEL CONTENT ─────────────────────────────────────────────
  const panelContent = (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
              Completada
            </span>
          )}
          {isSaving && (
            <span
              className="text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Guardando...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canArchive && (
            <button
              onClick={handleArchive}
              title="Archivar"
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Archive size={16} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Eliminar"
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-tertiary)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors ml-1"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
        }}
      >
        <div className="px-5 py-5 space-y-5">
          {/* 1. TÍTULO */}
          <div>
            {editingTitle && canEdit ? (
              <input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
                className="w-full text-xl font-semibold bg-transparent border-b-2 border-blue-500 outline-none py-1"
                style={{ color: "var(--text-primary)" }}
              />
            ) : (
              <h2
                className={cn(
                  "text-xl font-semibold leading-snug cursor-pointer group/title flex items-start gap-2",
                  isCompleted && "line-through opacity-60",
                )}
                style={{ color: "var(--text-primary)" }}
                onClick={() => canEdit && setEditingTitle(true)}
              >
                <span className="flex-1">{task.title}</span>
                {canEdit && (
                  <Edit2
                    size={13}
                    className="flex-shrink-0 opacity-0 group-hover/title:opacity-40 transition-opacity mt-1"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                )}
              </h2>
            )}
          </div>

          {/* 2. DESCRIPCIÓN */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <FileText size={11} /> Descripción
            </p>
            {editingDescription && canEdit ? (
              <div className="space-y-2">
                <AutoResizeTextarea
                  value={editDescription}
                  onChange={setEditDescription}
                  placeholder="Añade una descripción..."
                  className="text-sm px-3 py-2.5"
                  minRows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDescription}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingDescription(false);
                      setEditDescription(task.description || "");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "text-sm rounded-xl px-3 py-2.5 min-h-[40px] cursor-pointer transition-colors leading-relaxed",
                  canEdit && "hover:ring-1 hover:ring-blue-300",
                )}
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: task.description
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                }}
                onClick={() => canEdit && setEditingDescription(true)}
                dangerouslySetInnerHTML={{
                  __html: task.description
                    ? linkifyAll(task.description)
                    : canEdit
                      ? "Añade una descripción..."
                      : "Sin descripción",
                }}
              />
            )}
          </div>

          {/* 3. UBICACIÓN */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <MapPin size={11} /> Ubicación
            </p>
            {editingLocation && canEdit ? (
              <div className="space-y-2">
                <input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Añade una dirección o lugar..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveLocation();
                    if (e.key === "Escape") setEditingLocation(false);
                  }}
                  className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-input)",
                    color: "var(--text-primary)",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveLocation}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingLocation(false);
                      setEditLocation(task.location || "");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "text-sm rounded-xl px-3 py-2.5 min-h-[40px] cursor-pointer transition-colors",
                  canEdit && "hover:ring-1 hover:ring-blue-300",
                )}
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: task.location
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                }}
                onClick={() => canEdit && setEditingLocation(true)}
                dangerouslySetInnerHTML={{
                  __html: task.location
                    ? linkifyLocation(task.location)
                    : canEdit
                      ? "Añade una ubicación..."
                      : "Sin ubicación",
                }}
              />
            )}
          </div>

          {/* 4. TELÉFONOS */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Phone size={11} /> Teléfonos
            </p>
            {editingPhones && canEdit ? (
              <div className="space-y-2">
                {editPhones.map((phone, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const u = [...editPhones];
                        u[i] = e.target.value;
                        setEditPhones(u);
                      }}
                      placeholder={"Teléfono " + (i + 1)}
                      className="flex-1 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-input)",
                        color: "var(--text-primary)",
                      }}
                    />
                    {editPhones.length > 1 && (
                      <button
                        onClick={() =>
                          setEditPhones(editPhones.filter((_, j) => j !== i))
                        }
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setEditPhones([...editPhones, ""])}
                  className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700"
                >
                  <Plus size={12} /> Añadir teléfono
                </button>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSavePhones}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingPhones(false);
                      setEditPhones(
                        task.phoneNumbers?.length
                          ? [...task.phoneNumbers]
                          : [""],
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "text-sm rounded-xl px-3 py-2.5 min-h-[40px] cursor-pointer transition-colors",
                  canEdit && "hover:ring-1 hover:ring-blue-300",
                )}
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: task.phoneNumbers?.filter((p) => p.trim()).length
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                }}
                onClick={() => canEdit && setEditingPhones(true)}
              >
                {task.phoneNumbers?.filter((p) => p.trim()).length ? (
                  <div className="space-y-1">
                    {task.phoneNumbers
                      .filter((p) => p.trim())
                      .map((p, i) => (
                        <div
                          key={i}
                          dangerouslySetInnerHTML={{
                            __html: linkifyPhoneNumbers(p),
                          }}
                        />
                      ))}
                  </div>
                ) : canEdit ? (
                  "Añade un número de teléfono..."
                ) : (
                  "Sin teléfonos"
                )}
              </div>
            )}
          </div>

          {/* 5. PRIORIDAD */}
          {canEdit && (
            <div className="relative">
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Prioridad
              </p>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                {pc ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-medium",
                      pc.text,
                    )}
                  >
                    <span>{pc.emoji}</span> {pc.label}
                  </span>
                ) : (
                  <span style={{ color: "var(--text-tertiary)" }}>
                    Sin prioridad
                  </span>
                )}
                <ChevronDown
                  size={14}
                  style={{ color: "var(--text-tertiary)" }}
                />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute left-0 top-full mt-1 z-50 rounded-xl shadow-xl border overflow-hidden w-44"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    {(
                      [undefined, "low", "medium", "high", "urgent"] as const
                    ).map((p) => {
                      const cfg = p ? getPriorityConfig(p) : null;
                      return (
                        <button
                          key={p ?? "none"}
                          onClick={() => handleSavePriority(p)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "var(--bg-secondary)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          {cfg ? (
                            <span
                              className={cn(
                                "flex items-center gap-1.5 font-medium",
                                cfg.text,
                              )}
                            >
                              <span>{cfg.emoji}</span> {cfg.label}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-tertiary)" }}>
                              Sin prioridad
                            </span>
                          )}
                          {editPriority === p && (
                            <Check
                              size={14}
                              className="ml-auto text-blue-500"
                            />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 6. RECORDATORIO / FECHA / RECURRENCIA */}
          {canManageOptions && (
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                Recordatorio · Fecha · Repetir
              </p>
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
                onDropdownOpenChange={setDropdownOpen}
              />
            </div>
          )}

          {/* 7. ASIGNADO A */}
          {task.assignedTo && (
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                <User size={11} /> Asignado a
              </p>
              <div
                className="text-sm rounded-xl px-3 py-2.5"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                {resolveName(task.assignedTo)}
              </div>
            </div>
          )}

          {/* 8. ETIQUETAS */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Tag size={11} /> Etiquetas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-xs font-medium border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 9. INFORMACIÓN DE COMPLETADO */}
          {isCompleted && task.completedAt && (
            <div
              className="rounded-xl p-4 space-y-2.5"
              style={{
                backgroundColor: "rgba(22,163,74,0.06)",
                border: "1px solid rgba(22,163,74,0.2)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "#16a34a" }}
              >
                <Check size={11} /> Información de completado
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span
                    className="text-[11px] w-28 font-medium flex-shrink-0 pt-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Completada por
                  </span>
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {resolveName(task.completedBy)}
                  </span>
                </div>
                {task.performedBy && task.performedBy !== task.completedBy && (
                  <div className="flex items-start gap-3">
                    <span
                      className="text-[11px] w-28 font-medium flex-shrink-0 pt-0.5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Realizada por
                    </span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {resolveName(task.performedBy)}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span
                    className="text-[11px] w-28 font-medium flex-shrink-0 pt-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Fecha y hora
                  </span>
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {new Date(task.completedAt).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {" a las "}
                    {new Date(task.completedAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 10. HISTORIAL DE ACTIVIDAD */}
          {task.history && task.history.length > 0 && (
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Clock size={11} /> Historial de actividad
              </p>
              <div>
                {[...task.history].reverse().map((entry, i) => {
                  const name =
                    entry.performedByName || resolveName(entry.performedBy);
                  const date = new Date(entry.performedAt);
                  const isCompletion = entry.action === "completed";
                  return (
                    <div
                      key={entry.id || i}
                      className="flex gap-3 py-2.5 border-b last:border-0"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <div
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                        style={{
                          backgroundColor: isCompletion
                            ? "rgba(22,163,74,0.12)"
                            : "var(--bg-secondary)",
                        }}
                      >
                        {isCompletion ? (
                          <Check size={10} style={{ color: "#16a34a" }} />
                        ) : (
                          <Clock
                            size={9}
                            style={{ color: "var(--text-tertiary)" }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12px] leading-snug"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <span className="font-semibold">{name}</span>{" "}
                          {entry.details ||
                            (entry.action === "created"
                              ? "creó la tarea"
                              : entry.action === "reopened"
                                ? "reabrió la tarea"
                                : entry.action === "archived"
                                  ? "archivó la tarea"
                                  : entry.action)}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {date.toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          ·{" "}
                          {date.toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 11. COMENTARIOS */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide mb-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Comentarios
            </p>
            <TaskComments
              taskId={task.id}
              listId={task.listId}
              memberNames={memberNames}
            />
          </div>

          {/* Meta — creación */}
          <div
            className="pt-2 border-t"
            style={{ borderColor: "var(--border-color)" }}
          >
            <span
              className="text-[11px] flex items-center gap-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Clock size={10} />
              Creada {timeAgo(task.createdAt)} por{" "}
              <strong className="ml-0.5">{resolveName(task.createdBy)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Delete confirm overlay ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                className="flex items-start gap-3 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: "var(--bg-error)",
                  color: "var(--text-error)",
                }}
              >
                <Trash2 size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                  ¿Eliminar "<strong>{task.title}</strong>"? Esta acción no se
                  puede deshacer.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Eliminar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ─── PORTAL RENDERING ───────────────────────────────────────────
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000]"
            style={{
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(2px)",
            }}
            onClick={onClose}
          />

          {/* Mobile: fullscreen sheet — above navbar (bottom: 64px) */}
          <div
            className="sm:hidden fixed inset-x-0 top-0 z-[9001]"
            style={{ bottom: "0px" }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 rounded-t-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{
                top: "48px",
                backgroundColor: "var(--bg-card)",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2.5 pb-0 flex-shrink-0">
                <div
                  className="w-8 h-1 rounded-full"
                  style={{ backgroundColor: "var(--border-color)" }}
                />
              </div>
              <div className="flex-1 overflow-hidden">{panelContent}</div>
            </motion.div>
          </div>

          {/* Desktop: right side panel */}
          <div className="hidden sm:block fixed inset-y-0 right-0 z-[9001] w-[400px] lg:w-[440px]">
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="h-full shadow-2xl"
              style={{
                backgroundColor: "var(--bg-card)",
                borderLeft: "1px solid var(--border-color)",
              }}
            >
              {panelContent}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
