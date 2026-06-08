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
}

export default function ReminderPicker({
  isOpen,
  onClose,
  onSelect,
  currentReminders,
  taskDueDate,
  taskDueTime,
}: ReminderPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState(toISODate(new Date()));
  const [customTime, setCustomTime] = useState("09:00");
  const [customAmPm, setCustomAmPm] = useState<"AM" | "PM">("AM");

  const quickOptions = [
    {
      label: "Más tarde",
      getReminders: () => [{ id: genId(), at: offsetISO(4), sent: false }],
    },
    {
      label: "Esta noche",
      getReminders: () => [{ id: genId(), at: tonightISO(), sent: false }],
    },
    {
      label: "Mañana",
      getReminders: () => [{ id: genId(), at: tomorrowAt(9, 0), sent: false }],
    },
    {
      label: "Próxima semana",
      getReminders: () => [{ id: genId(), at: nextWeekAt(9, 0), sent: false }],
    },
  ];

  const handleCustomSave = () => {
    let hour = parseInt(customTime.split(":")[0]);
    const min = parseInt(customTime.split(":")[1]);
    if (customAmPm === "PM" && hour !== 12) hour += 12;
    if (customAmPm === "AM" && hour === 12) hour = 0;
    const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const at = `${customDate}T${timeStr}:00`;
    onSelect([{ id: genId(), at, sent: false }]);
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
    onSelect([{ id: genId(), at, sent: false }]);
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
                className="relative z-10 w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell
                      size={18}
                      className="text-gray-500 dark:text-slate-400"
                    />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      Recordarme
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Quick options */}
                <div className="px-5 py-3 space-y-1">
                  {quickOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        onSelect(opt.getReminders());
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span className="font-medium dark:text-slate-200">
                        {opt.label}
                      </span>
                    </button>
                  ))}

                  {taskDueDate && (
                    <button
                      onClick={handleAddToDueDate}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Clock
                        size={14}
                        className="text-gray-400 dark:text-slate-500"
                      />
                      <span className="font-medium dark:text-slate-200">
                        1 hora antes del vencimiento
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowCustom(true)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-900 hover:bg-gray-50 transition-colors font-medium dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Elegir fecha y hora
                  </button>

                  {currentReminders && currentReminders.length > 0 && (
                    <button
                      onClick={() => {
                        onSelect([]);
                        onClose();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium dark:hover:bg-red-950/30"
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
                className="relative z-10 w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Elegir fecha y hora
                  </h3>
                  <button
                    onClick={() => setShowCustom(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide dark:text-slate-400">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide dark:text-slate-400">
                      Hora
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="flex-1 h-11 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      />
                      <div className="flex bg-gray-100 rounded-xl overflow-hidden dark:bg-slate-800">
                        {(["AM", "PM"] as const).map((a) => (
                          <button
                            key={a}
                            onClick={() => setCustomAmPm(a)}
                            className={`px-4 text-sm font-medium transition-colors ${customAmPm === a ? "bg-gray-900 text-white dark:bg-slate-700 dark:text-white" : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"}`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCustomSave}
                    className="w-full h-11 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
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
