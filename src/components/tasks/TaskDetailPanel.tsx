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
} from "@/lib/permissions";
import TaskOptionsBar from "./TaskOptionsBar";
import TaskComments from "./TaskComments";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import Button from "@/components/ui/Button";
import { getPriorityConfig } from "@/lib/priority";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { timeAgo } from "@/lib/utils";
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
  Save,
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

  // ── Single global edit mode ──
  const [editMode, setEditMode] = useState(false);

  // ── Draft state (only committed on "Guardar cambios") ──
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftPhones, setDraftPhones] = useState<string[]>([""]);
  const [draftPriority, setDraftPriority] =
    useState<Task["priority"]>(undefined);

  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
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

  // Reset draft & close edit mode when task changes or panel opens
  useEffect(() => {
    if (task && isOpen) {
      setDraftTitle(task.title);
      setDraftDescription(task.description || "");
      setDraftLocation(task.location || "");
      setDraftPhones(task.phoneNumbers?.length ? [...task.phoneNumbers] : [""]);
      setDraftPriority(task.priority);
      setEditMode(false);
      setPriorityMenuOpen(false);
      setShowDeleteConfirm(false);
    }
  }, [task?.id, isOpen]);

  // Auto-focus title input when edit mode activates
  useEffect(() => {
    if (editMode && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editMode]);

  // Escape closes panel (or exits edit mode first)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editMode) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, onClose]);

  if (!task) return null;

  // Enter edit mode — copy current task values into draft
  const handleEnterEdit = () => {
    setDraftTitle(task.title);
    setDraftDescription(task.description || "");
    setDraftLocation(task.location || "");
    setDraftPhones(task.phoneNumbers?.length ? [...task.phoneNumbers] : [""]);
    setDraftPriority(task.priority);
    setEditMode(true);
  };

  // Cancel — discard all drafts
  const handleCancelEdit = () => {
    setDraftTitle(task.title);
    setDraftDescription(task.description || "");
    setDraftLocation(task.location || "");
    setDraftPhones(task.phoneNumbers?.length ? [...task.phoneNumbers] : [""]);
    setDraftPriority(task.priority);
    setEditMode(false);
    setPriorityMenuOpen(false);
  };

  // Save — commit all drafts at once
  const handleSaveEdit = async () => {
    if (!user || !draftTitle.trim()) return;
    setIsSaving(true);
    try {
      const updates: Partial<Task> = {};
      if (draftTitle.trim() !== task.title) updates.title = draftTitle.trim();
      if (draftDescription !== (task.description || ""))
        updates.description = draftDescription.trim() || undefined;
      if (draftLocation !== (task.location || ""))
        updates.location = draftLocation.trim() || undefined;
      const validPhones = draftPhones.filter((p) => p.trim());
      const currentPhones = task.phoneNumbers || [];
      if (JSON.stringify(validPhones) !== JSON.stringify(currentPhones))
        updates.phoneNumbers = validPhones.length ? validPhones : undefined;
      if (draftPriority !== task.priority) updates.priority = draftPriority;
      if (Object.keys(updates).length > 0)
        await updateTask(task.id, updates, user.id, user.name);
      setEditMode(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Immediate saves for options bar (due date, reminders, recurrence)
  const saveField = async (updates: Partial<Task>) => {
    if (!user) return;
    await updateTask(task.id, updates, user.id, user.name);
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

  const pc = draftPriority ? getPriorityConfig(draftPriority) : null;
  const isCompleted = task.status === "completed";

  // ─── PANEL CONTENT ─────────────────────────────────────────────
  const panelContent = (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        {/* Left: status badge / edit-mode action buttons */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isCompleted && !editMode && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 flex-shrink-0">
              ✓ Completada
            </span>
          )}
          {editMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <X size={12} /> Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving || !draftTitle.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background:
                    isSaving || !draftTitle.trim()
                      ? "var(--bg-secondary)"
                      : "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  color:
                    isSaving || !draftTitle.trim()
                      ? "var(--text-tertiary)"
                      : "#fff",
                  boxShadow:
                    isSaving || !draftTitle.trim()
                      ? "none"
                      : "0 2px 8px rgba(37,99,235,0.35)",
                }}
              >
                {isSaving ? (
                  "Guardando..."
                ) : (
                  <>
                    <Save size={12} /> Guardar cambios
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: Archivar · Editar · Eliminar · Cerrar */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {canArchive && !editMode && (
            <button
              onClick={handleArchive}
              title="Archivar"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <Archive size={13} />
              <span className="hidden sm:inline">Archivar</span>
            </button>
          )}
          {canEdit && !isCompleted && !editMode && (
            <button
              onClick={handleEnterEdit}
              title="Editar"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                color: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.1)",
              }}
            >
              <Edit2 size={13} />
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}
          {canDelete && !editMode && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Eliminar"
              className="p-2 rounded-xl transition-all"
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
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all ml-0.5"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X size={17} />
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
            {editMode ? (
              <input
                ref={titleInputRef}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full text-xl font-semibold px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-primary)",
                }}
                placeholder="Título de la tarea"
              />
            ) : (
              <h2
                className={cn(
                  "text-xl font-semibold leading-snug",
                  isCompleted && "line-through opacity-60",
                )}
                style={{ color: "var(--text-primary)" }}
              >
                {task.title}
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
            {editMode ? (
              <div
                className="rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/40 transition-all"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1.5px solid var(--border-color)",
                }}
              >
                <AutoResizeTextarea
                  value={draftDescription}
                  onChange={setDraftDescription}
                  placeholder="Añade una descripción..."
                  className="text-sm px-4 py-3 w-full"
                  minRows={3}
                />
              </div>
            ) : (
              <div
                className="text-sm rounded-2xl px-4 py-3 min-h-[44px] leading-relaxed"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: task.description
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                }}
              >
                {task.description || "Sin descripción"}
              </div>
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
            {editMode ? (
              <input
                value={draftLocation}
                onChange={(e) => setDraftLocation(e.target.value)}
                placeholder="Añade una dirección o lugar..."
                className="w-full text-sm rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-primary)",
                }}
              />
            ) : (
              <div
                className="text-sm rounded-2xl px-4 py-3 min-h-[44px] flex items-center"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                {task.location ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(task.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                    style={{ color: "#3b82f6" }}
                  >
                    <MapPin size={13} style={{ color: "#3b82f6" }} />
                    {task.location}
                  </a>
                ) : (
                  <span style={{ color: "var(--text-tertiary)" }}>
                    Sin ubicación
                  </span>
                )}
              </div>
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
            {editMode ? (
              <div className="space-y-2">
                {draftPhones.map((phone, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const u = [...draftPhones];
                        u[i] = e.target.value;
                        setDraftPhones(u);
                      }}
                      placeholder={`Teléfono ${i + 1}`}
                      className="flex-1 text-sm rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        border: "1.5px solid var(--border-color)",
                        color: "var(--text-primary)",
                      }}
                    />
                    {draftPhones.length > 1 && (
                      <button
                        onClick={() =>
                          setDraftPhones(
                            draftPhones.filter((_, j: number) => j !== i),
                          )
                        }
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.08)",
                          color: "#ef4444",
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setDraftPhones([...draftPhones, ""])}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                  style={{
                    color: "#2563eb",
                    backgroundColor: "rgba(37,99,235,0.08)",
                  }}
                >
                  <Plus size={12} /> Añadir teléfono
                </button>
              </div>
            ) : (
              <div
                className="text-sm rounded-2xl px-4 py-3 min-h-[44px]"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                {task.phoneNumbers?.filter((p) => p.trim()).length ? (
                  <div className="space-y-1.5">
                    {task.phoneNumbers
                      .filter((p) => p.trim())
                      .map((p, i) => (
                        <a
                          key={i}
                          href={`tel:${p.replace(/\s/g, "")}`}
                          className="flex items-center gap-2 hover:underline"
                          style={{ color: "#16a34a" }}
                        >
                          <Phone size={13} style={{ color: "#16a34a" }} />
                          {p}
                        </a>
                      ))}
                  </div>
                ) : (
                  <span style={{ color: "var(--text-tertiary)" }}>
                    Sin teléfonos
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 5. PRIORIDAD */}
          {(canEdit || task.priority) && (
            <div className="relative">
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                Prioridad
              </p>
              {editMode ? (
                <div className="relative">
                  <button
                    onClick={() => setPriorityMenuOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      border: "1.5px solid var(--border-color)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {pc ? (
                      <span
                        className={cn(
                          "flex items-center gap-2 font-semibold",
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
                      size={15}
                      style={{ color: "var(--text-tertiary)" }}
                    />
                  </button>
                  <AnimatePresence>
                    {priorityMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl shadow-2xl overflow-hidden"
                        style={{
                          backgroundColor: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        {(
                          [
                            undefined,
                            "low",
                            "medium",
                            "high",
                            "urgent",
                          ] as const
                        ).map((p) => {
                          const cfg = p ? getPriorityConfig(p) : null;
                          return (
                            <button
                              key={p ?? "none"}
                              onClick={() => {
                                setDraftPriority(p);
                                setPriorityMenuOpen(false);
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors"
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
                                    "flex items-center gap-2 font-semibold",
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
                              {draftPriority === p && (
                                <Check size={14} className="text-blue-500" />
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div
                  className="text-sm rounded-2xl px-4 py-3"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  {pc ? (
                    <span
                      className={cn(
                        "flex items-center gap-2 font-semibold",
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
                </div>
              )}
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
                onDropdownOpenChange={() => {}}
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
