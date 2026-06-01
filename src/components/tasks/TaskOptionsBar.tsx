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
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
            hasReminder
              ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
          )}
          title="Recordatorio"
        >
          <Bell size={16} />
          {hasReminder && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          )}
        </button>
        {openDropdown === "reminder" && (
          <ReminderDropdown
            reminders={reminders}
            taskDueDate={dueDate}
            taskDueTime={dueTime}
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
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
            hasDueDate
              ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
          )}
          title="Vencimiento"
        >
          <CalendarDays size={16} />
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
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
            hasRecurrence
              ? "text-green-600 bg-green-50 hover:bg-green-100"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
          )}
          title="Repetir"
        >
          <Repeat size={16} />
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
}: {
  reminders?: TaskReminder[];
  taskDueDate?: string | null;
  taskDueTime?: string | null;
  onSelect: (r: TaskReminder[]) => void;
  onClear: () => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState(toISODate(new Date()));
  const [customTime, setCustomTime] = useState("09:00");

  const quickOptions = [
    {
      label: "Más tarde",
      get: () => [{ id: genId(), at: offsetISO(4), sent: false }],
    },
    {
      label: "Esta noche",
      get: () => [{ id: genId(), at: tonightISO(), sent: false }],
    },
    {
      label: "Mañana",
      get: () => [{ id: genId(), at: tomorrowAt(9, 0), sent: false }],
    },
    {
      label: "Próxima semana",
      get: () => [{ id: genId(), at: nextWeekAt(9, 0), sent: false }],
    },
  ];

  return (
    <div className="absolute left-0 top-full mt-2 z-[9999] w-[260px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {!showCustom ? (
        <div className="p-1.5 space-y-0.5">
          {reminders && reminders.length > 0 && (
            <button
              onClick={onClear}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
            >
              <span>Eliminar aviso</span>
              <X size={14} className="text-red-400" />
            </button>
          )}
          {quickOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onSelect(opt.get())}
              className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Clock size={13} className="text-gray-400" />1 hora antes del
              vencimiento
            </button>
          )}
          <button
            onClick={() => setShowCustom(true)}
            className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-900 hover:bg-gray-50 transition-colors font-medium"
          >
            Elegir fecha y hora
          </button>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">
              Elegir fecha y hora
            </span>
            <button
              onClick={() => setShowCustom(false)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X size={14} className="text-gray-400" />
            </button>
          </div>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <button
            onClick={() => {
              const at = `${customDate}T${customTime}:00`;
              onSelect([{ id: genId(), at, sent: false }]);
            }}
            className="w-full h-9 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
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
    <div className="absolute left-0 top-full mt-2 z-[9999] w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Quick options */}
      <div className="p-2 space-y-0.5 border-b border-gray-100">
        {selectedDate && (
          <button
            onClick={() => onSelect(null)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
          >
            <span>Eliminar vencimiento</span>
            <X size={14} className="text-red-400" />
          </button>
        )}
        {quickOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSelect(opt.get())}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>{opt.label}</span>
            <span className="text-gray-400 text-xs">
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
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <span className="text-xs font-semibold text-gray-900">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <ChevronRight size={16} className="text-gray-500" />
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
                  !day.currentMonth && "text-gray-200 cursor-default",
                  day.currentMonth &&
                    "text-gray-700 hover:bg-gray-100 cursor-pointer",
                  isSelected && "bg-gray-900 text-white hover:bg-gray-800",
                  isToday &&
                    !isSelected &&
                    "ring-2 ring-gray-900 ring-offset-1",
                )}
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
      <div className="absolute left-0 top-full mt-2 z-[9999] w-[260px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">
            Personalizado
          </span>
          <button
            onClick={() => setShowCustom(false)}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
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
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                customType === f.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInterval(Math.max(1, interval - 1))}
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 text-sm"
          >
            −
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-gray-900">
            {interval}
          </span>
          <button
            onClick={() => setInterval(interval + 1)}
            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 text-sm"
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
                    active
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
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
          className="w-full h-9 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Guardar
        </button>
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-full mt-2 z-[9999] w-[220px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
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
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
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
                isActive
                  ? "bg-gray-900 text-white font-medium"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <span>{opt.label}</span>
              {isActive && <Check size={14} />}
            </button>
          );
        })}
        <button
          onClick={() => setShowCustom(true)}
          className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-900 hover:bg-gray-50 transition-colors font-medium"
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
