"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  CalendarDays,
  Repeat,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toISODate } from "@/lib/dateUtils";
import type { TaskReminder, RecurrenceConfig, RecurrenceType } from "@/types";
import { MONTHS, generateCalendarDays, formatDate } from "@/lib/dateUtils";

interface TaskOptionsBarProps {
  dueDate?: string | null;
  dueTime?: string | null;
  reminders?: TaskReminder[];
  recurrence?: RecurrenceConfig | null;
  teamMembers?: Array<{ userId: string; name: string }>;
  onReminderChange: (reminders: TaskReminder[]) => void;
  onDueDateChange: (date: string | null) => void;
  onRecurrenceChange: (rec: RecurrenceConfig | null) => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
}

export default function TaskOptionsBar({
  dueDate,
  dueTime,
  reminders,
  recurrence,
  teamMembers = [],
  onReminderChange,
  onDueDateChange,
  onRecurrenceChange,
  onDropdownOpenChange,
}: TaskOptionsBarProps) {
  const [openDropdown, setOpenDropdown] = useState<
    "reminder" | "due" | "recurrence" | null
  >(null);
  const barRef = useRef<HTMLDivElement>(null);

  const hasReminder = reminders && reminders.length > 0;
  const hasDueDate = !!dueDate;
  const hasRecurrence = !!recurrence;

  // Notify parent when dropdown opens/closes
  useEffect(() => {
    onDropdownOpenChange?.(openDropdown !== null);
  }, [openDropdown, onDropdownOpenChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={barRef} className="relative flex items-center gap-1 pt-1">
      {/* Reminder */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === "reminder" ? null : "reminder");
          }}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-all"
          style={
            hasReminder
              ? { color: "#2563eb", backgroundColor: "rgba(37,99,235,0.08)" }
              : { color: "var(--text-tertiary)" }
          }
          onMouseEnter={(e) => {
            if (hasReminder) {
              e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.15)";
            } else {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }
          }}
          onMouseLeave={(e) => {
            if (hasReminder) {
              e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.08)";
            } else {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }
          }}
          title="Recordatorio"
        >
          <Bell size={14} />
          {hasReminder && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          )}
        </button>
        {openDropdown === "reminder" && (
          <ReminderDropdown
            reminders={reminders}
            taskDueDate={dueDate}
            taskDueTime={dueTime}
            teamMembers={teamMembers}
            onSelect={(r) => {
              onReminderChange(r);
              setOpenDropdown(null);
            }}
            onClear={() => {
              onReminderChange([]);
              setOpenDropdown(null);
            }}
          />
        )}
      </div>

      {/* Due Date */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === "due" ? null : "due");
          }}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-all"
          style={
            hasDueDate
              ? { color: "#d97706", backgroundColor: "rgba(245,158,11,0.08)" }
              : { color: "var(--text-tertiary)" }
          }
          onMouseEnter={(e) => {
            if (hasDueDate) {
              e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.15)";
            } else {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }
          }}
          onMouseLeave={(e) => {
            if (hasDueDate) {
              e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.08)";
            } else {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }
          }}
          title="Vencimiento"
        >
          <CalendarDays size={14} />
          {hasDueDate && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
          )}
        </button>
        {openDropdown === "due" && (
          <DueDateDropdown
            selectedDate={dueDate}
            onSelect={(d) => {
              onDueDateChange(d);
              setOpenDropdown(null);
            }}
          />
        )}
      </div>

      {/* Recurrence */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(
              openDropdown === "recurrence" ? null : "recurrence",
            );
          }}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-all"
          style={
            hasRecurrence
              ? { color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)" }
              : { color: "var(--text-tertiary)" }
          }
          onMouseEnter={(e) => {
            if (hasRecurrence) {
              e.currentTarget.style.backgroundColor = "rgba(22,163,74,0.15)";
            } else {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }
          }}
          onMouseLeave={(e) => {
            if (hasRecurrence) {
              e.currentTarget.style.backgroundColor = "rgba(22,163,74,0.08)";
            } else {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-tertiary)";
            }
          }}
          title="Repetir"
        >
          <Repeat size={14} />
          {hasRecurrence && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
          )}
        </button>
        {openDropdown === "recurrence" && (
          <RecurrenceDropdown
            currentRecurrence={recurrence}
            onSelect={(r) => {
              onRecurrenceChange(r);
              setOpenDropdown(null);
            }}
            onClear={() => {
              onRecurrenceChange(null);
              setOpenDropdown(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Reminder Dropdown ──
function ReminderDropdown({
  reminders,
  taskDueDate,
  taskDueTime,
  onSelect,
  onClear,
  teamMembers = [],
}: {
  reminders?: TaskReminder[];
  taskDueDate?: string | null;
  taskDueTime?: string | null;
  onSelect: (r: TaskReminder[]) => void;
  onClear: () => void;
  teamMembers?: Array<{ userId: string; name: string }>;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState(toISODate(new Date()));
  const [customTime, setCustomTime] = useState("09:00");
  const [recipientType, setRecipientType] = useState<"me" | "team" | "members">(
    "me",
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const quickOptions = [
    {
      label: "Más tarde",
      get: () => [
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
      get: () => [
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
      get: () => [
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
      get: () => [
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

  return (
    <div
      className="absolute left-0 top-full mt-2 z-[9999] w-[260px] max-w-[calc(100vw-32px)] rounded-2xl shadow-xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-modal)",
      }}
    >
      {!showCustom ? (
        <div className="p-1.5 space-y-0.5">
          {/* Recipient Selector */}
          {teamMembers.length > 0 && (
            <div
              className="px-2 py-2 border-b mb-1"
              style={{ borderColor: "var(--border-color)" }}
            >
              <p
                className="text-[10px] font-medium mb-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Notificar a:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setRecipientType("me")}
                  className="px-2 py-1 rounded-md text-[10px] font-medium transition-colors"
                  style={{
                    backgroundColor:
                      recipientType === "me"
                        ? "var(--bg-secondary)"
                        : "transparent",
                    color:
                      recipientType === "me"
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                  }}
                >
                  Solo yo
                </button>
                <button
                  onClick={() => setRecipientType("team")}
                  className="px-2 py-1 rounded-md text-[10px] font-medium transition-colors"
                  style={{
                    backgroundColor:
                      recipientType === "team"
                        ? "var(--bg-secondary)"
                        : "transparent",
                    color:
                      recipientType === "team"
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                  }}
                >
                  Equipo
                </button>
                <button
                  onClick={() => setRecipientType("members")}
                  className="px-2 py-1 rounded-md text-[10px] font-medium transition-colors"
                  style={{
                    backgroundColor:
                      recipientType === "members"
                        ? "var(--bg-secondary)"
                        : "transparent",
                    color:
                      recipientType === "members"
                        ? "var(--text-primary)"
                        : "var(--text-tertiary)",
                  }}
                >
                  Específicos
                </button>
              </div>
              {recipientType === "members" && (
                <div className="mt-1.5 space-y-0.5">
                  {teamMembers.slice(0, 3).map((member) => (
                    <button
                      key={member.userId}
                      onClick={() => {
                        setSelectedMemberIds((prev) =>
                          prev.includes(member.userId)
                            ? prev.filter((id) => id !== member.userId)
                            : [...prev, member.userId],
                        );
                      }}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-colors text-left"
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
                        className="w-3 h-3 rounded border flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: selectedMemberIds.includes(member.userId)
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
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      {member.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {reminders && reminders.length > 0 && (
            <button
              onClick={onClear}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors font-medium"
              style={{ color: "#ef4444" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span>Eliminar aviso</span>
              <X size={14} className="text-red-400" />
            </button>
          )}
          {quickOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onSelect(opt.get())}
              className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {opt.label}
            </button>
          ))}
          {taskDueDate && (
            <button
              onClick={() => {
                const due = new Date(
                  taskDueDate + (taskDueTime ? `T${taskDueTime}` : "T00:00:00"),
                );
                due.setHours(due.getHours() - 1);
                onSelect([{ id: genId(), at: due.toISOString(), sent: false }]);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Clock size={13} style={{ color: "var(--text-tertiary)" }} />1
              hora antes del vencimiento
            </button>
          )}
          <button
            onClick={() => setShowCustom(true)}
            className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors font-medium"
            style={{ color: "var(--text-primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Elegir fecha y hora
          </button>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Elegir fecha y hora
            </span>
            <button
              onClick={() => setShowCustom(false)}
              className="p-1 rounded-lg transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <X size={14} style={{ color: "var(--text-tertiary)" }} />
            </button>
          </div>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full h-9 px-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="w-full h-9 px-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={() => {
              const at = `${customDate}T${customTime}:00`;
              onSelect([{ id: genId(), at, sent: false }]);
            }}
            className="w-full h-9 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Due Date Dropdown ──
function DueDateDropdown({
  selectedDate,
  onSelect,
}: {
  selectedDate?: string | null;
  onSelect: (date: string | null) => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const days = generateCalendarDays(year, month);
  const today = toISODate(new Date());

  const quickOptions = [
    { label: "Hoy", get: () => toISODate(new Date()) },
    {
      label: "Mañana",
      get: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return toISODate(d);
      },
    },
    {
      label: "Próxima semana",
      get: () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return toISODate(d);
      },
    },
  ];

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  return (
    <div
      className="absolute left-0 top-full mt-2 z-[9999] w-[280px] max-w-[calc(100vw-32px)] rounded-2xl shadow-xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-modal)",
      }}
    >
      {/* Quick options */}
      <div
        className="p-2 space-y-0.5 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        {selectedDate && (
          <button
            onClick={() => onSelect(null)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors font-medium"
            style={{ color: "#ef4444" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span>Eliminar vencimiento</span>
            <X size={14} className="text-red-400" />
          </button>
        )}
        {quickOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSelect(opt.get())}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span>{opt.label}</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {formatDate(opt.get(), { short: true })}
            </span>
          </button>
        ))}
        {!selectedDate && (
          <button
            onClick={() => onSelect(null)}
            className="w-full px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            Sin vencimiento
          </button>
        )}
      </div>

      {/* Calendar */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <ChevronLeft size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <ChevronRight
              size={16}
              style={{ color: "var(--text-secondary)" }}
            />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
            <div
              key={`day-${i}`}
              className="text-center text-[9px] font-medium text-gray-400 py-1"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => {
            const isSelected = day.fullDate === selectedDate;
            const isToday = day.fullDate === today;
            return (
              <button
                key={i}
                onClick={() => onSelect(day.fullDate)}
                disabled={!day.currentMonth}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-full text-xs font-medium transition-all",
                  !day.currentMonth && "cursor-default",
                  day.currentMonth && !isSelected && "cursor-pointer",
                  isSelected && "bg-blue-600 text-white",
                  isToday &&
                    !isSelected &&
                    "ring-2 ring-blue-500 ring-offset-1",
                )}
                style={
                  !day.currentMonth
                    ? { color: "var(--text-tertiary)", opacity: 0.4 }
                    : isSelected
                      ? {}
                      : { color: "var(--text-primary)" }
                }
                onMouseEnter={(e) => {
                  if (day.currentMonth && !isSelected)
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (day.currentMonth && !isSelected)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {day.date}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Recurrence Dropdown ──
function RecurrenceDropdown({
  currentRecurrence,
  onSelect,
  onClear,
}: {
  currentRecurrence?: RecurrenceConfig | null;
  onSelect: (rec: RecurrenceConfig | null) => void;
  onClear?: () => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    currentRecurrence?.daysOfWeek || [],
  );
  const [interval, setInterval] = useState(currentRecurrence?.interval || 1);
  const [customType, setCustomType] = useState<"days" | "weeks" | "months">(
    "weeks",
  );

  const quickOptions: { label: string; type: RecurrenceType }[] = [
    { label: "Diario", type: "daily" },
    { label: "Laboral", type: "weekdays" },
    { label: "Semanal", type: "weekly" },
    { label: "Mensual", type: "monthly" },
    { label: "Anual", type: "yearly" },
  ];

  const weekDays = [
    { label: "L", value: 1 },
    { label: "M", value: 2 },
    { label: "M", value: 3 },
    { label: "J", value: 4 },
    { label: "V", value: 5 },
    { label: "S", value: 6 },
    { label: "D", value: 0 },
  ];

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    );
  };

  if (showCustom) {
    return (
      <div
        className="absolute left-0 top-full mt-2 z-[9999] w-[260px] max-w-[calc(100vw-32px)] rounded-2xl shadow-xl p-3 space-y-3"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Personalizado
          </span>
          <button
            onClick={() => setShowCustom(false)}
            className="p-1 rounded-lg transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X size={14} style={{ color: "var(--text-tertiary)" }} />
          </button>
        </div>
        <div
          className="flex rounded-xl p-1"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          {(
            [
              { key: "days", label: "Días" },
              { key: "weeks", label: "Sem" },
              { key: "months", label: "Mes" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setCustomType(f.key)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                customType === f.key
                  ? {
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }
                  : { color: "var(--text-tertiary)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInterval(Math.max(1, interval - 1))}
            className="w-8 h-8 rounded-lg font-semibold text-sm transition-colors"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
          >
            −
          </button>
          <span
            className="flex-1 text-center text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {interval}
          </span>
          <button
            onClick={() => setInterval(interval + 1)}
            className="w-8 h-8 rounded-lg font-semibold text-sm transition-colors"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
          >
            +
          </button>
        </div>
        {customType === "weeks" && (
          <div className="flex gap-1">
            {weekDays.map((d) => {
              const active = selectedDays.includes(d.value);
              return (
                <button
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    "flex-1 aspect-square rounded-lg text-xs font-semibold transition-all",
                    active ? "bg-blue-600 text-white" : "",
                  )}
                  style={
                    active
                      ? {}
                      : {
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-tertiary)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!active)
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-secondary)";
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        )}
        <button
          onClick={() => {
            const typeMap: Record<string, RecurrenceType> = {
              days: "daily",
              weeks: "custom",
              months: "monthly",
            };
            onSelect({
              type: typeMap[customType],
              interval,
              daysOfWeek:
                customType === "weeks" && selectedDays.length > 0
                  ? selectedDays
                  : undefined,
            });
            setShowCustom(false);
          }}
          className="w-full h-9 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          Guardar
        </button>
      </div>
    );
  }

  return (
    <div
      className="absolute left-0 top-full mt-2 z-[9999] w-[220px] max-w-[calc(100vw-32px)] rounded-2xl shadow-xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-modal)",
      }}
    >
      <div className="p-1.5 space-y-0.5">
        {currentRecurrence && (
          <button
            onClick={() => {
              if (onClear) {
                onClear();
              } else {
                onSelect(null);
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors font-medium"
            style={{ color: "#ef4444" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span>Eliminar repetición</span>
            <X size={14} className="text-red-400" />
          </button>
        )}
        {quickOptions.map((opt) => {
          const isActive = currentRecurrence?.type === opt.type;
          return (
            <button
              key={opt.label}
              onClick={() => onSelect({ type: opt.type })}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors",
                isActive ? "bg-blue-600 text-white font-medium" : "",
              )}
              style={isActive ? {} : { color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span>{opt.label}</span>
              {isActive && <Check size={14} />}
            </button>
          );
        })}
        <button
          onClick={() => setShowCustom(true)}
          className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors font-medium"
          style={{ color: "var(--text-primary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          Personalizado...
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──
function genId() {
  return Math.random().toString(36).slice(2, 9);
}
function offsetISO(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}
function tonightISO() {
  const d = new Date();
  d.setHours(21, 0, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}
function tomorrowAt(h: number, m: number) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function nextWeekAt(h: number, m: number) {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
