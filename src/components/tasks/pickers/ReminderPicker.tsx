"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Clock, Trash2 } from "lucide-react";
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

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Local-timezone YYYY-MM-DD (never toISOString — that is the UTC date).
function toISODateLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function inMinutesISO(min: number): string {
  return new Date(Date.now() + min * 60 * 1000).toISOString();
}

function tonightISO(): string {
  const d = new Date();
  d.setHours(21, 0, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
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

function buildReminder(
  at: string,
  recipientType: "me" | "team" | "members",
  selectedMemberIds: string[],
): TaskReminder {
  return {
    id: genId(),
    at,
    sent: false,
    recipientType,
    recipientIds:
      recipientType === "members" && selectedMemberIds.length
        ? selectedMemberIds
        : undefined,
  };
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
  const [customDate, setCustomDate] = useState(() =>
    toISODateLocal(new Date()),
  );
  const [customTime, setCustomTime] = useState("09:00"); // 24h "HH:MM"
  const [recipientType, setRecipientType] = useState<"me" | "team" | "members">(
    "me",
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const customAmPm: "AM" | "PM" =
    parseInt(customTime.split(":")[0] || "0", 10) >= 12 ? "PM" : "AM";

  const setAmPm = (ampm: "AM" | "PM") => {
    const [hStr, mStr] = customTime.split(":");
    let h = parseInt(hStr || "0", 10);
    const m = mStr || "00";
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h >= 12) h -= 12;
    setCustomTime(`${pad(h)}:${m}`);
  };

  const quickOptions: Array<{ label: string; sub?: string; at: string }> = [
    { label: "En 15 minutos", at: inMinutesISO(15) },
    { label: "En 30 minutos", at: inMinutesISO(30) },
    { label: "En 1 hora", at: inMinutesISO(60) },
    { label: "En 2 horas", at: inMinutesISO(120) },
    { label: "Esta noche", sub: "9:00 PM", at: tonightISO() },
    { label: "Mañana", sub: "9:00 AM", at: tomorrowAt(9, 0) },
    {
      label: "Próxima semana",
      sub: "9:00 AM",
      at: nextWeekAt(9, 0),
    },
  ];

  const apply = (reminders: TaskReminder[]) => {
    onSelect(reminders);
    onClose();
  };

  const handleCustomSave = () => {
    if (!customDate || !customTime) return;
    // Build a local Date then store the absolute instant — avoids UTC shifts.
    const d = new Date(`${customDate}T${customTime}:00`);
    if (isNaN(d.getTime())) return;
    apply([buildReminder(d.toISOString(), recipientType, selectedMemberIds)]);
    setShowCustom(false);
  };

  const handleAddToDueDate = () => {
    if (!taskDueDate) return;
    const due = new Date(
      `${taskDueDate}T${taskDueTime || "00:00"}:00`,
    );
    due.setHours(due.getHours() - 1);
    apply([buildReminder(due.toISOString(), recipientType, selectedMemberIds)]);
  };

  const customPreview = (() => {
    if (!customDate || !customTime) return null;
    const d = new Date(`${customDate}T${customTime}:00`);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  })();

  const recipientChips = teamMembers.length > 0 && (
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
        {(
          [
            { key: "me", label: "Solo yo" },
            { key: "team", label: "Todo el equipo" },
            { key: "members", label: "Miembros específicos" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setRecipientType(opt.key)}
            className="min-h-10 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor:
                recipientType === opt.key
                  ? "var(--bg-secondary)"
                  : "transparent",
              color:
                recipientType === opt.key
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              border:
                recipientType === opt.key
                  ? "1px solid var(--border-color)"
                  : "1px solid var(--border-color)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {recipientType === "members" && (
        <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
          {teamMembers.map((member) => {
            const active = selectedMemberIds.includes(member.userId);
            return (
              <button
                key={member.userId}
                onClick={() =>
                  setSelectedMemberIds((prev) =>
                    prev.includes(member.userId)
                      ? prev.filter((id) => id !== member.userId)
                      : [...prev, member.userId],
                  )
                }
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{
                  backgroundColor: active
                    ? "var(--bg-secondary)"
                    : "transparent",
                  color: "var(--text-primary)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: active
                      ? "var(--text-link)"
                      : "var(--border-color)",
                    backgroundColor: active
                      ? "var(--text-link)"
                      : "transparent",
                  }}
                >
                  {active && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="var(--text-inverse)"
                      strokeWidth="2"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
                {member.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99998] bg-[var(--bg-modal-overlay)] backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-4"
            style={{ isolation: "isolate" }}
          >
            {!showCustom ? (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                className="relative z-10 w-full sm:max-w-[min(460px,calc(100vw-32px))] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
                style={{
                  backgroundColor: "var(--bg-modal)",
                  boxShadow: "var(--shadow-modal)",
                  border: "1px solid var(--border-color)",
                  borderBottom: "none",
                  maxHeight: "min(640px, calc(100dvh - env(safe-area-inset-top, 0px)))",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-5 sm:px-6 py-4 border-b flex-shrink-0"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <Bell
                        size={18}
                        style={{ color: "var(--text-secondary)" }}
                      />
                    </div>
                    <div>
                      <h3
                        className="text-base font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Recordarme
                      </h3>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Elige cuándo avisarte
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="min-w-11 min-h-11 p-2 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1">
                  {recipientChips}

                  {/* Quick options */}
                  <div className="px-5 sm:px-6 py-4">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Opciones rápidas
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickOptions.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() =>
                            apply([
                              buildReminder(
                                opt.at,
                                recipientType,
                                selectedMemberIds,
                              ),
                            ])
                          }
                          className="min-h-12 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors hover:bg-[var(--bg-hover)]"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                          }}
                        >
                          <span className="block">{opt.label}</span>
                          {opt.sub && (
                            <span
                              className="block text-xs mt-0.5"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {opt.sub}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {taskDueDate && (
                      <button
                        onClick={handleAddToDueDate}
                        className="w-full mt-2 min-h-12 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <Clock
                          size={15}
                          style={{ color: "var(--text-tertiary)" }}
                        />
                        <span>1 hora antes del vencimiento</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowCustom(true)}
                      className="w-full mt-2 min-h-12 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
                      style={{
                        backgroundColor: "var(--text-primary)",
                        color: "var(--bg-card)",
                      }}
                    >
                      Elegir fecha y hora
                    </button>

                    {currentReminders && currentReminders.length > 0 && (
                      <button
                        onClick={() => apply([])}
                        className="w-full mt-2 min-h-12 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-error)]"
                        style={{ color: "var(--text-error)" }}
                      >
                        <Trash2 size={15} />
                        Eliminar recordatorio
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                className="relative z-10 w-full sm:max-w-[min(460px,calc(100vw-32px))] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
                style={{
                  backgroundColor: "var(--bg-modal)",
                  boxShadow: "var(--shadow-modal)",
                  border: "1px solid var(--border-color)",
                  borderBottom: "none",
                  maxHeight: "min(640px, calc(100dvh - env(safe-area-inset-top, 0px)))",
                }}
              >
                <div
                  className="flex items-center justify-between px-5 sm:px-6 py-4 border-b flex-shrink-0"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Fecha y hora personalizadas
                  </h3>
                  <button
                    onClick={() => setShowCustom(false)}
                    aria-label="Volver"
                    className="min-w-11 min-h-11 p-2 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
                  {/* Date */}
                  <div className="space-y-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      min={toISODateLocal(new Date())}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-12 px-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        border: "1px solid var(--border-input)",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Hora
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => {
                          if (e.target.value) setCustomTime(e.target.value);
                        }}
                        className="flex-1 h-12 px-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          border: "1px solid var(--border-input)",
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <div
                        className="flex rounded-xl overflow-hidden flex-shrink-0"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                      >
                        {(["AM", "PM"] as const).map((a) => (
                          <button
                            key={a}
                            onClick={() => setAmPm(a)}
                            className="px-4 text-sm font-semibold transition-colors"
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

                  {/* Selection preview */}
                  {customPreview && (
                    <div
                      className="rounded-xl px-4 py-3 text-sm font-medium"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                      }}
                    >
                      Se guardará el recordatorio para el{" "}
                      <span className="font-semibold">{customPreview}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowCustom(false)}
                      className="flex-1 h-12 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCustomSave}
                      className="flex-[2] h-12 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
                      style={{
                        backgroundColor: "var(--text-primary)",
                        color: "var(--bg-card)",
                      }}
                    >
                      Guardar recordatorio
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
