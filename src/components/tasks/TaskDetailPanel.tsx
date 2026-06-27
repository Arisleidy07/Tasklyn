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
import { Task, MemberRole, TaskHistoryEntry } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canEditTask, canDeleteTask, canArchiveTask } from "@/lib/permissions";
import TaskComments from "./TaskComments";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import Button from "@/components/ui/Button";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { timeAgo } from "@/lib/utils";
import { subscribeToTaskHistory } from "@/lib/firestore";
import {
  X,
  Trash2,
  Archive,
  Phone,
  MapPin,
  Check,
  FileText,
  CalendarDays,
  Clock,
  Bell,
  User,
  MessageSquare,
  History,
  Copy,
  ExternalLink,
  MessageCircle,
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

function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, "");
}

function copyToClipboard(text: string, showToast: (msg: string) => void) {
  navigator.clipboard.writeText(text).then(() => showToast("Copiado"));
}

function formatHistoryAction(action: TaskHistoryEntry["action"]): {
  label: string;
  showDiff: boolean;
} {
  switch (action) {
    case "title_changed":
      return { label: "cambió el título", showDiff: true };
    case "description_changed":
      return { label: "cambió la descripción", showDiff: true };
    case "location_changed":
      return { label: "cambió la ubicación", showDiff: true };
    case "phones_changed":
      return { label: "cambió el teléfono", showDiff: true };
    case "due_date_changed":
      return { label: "cambió la fecha", showDiff: true };
    case "reminder_set":
      return { label: "cambió el recordatorio", showDiff: true };
    case "assigned":
      return { label: "cambió la asignación", showDiff: true };
    case "completed":
      return { label: "completó la tarea", showDiff: false };
    case "reopened":
      return { label: "reabrió la tarea", showDiff: false };
    case "archived":
      return { label: "archivó la tarea", showDiff: false };
    case "restored":
      return { label: "restauró la tarea", showDiff: false };
    case "created":
      return { label: "creó la tarea", showDiff: false };
    default:
      return { label: "actualizó la tarea", showDiff: false };
  }
}

