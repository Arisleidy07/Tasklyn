"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Clock } from "lucide-react";
import { formatDate, formatTime, toISODate } from "@/lib/dateUtils";
import type { TaskReminder } from "@/types";

interface ReminderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (reminders: TaskReminder[]) => void;
  currentReminders?: TaskReminder[];
  taskDueDate?: string | null;
  taskDueTime?: string | null;
  teamMembers?: Array<{ userId: string; name: string }>;
}

export default function ReminderPicker({
  isOpen,
  onClose,
  onSelect,
  currentReminders,
  taskDueDate,
  taskDueTime,
  teamMembers = [],
}: ReminderPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState(toISODate(new Date()));
  const [customTime, setCustomTime] = useState("09:00");
  const [customAmPm, setCustomAmPm] = useState<"AM" | "PM">("AM");
  const [recipientType, setRecipientType] = useState<"me" | "team" | "members">(
    "me",
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const quickOptions = [
    {
      label: "Más tarde",
      getReminders: () => [
        {
          id: genId(),
          at: offsetISO(4),
          sent: false,
          recipientType,
          recipientIds:
            recipientType === "members" ? selectedMemberIds : undefined,
        },
      ],
    },
    {
      label: "Esta noche",
      getReminders: () => [
        {
          id: genId(),
          at: tonightISO(),
          sent: false,
          recipientType,
          recipientIds:
            recipientType === "members" ? selectedMemberIds : undefined,
        },
      ],
    },
    {
      label: "Mañana",
      getReminders: () => [
        {
          id: genId(),
          at: tomorrowAt(9, 0),
          sent: false,
          recipientType,
          recipientIds:
            recipientType === "members" ? selectedMemberIds : undefined,
        },
      ],
    },
    {
      label: "Próxima semana",
      getReminders: () => [
        {
          id: genId(),
          at: nextWeekAt(9, 0),
          sent: false,
          recipientType,
          recipientIds:
            recipientType === "members" ? selectedMemberIds : undefined,
        },
      ],
    },
  ];

  const handleCustomSave = () => {
    let hour = parseInt(customTime.split(":")[0]);
    const min = parseInt(customTime.split(":")[1]);
    if (customAmPm === "PM" && hour !== 12) hour += 12;
    if (customAmPm === "AM" && hour === 12) hour = 0;
    const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const at = `${customDate}T${timeStr}:00`;
    onSelect([
      {
        id: genId(),
        at,
        sent: false,
        recipientType,
        recipientIds:
          recipientType === "members" ? selectedMemberIds : undefined,
      },
    ]);
    setShowCustom(false);
    onClose();
  };

  const handleAddToDueDate = () => {
    if (!taskDueDate) return;
    // Remind 1 hour before due
    const due = new Date(
      taskDueDate + (taskDueTime ? `T${taskDueTime}` : "T00:00:00"),
    );
    due.setHours(due.getHours() - 1);
    const at = due.toISOString();
    onSelect([
      {
        id: genId(),
        at,
        sent: false,
        recipientType,
        recipientIds:
          recipientType === "members" ? selectedMemberIds : undefined,
      },
    ]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99998] bg-black/60"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{ isolation: "isolate" }}
          >
            {!showCustom ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative z-10 w-full max-w-[340px] max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-modal)",
                  boxShadow: "var(--shadow-modal)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex items-center gap-2">
                    <Bell
                      size={18}
                      style={{ color: "var(--text-secondary)" }}
                    />
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Recordarme
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-secondary)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-tertiary)";
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Recipient Selector */}
                {teamMembers.length > 0 && (
                  <div
                    className="px-5 py-3 border-b"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Notificar a:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setRecipientType("me")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          backgroundColor:
                            recipientType === "me"
                              ? "var(--bg-secondary)"
                              : "transparent",
                          color:
                            recipientType === "me"
                              ? "var(--text-primary)"
                              : "var(--text-tertiary)",
                          border:
                            recipientType === "me"
                              ? "1px solid var(--border-color)"
                              : "1px solid transparent",
                        }}
                      >
                        Solo yo
                      </button>
                      <button
                        onClick={() => setRecipientType("team")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          backgroundColor:
                            recipientType === "team"
                              ? "var(--bg-secondary)"
                              : "transparent",
                          color:
                            recipientType === "team"
                              ? "var(--text-primary)"
                              : "var(--text-tertiary)",
                          border:
                            recipientType === "team"
                              ? "1px solid var(--border-color)"
                              : "1px solid transparent",
                        }}
                      >
                        Todo el equipo
                      </button>
                      <button
                        onClick={() => setRecipientType("members")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          backgroundColor:
                            recipientType === "members"
                              ? "var(--bg-secondary)"
                              : "transparent",
                          color:
                            recipientType === "members"
                              ? "var(--text-primary)"
                              : "var(--text-tertiary)",
                          border:
                            recipientType === "members"
                              ? "1px solid var(--border-color)"
                              : "1px solid transparent",
                        }}
                      >
                        Miembros específicos
                      </button>
                    </div>
                    {recipientType === "members" && (
                      <div className="mt-2 space-y-1">
                        {teamMembers.map((member) => (
                          <button
                            key={member.userId}
                            onClick={() => {
                              setSelectedMemberIds((prev) =>
                                prev.includes(member.userId)
                                  ? prev.filter((id) => id !== member.userId)
                                  : [...prev, member.userId],
                              );
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                            style={{
                              backgroundColor: selectedMemberIds.includes(
                                member.userId,
                              )
                                ? "var(--bg-secondary)"
                                : "transparent",
                              color: "var(--text-primary)",
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded border flex items-center justify-center"
                              style={{
                                borderColor: selectedMemberIds.includes(
                                  member.userId,
                                )
                                  ? "#2563eb"
                                  : "var(--border-color)",
                                backgroundColor: selectedMemberIds.includes(
                                  member.userId,
                                )
                                  ? "#2563eb"
                                  : "transparent",
                              }}
                            >
                              {selectedMemberIds.includes(member.userId) && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            {member.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick options */}
                <div className="px-5 py-3 space-y-1">
                  {quickOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        onSelect(opt.getReminders());
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors"
                      style={{ color: "var(--text-primary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-secondary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  ))}

                  {taskDueDate && (
                    <button
                      onClick={handleAddToDueDate}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors"
                      style={{ color: "var(--text-primary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-secondary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Clock
                        size={14}
                        style={{ color: "var(--text-tertiary)" }}
                      />
                      <span
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        1 hora antes del vencimiento
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowCustom(true)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Elegir fecha y hora
                  </button>

                  {currentReminders && currentReminders.length > 0 && (
                    <button
                      onClick={() => {
                        onSelect([]);
                        onClose();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{ color: "#ef4444" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(239,68,68,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      Eliminar recordatorio
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative z-10 w-full max-w-[340px] max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-modal)",
                  boxShadow: "var(--shadow-modal)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  className="flex items-center justify-between px-5 py-4 border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Elegir fecha y hora
                  </h3>
                  <button
                    onClick={() => setShowCustom(false)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-secondary)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-tertiary)";
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        border: "1px solid var(--border-input)",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Hora
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="flex-1 h-11 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          border: "1px solid var(--border-input)",
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <div
                        className="flex rounded-xl overflow-hidden"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                      >
                        {(["AM", "PM"] as const).map((a) => (
                          <button
                            key={a}
                            onClick={() => setCustomAmPm(a)}
                            className="px-4 text-sm font-medium transition-colors"
                            style={
                              customAmPm === a
                                ? {
                                    backgroundColor: "var(--text-primary)",
                                    color: "var(--bg-card)",
                                  }
                                : { color: "var(--text-secondary)" }
                            }
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCustomSave}
                    className="w-full h-11 rounded-xl text-sm font-medium transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: "var(--text-primary)",
                      color: "var(--bg-card)",
                    }}
                  >
                    Guardar recordatorio
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function offsetISO(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function tonightISO(): string {
  const d = new Date();
  d.setHours(21, 0, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function tomorrowAt(h: number, m: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function nextWeekAt(h: number, m: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
