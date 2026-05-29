"use client";

import React from "react";
import { Bell, CalendarDays, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskReminder, RecurrenceConfig } from "@/types";

interface TaskOptionsBarProps {
  dueDate?: string | null;
  dueTime?: string | null;
  reminders?: TaskReminder[];
  recurrence?: RecurrenceConfig | null;
  onReminderClick: () => void;
  onDueDateClick: () => void;
  onRecurrenceClick: () => void;
}

export default function TaskOptionsBar({
  dueDate,
  dueTime,
  reminders,
  recurrence,
  onReminderClick,
  onDueDateClick,
  onRecurrenceClick,
}: TaskOptionsBarProps) {
  const hasReminder = reminders && reminders.length > 0;
  const hasDueDate = !!dueDate;
  const hasRecurrence = !!recurrence;

  const getDueLabel = () => {
    if (!dueDate) return "Vencimiento";
    return formatDateShort(dueDate);
  };

  const getReminderLabel = () => {
    if (!hasReminder) return "Recordarme";
    return "Recordatorio";
  };

  const getRecurrenceLabel = () => {
    if (!hasRecurrence) return "Repetir";
    const labels: Record<string, string> = {
      daily: "Diario",
      weekdays: "Laboral",
      weekly: "Semanal",
      monthly: "Mensual",
      yearly: "Anual",
      custom: "Custom",
    };
    return labels[recurrence!.type] || "Repetir";
  };

  return (
    <div className="flex items-center gap-2 pt-2">
      {/* Reminder */}
      <button
        onClick={onReminderClick}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          hasReminder
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        )}
      >
        <Bell size={13} className={hasReminder ? "text-blue-600" : ""} />
        {getReminderLabel()}
      </button>

      {/* Due Date */}
      <button
        onClick={onDueDateClick}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          hasDueDate
            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
            : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        )}
      >
        <CalendarDays
          size={13}
          className={hasDueDate ? "text-amber-600" : ""}
        />
        {getDueLabel()}
      </button>

      {/* Recurrence */}
      <button
        onClick={onRecurrenceClick}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          hasRecurrence
            ? "bg-green-50 text-green-700 hover:bg-green-100"
            : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        )}
      >
        <Repeat size={13} className={hasRecurrence ? "text-green-600" : ""} />
        {getRecurrenceLabel()}
      </button>
    </div>
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