function formatHistoryValue(
  action: TaskHistoryEntry["action"],
  value?: string,
): string {
  if (value === undefined || value === null) return "—";
  if (value === "") return "—";
  return value;
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDateLabel(dateStr?: string | null): string {
  if (!dateStr) return "Sin fecha";
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff > 1 && diff < 7)
    return d.toLocaleDateString("es-ES", { weekday: "long" });
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(timeStr?: string | null): string | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":");
  if (!h || !m) return timeStr;
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function formatReminderLabel(at?: string): string | null {
  if (!at) return null;
  const d = new Date(at);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const dayLabel =
    diff === 0
      ? "Hoy"
      : diff === 1
        ? "Mañana"
        : d.toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
  const time = d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${dayLabel} ${time}`;
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function genReminderId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function reminderQuickOptions() {
  const now = new Date();
  const later = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const tonight = new Date(now);
  tonight.setHours(20, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);
  return [
    { label: "Más tarde", value: later.toISOString() },
    { label: "Esta noche", value: tonight.toISOString() },
    { label: "Mañana", value: tomorrow.toISOString() },
    { label: "Próxima semana", value: nextWeek.toISOString() },
  ];
}

function Section({
  icon,
  label,
  children,
  action,
  dense,
}: {
  icon: React.ReactNode;
  label?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <div className={cn("flex items-start", dense ? "gap-2" : "gap-3")}>
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        {label && (
          <p
            className="text-[var(--text-xs)] font-medium mb-1"
            style={{ color: "var(--text-tertiary)" }}
          >
            {label}
          </p>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

function IconButton({
  onClick,
  icon,
  title,
  href,
  color = "var(--text-tertiary)",
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  title: string;
  href?: string;
  color?: string;
}) {
  const className =
    "p-1.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)]";
  const style = { color };
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        title={title}
        onClick={(e) => e.stopPropagation()}
      >
        {icon}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={className} style={style} title={title}>
      {icon}
    </button>
  );
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

  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localLocation, setLocalLocation] = useState("");
  const [localPhones, setLocalPhones] = useState<string[]>([""]);
  const [localAssignedTo, setLocalAssignedTo] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [history, setHistory] = useState<TaskHistoryEntry[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const pendingSaveRef = useRef<{
    field: string;
    timer: ReturnType<typeof setTimeout>;
    updates: Partial<Task>;
  } | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const reminderInputRef = useRef<HTMLInputElement>(null);

  const canEdit = canEditTask(role);
  const canDelete = canDeleteTask(role);
  const canArchive = canArchiveTask(role);
  const isCompleted = task?.status === "completed";

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const queueSave = useCallback(
    (field: string, updates: Partial<Task>, delay = 700) => {
      if (!user || !task) return;
      if (pendingSaveRef.current) clearTimeout(pendingSaveRef.current.timer);
      pendingSaveRef.current = {
        field,
        timer: setTimeout(() => {
          updateTask(task.id, updates, user.id, user.name);
          pendingSaveRef.current = null;
        }, delay),
        updates,
      };
    },
    [user, task, updateTask],
  );

  const flushPending = useCallback(() => {
    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current.timer);
      const { updates } = pendingSaveRef.current;
      pendingSaveRef.current = null;
      if (user && task) updateTask(task.id, updates, user.id, user.name);
    }
  }, [user, task, updateTask]);

  // Resolve user names
  const userIdsToResolve = useMemo(() => {
    if (!task) return [];
    const ids = new Set<string>();
    if (task.createdBy) ids.add(task.createdBy);
    if (task.completedBy) ids.add(task.completedBy);
    if (task.performedBy) ids.add(task.performedBy);
    if (task.assignedTo) ids.add(task.assignedTo);
    history.forEach((h) => {
      if (h.performedBy) ids.add(h.performedBy);
    });
    return Array.from(ids);
  }, [task?.id, history, task?.completedBy]);

  const { getProfile } = useUserProfiles(userIdsToResolve);

  const resolveName = useCallback(
    (uid: string | null | undefined, fallback?: string): string => {
      if (!uid) return fallback || "—";
      if (user && uid === user.id) return user.name;
      return memberNames[uid] || getProfile(uid).name || fallback || uid;
    },
    [user, memberNames, getProfile],
  );

  // Sync local state when task or panel opens
  useEffect(() => {
    if (task && isOpen) {
      setLocalTitle(task.title);
      setLocalDescription(task.description || "");
      setLocalLocation(task.location || "");
      setLocalPhones(task.phoneNumbers?.length ? [...task.phoneNumbers] : [""]);
      setLocalAssignedTo(task.assignedTo || null);
      setShowDeleteConfirm(false);
      setAssignOpen(false);
    }
  }, [task?.id, isOpen]);

  // Flush pending saves when closing
  useEffect(() => {
    if (!isOpen) {
      flushPending();
    }
  }, [isOpen, flushPending]);

  // Lock body scroll
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

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Subscribe to history subcollection
  useEffect(() => {
    if (!task?.id || !isOpen) return;
    const unsubscribe = subscribeToTaskHistory(task.id, (entries) => {
      setHistory(entries);
    });
    return () => unsubscribe();
  }, [task?.id, isOpen]);

  if (!task) return null;

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const handleArchive = () => {
    if (!user) return;
    archiveTask(task.id, user.id);
    onClose();
  };

  const handleCopyTask = () => {
    const lines: string[] = [];
    lines.push(`*${task.title}*`);
    if (task.description?.trim()) {
      lines.push("", task.description.trim());
    }
    const validPhones = (task.phoneNumbers || []).filter((p) => p.trim());
    if (validPhones.length) {
      lines.push("", `📞 ${validPhones.join(" / ")}`);
    }
    if (task.location) {
      lines.push("", `📍 ${task.location}`);
    }
    if (task.dueDate) {
      lines.push(
        "",
        `📅 ${new Date(task.dueDate).toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
      );
    }
    copyToClipboard(lines.join("\n"), showToast);
  };

  const handleTitleChange = (value: string) => {
    setLocalTitle(value);
    if (value.trim()) {
      queueSave("title", { title: value.trim() });
    }
  };

  const handleDescriptionChange = (value: string) => {
    setLocalDescription(value);
    queueSave("description", {
      description: value.trim() || undefined,
    });
  };

  const handleLocationChange = (value: string) => {
    setLocalLocation(value);
    queueSave("location", {
      location: value.trim() || undefined,
    });
  };

  const handlePhoneChange = (index: number, value: string) => {
    const updated = [...localPhones];
    updated[index] = value;
    setLocalPhones(updated);
    const valid = updated.filter((p) => p.trim());
    queueSave("phones", {
      phoneNumbers: valid.length ? valid : undefined,
    });
  };

  const handleAddPhone = () => {
    setLocalPhones([...localPhones, ""]);
  };

  const handleRemovePhone = (index: number) => {
    const updated = localPhones.filter((_, i) => i !== index);
    setLocalPhones(updated.length ? updated : [""]);
    const valid = updated.filter((p) => p.trim());
    queueSave("phones", {
      phoneNumbers: valid.length ? valid : undefined,
    });
  };

  const handleAssignedChange = (userId: string | null) => {
    setLocalAssignedTo(userId);
    setAssignOpen(false);
    queueSave("assignedTo", {
      assignedTo: userId || null,
    });
  };

  const handleQuickDate = (date: string | null) => {
    queueSave("dueDate", {
      dueDate: date || null,
      dueTime: date ? task.dueTime || null : null,
    });
  };

  const handleTimeChange = (time: string) => {
    queueSave("dueTime", {
      dueTime: time || null,
    });
  };

  const handleQuickReminder = (at: string) => {
    const reminder: import("@/types").TaskReminder = {
      id: genReminderId(),
      at,
      sent: false,
      recipientType: "me",
    };
    queueSave("reminders", { reminders: [reminder] });
  };

  const handleCustomReminder = (value: string) => {
    if (!value) return;
    const reminder: import("@/types").TaskReminder = {
      id: genReminderId(),
      at: new Date(value).toISOString(),
      sent: false,
      recipientType: "me",
    };
    queueSave("reminders", { reminders: [reminder] });
  };

  const handleClearReminder = () => {
    queueSave("reminders", { reminders: undefined });
  };

  const assignedName = localAssignedTo ? resolveName(localAssignedTo) : null;
  const assignOptions = useMemo(() => {
    const options = [{ userId: "", name: "Sin asignar" }];
    (listMembers || []).forEach((m) => {
      options.push({ userId: m.userId, name: resolveName(m.userId) });
    });
    return options;
  }, [listMembers, resolveName]);

  // ─── PANEL CONTENT ─────────────────────────────────────────────
  const panelContent = (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* Header actions */}
      <div
        className="flex-shrink-0 flex items-center justify-end gap-0.5 px-4 py-3 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <button
          onClick={handleCopyTask}
          title="Copiar para compartir"
          className="p-2 rounded-lg transition-colors duration-150 hover:bg-[var(--bg-secondary)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <Copy size={16} />
        </button>
        {canArchive && (
          <button
            onClick={handleArchive}
            title="Archivar"
            className="p-2 rounded-lg transition-colors duration-150 hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <Archive size={16} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Eliminar"
            className="p-2 rounded-lg transition-colors duration-150 hover:bg-red-50 hover:text-red-500"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors duration-150 ml-0.5 hover:bg-[var(--bg-secondary)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
        }}
      >
        <div className="px-4 py-5 space-y-5">
          {/* Title */}
          <div className="flex items-start gap-3">
            {canEdit ? (
              <div
                className="flex-1 rounded-[var(--radius-lg)] border focus-within:border-[var(--border-input-focus)] focus-within:ring-2 focus-within:ring-[var(--border-input-focus)]/15 transition-all overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-input)",
                }}
              >
                <input
                  value={localTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={flushPending}
                  className="w-full bg-transparent px-3 py-2.5 focus:outline-none text-[var(--text-xl)] font-bold leading-tight placeholder:text-[var(--text-muted)]"
                  style={{ color: "var(--text-primary)" }}
                  placeholder="Título de la tarea"
                />
              </div>
            ) : (
              <h2
                className="flex-1 text-[var(--text-xl)] font-bold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Description */}
          {(canEdit || task.description) && (
            <Section
              icon={
                <FileText size={16} style={{ color: "var(--text-tertiary)" }} />
              }
              label="Descripción"
            >
              {canEdit ? (
                <div
                  className="rounded-[var(--radius-lg)] border overflow-hidden focus-within:border-[var(--border-input-focus)] focus-within:ring-2 focus-within:ring-[var(--border-input-focus)]/15 transition-all"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-input)",
                  }}
                >
                  <AutoResizeTextarea
                    value={localDescription}
                    onChange={handleDescriptionChange}
                    onBlur={flushPending}
                    placeholder="Añade una descripción..."
                    className="text-[var(--text-base)] px-3 py-2.5 w-full leading-relaxed bg-transparent"
                    minRows={2}
                  />
                </div>
              ) : (
                <p
                  className="text-[var(--text-base)] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {task.description}
                </p>
              )}
            </Section>
          )}

          {/* Phones */}
          {(canEdit || task.phoneNumbers?.some((p) => p.trim())) && (
            <Section
              icon={
                <Phone size={16} style={{ color: "var(--text-success)" }} />
              }
              label="Teléfono"
            >
              <div className="space-y-2">
                {canEdit ? (
                  <>
                    {localPhones.map((phone, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="flex items-center gap-2 flex-1 rounded-[var(--radius-lg)] border px-3 py-2 focus-within:border-[var(--border-input-focus)] focus-within:ring-2 focus-within:ring-[var(--border-input-focus)]/15 transition-all"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            borderColor: "var(--border-input)",
                          }}
                        >
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) =>
                              handlePhoneChange(i, e.target.value)
                            }
                            onBlur={flushPending}
                            placeholder="809-555-5555"
                            className="flex-1 min-w-0 text-[var(--text-base)] bg-transparent focus:outline-none"
                            style={{ color: "var(--text-primary)" }}
                          />
                        </div>
                        <div className="flex items-center gap-0.5">
                          <IconButton
                            icon={<Copy size={14} />}
                            title="Copiar"
                            onClick={() => {
                              if (phone.trim())
                                copyToClipboard(phone.trim(), showToast);
                            }}
                          />
                          <IconButton
                            icon={<Phone size={14} />}
                            title="Llamar"
                            href={
                              phone.trim()
                                ? `tel:${phone.trim().replace(/\s/g, "")}`
                                : undefined
                            }
                          />
                          <IconButton
                            icon={<MessageCircle size={14} />}
                            title="WhatsApp"
                            href={
                              phone.trim()
                                ? `https://wa.me/${formatPhoneForWhatsApp(phone.trim())}`
                                : undefined
                            }
                            color="var(--text-success)"
                          />
                          {localPhones.length > 1 && (
                            <IconButton
                              icon={<X size={14} />}
                              title="Eliminar"
                              onClick={() => handleRemovePhone(i)}
                              color="var(--text-error)"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleAddPhone}
                      className="flex items-center gap-1 text-[var(--text-xs)] font-medium px-2 py-1 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
                      style={{ color: "var(--text-link)" }}
                    >
                      <Plus size={12} /> Añadir teléfono
                    </button>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {task.phoneNumbers
                      ?.filter((p) => p.trim())
                      .map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 rounded-[var(--radius-lg)] border px-3 py-2"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            borderColor: "var(--border-input)",
                          }}
                        >
                          <span style={{ color: "var(--text-primary)" }}>
                            {p}
                          </span>
                          <div className="flex items-center gap-0.5 ml-1">
                            <IconButton
                              icon={<Copy size={14} />}
                              title="Copiar"
                              onClick={() =>
                                copyToClipboard(p.trim(), showToast)
                              }
                            />
                            <IconButton
                              icon={<Phone size={14} />}
                              title="Llamar"
                              href={`tel:${p.trim().replace(/\s/g, "")}`}
                            />
                            <IconButton
                              icon={<MessageCircle size={14} />}
                              title="WhatsApp"
                              href={`https://wa.me/${formatPhoneForWhatsApp(p.trim())}`}
                              color="var(--text-success)"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Location */}
          {(canEdit || task.location) && (
            <Section
              icon={<MapPin size={16} style={{ color: "var(--text-info)" }} />}
              label="Ubicación"
              action={
                task.location && (
                  <div className="flex items-center gap-0.5">
                    <IconButton
                      icon={<Copy size={14} />}
                      title="Copiar dirección"
                      onClick={() =>
                        copyToClipboard(task.location || "", showToast)
                      }
                    />
                    <IconButton
                      icon={<ExternalLink size={14} />}
                      title="Abrir en Google Maps"
                      href={`https://maps.google.com/?q=${encodeURIComponent(task.location || "")}`}
                      color="var(--text-info)"
                    />
                  </div>
                )
              }
            >
              {canEdit ? (
                <div
                  className="flex items-center gap-2 rounded-[var(--radius-lg)] border px-3 py-2 focus-within:border-[var(--border-input-focus)] focus-within:ring-2 focus-within:ring-[var(--border-input-focus)]/15 transition-all"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-input)",
                  }}
                >
                  <input
                    value={localLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onBlur={flushPending}
                    placeholder="Añade una ubicación..."
                    className="flex-1 min-w-0 text-[var(--text-base)] bg-transparent focus:outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              ) : task.location ? (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(task.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-base)] hover:underline"
                  style={{ color: "var(--text-info)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.location}
                </a>
              ) : null}
            </Section>
          )}

          {/* Reminder */}
          {(canEdit || (task.reminders && task.reminders.length > 0)) && (
            <Section
              icon={<Bell size={16} style={{ color: "var(--text-warning)" }} />}
              label="Recordatorio"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 rounded-[var(--radius-lg)] border px-3 py-2"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-input)",
                    }}
                  >
                    <span
                      style={{
                        color: task.reminders?.[0]
                          ? "var(--text-primary)"
                          : "var(--text-tertiary)",
                      }}
                    >
                      {task.reminders?.[0]
                        ? formatReminderLabel(task.reminders[0].at)
                        : "Sin recordatorio"}
                    </span>
                  </div>
                  {canEdit && task.reminders?.[0] && (
                    <IconButton
                      icon={<X size={14} />}
                      title="Eliminar recordatorio"
                      onClick={handleClearReminder}
                      color="var(--text-error)"
                    />
                  )}
                </div>
                {canEdit && (
                  <div className="flex flex-wrap items-center gap-2">
                    {reminderQuickOptions().map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => handleQuickReminder(opt.value)}
                        className="px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-xs)] font-medium transition-colors hover:opacity-90"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <div className="relative">
                      <button
                        onClick={() => reminderInputRef.current?.showPicker?.()}
                        className="px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-xs)] font-medium transition-colors hover:opacity-90"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-link)",
                        }}
                      >
                        Personalizado
                      </button>
                      <input
                        ref={reminderInputRef}
                        type="datetime-local"
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        onChange={(e) => {
                          if (e.target.value)
                            handleCustomReminder(e.target.value);
                        }}
                        onBlur={flushPending}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Date */}
          <Section
            icon={
              <CalendarDays
                size={16}
                style={{ color: "var(--text-tertiary)" }}
              />
            }
            label="Fecha"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 flex items-center gap-2 rounded-[var(--radius-lg)] border px-3 py-2"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-input)",
                  }}
                >
                  <span style={{ color: "var(--text-primary)" }}>
                    {formatDateLabel(task.dueDate)}
                  </span>
                  {task.dueDate && (
                    <input
                      type="time"
                      value={task.dueTime || ""}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      onBlur={flushPending}
                      className="text-[var(--text-sm)] bg-transparent border-l focus:outline-none px-2"
                      style={{
                        borderColor: "var(--border-color)",
                        color: "var(--text-secondary)",
                      }}
                    />
                  )}
                </div>
                {canEdit && task.dueDate && (
                  <IconButton
                    icon={<X size={14} />}
                    title="Eliminar fecha"
                    onClick={() => handleQuickDate(null)}
                    color="var(--text-error)"
                  />
                )}
              </div>
              {canEdit && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleQuickDate(toISODate(new Date()))}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-xs)] font-medium transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      handleQuickDate(toISODate(d));
                    }}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-xs)] font-medium transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Mañana
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      handleQuickDate(toISODate(d));
                    }}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-xs)] font-medium transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Próxima semana
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => dateInputRef.current?.showPicker?.()}
                      className="px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-xs)] font-medium transition-colors hover:opacity-90"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-link)",
                      }}
                    >
                      Personalizado
                    </button>
                    <input
                      ref={dateInputRef}
                      type="date"
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      value={task.dueDate || ""}
                      onChange={(e) => handleQuickDate(e.target.value || null)}
                      onBlur={flushPending}
                    />
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Assigned */}
          <Section
            icon={<User size={16} style={{ color: "var(--text-tertiary)" }} />}
            label="Asignado"
          >
            <div className="relative">
              {canEdit ? (
                <button
                  onClick={() => setAssignOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-lg)] border text-[var(--text-base)] transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-input)",
                    color: "var(--text-primary)",
                  }}
                >
                  {assignedName ? (
                    <>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          backgroundColor: "var(--text-link)",
                          color: "var(--text-inverse)",
                        }}
                      >
                        {assignedName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      {assignedName}
                    </>
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>
                      Sin asignar
                    </span>
                  )}
                  <ChevronDown
                    size={14}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </button>
              ) : assignedName ? (
                <div className="flex items-center gap-2 text-[var(--text-base)]">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      backgroundColor: "var(--text-link)",
                      color: "var(--text-inverse)",
                    }}
                  >
                    {assignedName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  {assignedName}
                </div>
              ) : (
                <span style={{ color: "var(--text-tertiary)" }}>
                  Sin asignar
                </span>
              )}
              <AnimatePresence>
                {assignOpen && canEdit && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 top-full mt-1 z-50 rounded-[var(--radius-lg)] shadow-[var(--shadow-dropdown)] overflow-hidden min-w-[180px]"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    {assignOptions.map((opt) => (
                      <button
                        key={opt.userId || "none"}
                        onClick={() => handleAssignedChange(opt.userId || null)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[var(--text-sm)] transition-colors hover:bg-[var(--bg-secondary)]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {opt.userId && (
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{
                              backgroundColor: "var(--text-link)",
                              color: "var(--text-inverse)",
                            }}
                          >
                            {opt.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </span>
                        )}
                        <span>{opt.name}</span>
                        {localAssignedTo === opt.userId && (
                          <Check size={12} className="ml-auto text-blue-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Section>

          {/* Divider */}
          <div
            className="h-px"
            style={{ backgroundColor: "var(--border-color)" }}
          />

          {/* Comments */}
          <Section
            icon={
              <MessageSquare
                size={16}
                style={{ color: "var(--text-tertiary)" }}
              />
            }
            label="Comentarios"
          >
            <TaskComments
              taskId={task.id}
              listId={task.listId}
              memberNames={memberNames}
            />
          </Section>

          {/* History */}
          {history.length > 0 && (
            <Section
              icon={
                <History size={16} style={{ color: "var(--text-tertiary)" }} />
              }
              label="Historial"
            >
              <div className="space-y-3">
                {history.map((entry, i) => {
                  const name =
                    entry.performedByName || resolveName(entry.performedBy);
                  const { label, showDiff } = formatHistoryAction(entry.action);
                  return (
                    <div key={entry.id || i} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                        >
                          <History
                            size={8}
                            style={{ color: "var(--text-tertiary)" }}
                          />
                        </div>
                        <p
                          className="text-[var(--text-sm)]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <span className="font-medium">{name}</span> {label}
                        </p>
                        <span
                          className="ml-auto text-[var(--text-2xs)]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {formatDateTime(
                            entry.performedAt ||
                              (entry as unknown as { createdAt?: string })
                                .createdAt,
                          )}
                        </span>
                      </div>
                      {showDiff && (
                        <div className="pl-6 space-y-1.5">
                          <div
                            className="rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-xs)]"
                            style={{
                              backgroundColor: "var(--bg-secondary)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <span
                              className="font-medium uppercase tracking-wider text-[10px]"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Antes
                            </span>
                            <p className="mt-0.5">
                              {formatHistoryValue(
                                entry.action,
                                entry.previousValue,
                              )}
                            </p>
                          </div>
                          <div className="flex justify-center">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: "var(--bg-secondary)" }}
                            >
                              <span style={{ color: "var(--text-tertiary)" }}>
                                ↓
                              </span>
                            </div>
                          </div>
                          <div
                            className="rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-xs)]"
                            style={{
                              backgroundColor: "var(--bg-info)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                            }}
                          >
                            <span
                              className="font-medium uppercase tracking-wider text-[10px]"
                              style={{ color: "var(--text-info)" }}
                            >
                              Ahora
                            </span>
                            <p className="mt-0.5">
                              {formatHistoryValue(entry.action, entry.newValue)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Meta — creation */}
          <div
            className="pt-3 border-t"
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-lg text-[var(--text-sm)] font-medium shadow-[var(--shadow-toast)] flex items-center gap-2"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
            }}
          >
            <Check size={13} style={{ color: "var(--text-success)" }} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{
              backgroundColor: "var(--bg-modal-overlay)",
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

  // Portal rendering
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000]"
            style={{
              backgroundColor: "var(--bg-modal-overlay)",
              backdropFilter: "blur(2px)",
            }}
            onClick={onClose}
          />

          {/* Mobile sheet */}
          <div
            className="sm:hidden fixed inset-x-0 top-0 z-[9001]"
            style={{ bottom: 0 }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 overflow-hidden shadow-[var(--shadow-modal)] flex flex-col"
              style={{ top: 0, backgroundColor: "var(--bg-card)" }}
            >
              <div className="flex justify-center pt-2.5 pb-0 flex-shrink-0">
                <div
                  className="w-8 h-1 rounded-full"
                  style={{ backgroundColor: "var(--border-color)" }}
                />
              </div>
              <div className="flex-1 overflow-hidden">{panelContent}</div>
            </motion.div>
          </div>

          {/* Desktop panel */}
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
