"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
import { timeAgo } from "@/lib/utils";
import {
  X,
  Trash2,
  Archive,
  Phone,
  MapPin,
  Check,
  CheckCircle2,
  Circle,
  Tag,
  User,
  Clock,
  ChevronDown,
  Plus,
  Copy,
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
  const { updateTask, deleteTask, archiveTask, completeTask, uncompleteTask } =
    useTaskStore();

  // ── Inline editable state ──
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localLocation, setLocalLocation] = useState("");
  const [localPhones, setLocalPhones] = useState<string[]>([""]);
  const [localPriority, setLocalPriority] =
    useState<Task["priority"]>(undefined);

  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const canEdit = canEditTask(role);
  const canDelete = canDeleteTask(role);
  const canArchive = canArchiveTask(role);
  const canComplete = canCompleteTask(role);
  const canManageOptions = canManageTaskOptions(role);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const debounceSave = useCallback(
    (field: string, updates: Partial<Task>, delay = 700) => {
      if (!user) return;
      if (debounceRef.current[field]) clearTimeout(debounceRef.current[field]);
      debounceRef.current[field] = setTimeout(() => {
        updateTask(task!.id, updates, user.id, user.name);
      }, delay);
    },
    [user, task],
  );

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

  // Sync local state when task changes or panel opens
  useEffect(() => {
    if (task && isOpen) {
      setLocalTitle(task.title);
      setLocalDescription(task.description || "");
      setLocalLocation(task.location || "");
      setLocalPhones(task.phoneNumbers?.length ? [...task.phoneNumbers] : [""]);
      setLocalPriority(task.priority);
      setPriorityMenuOpen(false);
      setShowDeleteConfirm(false);
    }
  }, [task?.id, isOpen]);

  // Escape closes panel
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

  const handleCopyWhatsApp = () => {
    const lines: string[] = [];
    lines.push(`*${task.title}*`);
    if (task.description?.trim()) {
      lines.push("");
      lines.push(task.description.trim());
    }
    const validPhones = (task.phoneNumbers || []).filter((p) => p.trim());
    if (validPhones.length) {
      lines.push("");
      lines.push(`📞 ${validPhones.join(" / ")}`);
    }
    if (task.location) {
      lines.push("");
      lines.push(`📍 ${task.location}`);
      lines.push(
        `https://maps.google.com/?q=${encodeURIComponent(task.location)}`,
      );
    }
    if (task.dueDate) {
      lines.push("");
      const d = new Date(task.dueDate);
      lines.push(
        `📅 ${d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      );
    }
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => showToast("Copiado para compartir"));
  };

  const pc = localPriority ? getPriorityConfig(localPriority) : null;
  const isCompleted = task.status === "completed";

  // ─── PANEL CONTENT ─────────────────────────────────────────────
  const panelContent = (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        {/* Checkbox + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!user || !canComplete) return;
              if (isCompleted) {
                uncompleteTask(task.id, user.id);
              } else {
                completeTask(task.id, user.id, user.name, listMembers, user);
              }
            }}
            disabled={!canComplete}
            className={cn(
              "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full transition-transform",
              canComplete
                ? "cursor-pointer active:scale-90"
                : "cursor-not-allowed opacity-40",
              isCompleted ? "text-blue-500" : "text-[var(--text-muted)]",
            )}
          >
            {isCompleted ? (
              <CheckCircle2 size={26} strokeWidth={1.8} />
            ) : (
              <Circle size={26} strokeWidth={1.8} />
            )}
          </button>
          {canEdit ? (
            <input
              value={localTitle}
              onChange={(e) => {
                setLocalTitle(e.target.value);
                if (e.target.value.trim())
                  debounceSave("title", { title: e.target.value.trim() });
              }}
              className={cn(
                "flex-1 min-w-0 text-[var(--text-lg)] font-semibold leading-tight bg-transparent focus:outline-none",
                isCompleted && "line-through opacity-70",
              )}
              style={{ color: "var(--text-primary)" }}
              placeholder="Título de la tarea"
            />
          ) : (
            <h2
              className={cn(
                "text-[var(--text-lg)] font-semibold leading-tight truncate",
                isCompleted && "line-through opacity-70",
              )}
              style={{ color: "var(--text-primary)" }}
            >
              {task.title}
            </h2>
          )}
        </div>

        {/* Actions: Archivar · Eliminar · Cerrar */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {canArchive && (
            <button
              onClick={handleArchive}
              title="Archivar"
              className="p-2 rounded-lg transition-colors duration-150"
              style={{ color: "var(--text-secondary)" }}
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
              className="p-2 rounded-lg transition-colors duration-150"
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
            className="p-2 rounded-lg transition-colors duration-150 ml-0.5"
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
        <div className="px-4 py-4 space-y-4">
          {/* Properties group: description, location, phone */}
          <div className="space-y-2.5">
            {/* Description */}
            {canEdit ? (
              <div
                className="rounded-[var(--radius-lg)] overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/15 transition-all duration-150"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <AutoResizeTextarea
                  value={localDescription}
                  onChange={(v) => {
                    setLocalDescription(v);
                    debounceSave("description", {
                      description: v.trim() || undefined,
                    });
                  }}
                  placeholder="Añade una descripción..."
                  className="text-[var(--text-base)] px-3 py-2.5 w-full leading-relaxed"
                  minRows={2}
                />
              </div>
            ) : task.description ? (
              <p
                className="text-[var(--text-base)] leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {task.description}
              </p>
            ) : null}

            {/* Location + copy */}
            {(canEdit || task.location) && (
              <div
                className="flex items-center gap-2 rounded-[var(--radius-lg)] px-3 py-2"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <MapPin size={14} style={{ color: "#3b82f6" }} />
                {canEdit ? (
                  <input
                    value={localLocation}
                    onChange={(e) => {
                      setLocalLocation(e.target.value);
                      debounceSave("location", {
                        location: e.target.value.trim() || undefined,
                      });
                    }}
                    placeholder="Ubicación..."
                    className="flex-1 min-w-0 text-[var(--text-base)] bg-transparent focus:outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                ) : task.location ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(task.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 text-[var(--text-base)] hover:underline truncate"
                    style={{ color: "#3b82f6" }}
                  >
                    {task.location}
                  </a>
                ) : null}
                {task.location && (
                  <button
                    onClick={handleCopyWhatsApp}
                    title="Copiar para compartir"
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-active)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Copy size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Phones */}
            {(canEdit || task.phoneNumbers?.some((p) => p.trim())) && (
              <div className="space-y-1.5">
                {canEdit ? (
                  <>
                    {localPhones.map((phone, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="flex items-center gap-2 flex-1 rounded-[var(--radius-lg)] px-3 py-2"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                        >
                          <Phone size={14} style={{ color: "#16a34a" }} />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              const updated = [...localPhones];
                              updated[i] = e.target.value;
                              setLocalPhones(updated);
                              const valid = updated.filter((p) => p.trim());
                              debounceSave("phones", {
                                phoneNumbers: valid.length ? valid : undefined,
                              });
                            }}
                            placeholder="Teléfono"
                            className="flex-1 min-w-0 text-[var(--text-base)] bg-transparent focus:outline-none"
                            style={{ color: "var(--text-primary)" }}
                          />
                        </div>
                        {localPhones.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = localPhones.filter(
                                (_, j) => j !== i,
                              );
                              setLocalPhones(updated);
                              const valid = updated.filter((p) => p.trim());
                              saveField({
                                phoneNumbers: valid.length ? valid : undefined,
                              });
                            }}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: "#ef4444" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgba(239,68,68,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setLocalPhones([...localPhones, ""])}
                      className="flex items-center gap-1 text-[var(--text-xs)] font-medium px-3 py-1.5 rounded-md transition-colors"
                      style={{ color: "#2563eb" }}
                    >
                      <Plus size={12} /> Añadir teléfono
                    </button>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {task.phoneNumbers
                      ?.filter((p) => p.trim())
                      .map((p, i) => (
                        <a
                          key={i}
                          href={`tel:${p.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1 text-[var(--text-base)] hover:underline"
                          style={{ color: "#16a34a" }}
                        >
                          <Phone size={13} style={{ color: "#16a34a" }} />
                          {p}
                        </a>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            className="h-px"
            style={{ backgroundColor: "var(--border-color)" }}
          />

          {/* Date + options */}
          {canManageOptions && (
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="text-[var(--text-xs)]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Fecha
              </span>
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

          {/* Priority */}
          {(canEdit || task.priority) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[var(--text-xs)]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Prioridad
              </span>
              {canEdit ? (
                <div className="relative">
                  <button
                    onClick={() => setPriorityMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[var(--text-xs)] font-medium transition-colors border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {pc ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          pc.text,
                        )}
                      >
                        <span>{pc.emoji}</span> {pc.label}
                      </span>
                    ) : (
                      <span>Sin prioridad</span>
                    )}
                    <ChevronDown
                      size={12}
                      style={{ color: "var(--text-tertiary)" }}
                    />
                  </button>
                  <AnimatePresence>
                    {priorityMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-1 z-50 rounded-[var(--radius-lg)] shadow-[var(--shadow-dropdown)] overflow-hidden min-w-[160px]"
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
                                setLocalPriority(p);
                                setPriorityMenuOpen(false);
                                saveField({ priority: p });
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 text-[var(--text-sm)] transition-colors"
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
                                    "inline-flex items-center gap-1.5 font-medium",
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
                              {localPriority === p && (
                                <Check size={12} className="text-blue-500" />
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : pc ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[var(--text-xs)] font-medium",
                    pc.text,
                  )}
                >
                  <span>{pc.emoji}</span> {pc.label}
                </span>
              ) : null}
            </div>
          )}

          {/* Assigned + Tags */}
          {(task.assignedTo || (task.tags && task.tags.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2">
              {task.assignedTo && (
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[var(--text-xs)] font-medium border"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <User size={11} />
                  {resolveName(task.assignedTo)}
                </span>
              )}
              {task.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full text-[var(--text-xs)] font-medium border"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Completion info */}
          {isCompleted && task.completedAt && (
            <div
              className="rounded-[var(--radius-lg)] p-3 space-y-1.5"
              style={{
                backgroundColor: "rgba(22,163,74,0.06)",
                border: "1px solid rgba(22,163,74,0.15)",
              }}
            >
              <div
                className="flex items-center gap-1.5 text-[var(--text-xs)] font-medium"
                style={{ color: "#16a34a" }}
              >
                <Check size={11} /> Completada
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[var(--text-sm)]">
                  <span style={{ color: "var(--text-tertiary)" }}>Por</span>
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {resolveName(task.completedBy)}
                  </span>
                </div>
                {task.performedBy && task.performedBy !== task.completedBy && (
                  <div className="flex items-center gap-2 text-[var(--text-sm)]">
                    <span style={{ color: "var(--text-tertiary)" }}>
                      Realizada por
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {resolveName(task.performedBy)}
                    </span>
                  </div>
                )}
                <div
                  className="text-[var(--text-xs)]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {new Date(task.completedAt).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {" · "}
                  {new Date(task.completedAt).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-2">
            <p
              className="text-[var(--text-xs)] font-medium"
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

          {/* History */}
          {task.history && task.history.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-[var(--text-xs)] font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                Historial
              </p>
              <div>
                {[...task.history]
                  .reverse()
                  .slice(0, 20)
                  .map((entry, i) => {
                    const name =
                      entry.performedByName || resolveName(entry.performedBy);
                    const date = new Date(entry.performedAt);
                    const isCompletion = entry.action === "completed";
                    return (
                      <div
                        key={entry.id || i}
                        className="flex gap-2 py-2 border-b last:border-0"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <div
                          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                          style={{
                            backgroundColor: isCompletion
                              ? "rgba(22,163,74,0.12)"
                              : "var(--bg-secondary)",
                          }}
                        >
                          {isCompletion ? (
                            <Check size={8} style={{ color: "#16a34a" }} />
                          ) : (
                            <Clock
                              size={8}
                              style={{ color: "var(--text-tertiary)" }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[var(--text-sm)] leading-snug"
                            style={{ color: "var(--text-primary)" }}
                          >
                            <span className="font-medium">{name}</span>{" "}
                            {entry.details ||
                              (entry.action === "created"
                                ? "creó"
                                : entry.action === "reopened"
                                  ? "reabrió"
                                  : entry.action === "archived"
                                    ? "archivó"
                                    : entry.action)}
                          </p>
                          <p
                            className="text-[var(--text-2xs)] mt-0.5"
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

          {/* Meta — creation */}
          <div
            className="pt-2 border-t"
            style={{ borderColor: "var(--border-color)" }}
          >
            <span
              className="text-[var(--text-2xs)] flex items-center gap-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <Clock size={10} />
              Creada {timeAgo(task.createdAt)} por{" "}
              <strong
                className="font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {resolveName(task.createdBy)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-lg text-[var(--text-sm)] font-medium shadow-[var(--shadow-toast)] flex items-center gap-2"
            style={{
              backgroundColor: "#1e293b",
              color: "#f8fafc",
              whiteSpace: "nowrap",
            }}
          >
            <Check size={13} style={{ color: "#4ade80" }} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm overlay ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{
              backgroundColor: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(3px)",
            }}
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              className="w-full max-w-sm rounded-[var(--radius-lg)] p-4 space-y-3 shadow-[var(--shadow-modal)]"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] text-[var(--text-sm)]"
                style={{
                  backgroundColor: "var(--bg-error)",
                  color: "var(--text-error)",
                }}
              >
                <Trash2 size={15} className="flex-shrink-0 mt-0.5" />
                <p>
                  ¿Eliminar "<strong>{task.title}</strong>"? No se puede
                  deshacer.
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
              className="absolute inset-x-0 bottom-0 rounded-t-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-modal)] flex flex-col"
              style={{
                top: "40px",
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
              className="h-full shadow-[var(--shadow-panel)]"
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
