"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  formatDate,
  generateCalendarDays,
  MONTHS,
  toISODate,
} from "@/lib/dateUtils";

interface DueDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string | null) => void;
  selectedDate?: string | null;
}

const quickOptions = [
  { label: "Hoy", getDate: () => toISODate(new Date()) },
  {
    label: "Mañana",
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return toISODate(d);
    },
  },
  {
    label: "Próxima semana",
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return toISODate(d);
    },
  },
];

export default function DueDatePicker({
  isOpen,
  onClose,
  onSelect,
  selectedDate,
}: DueDatePickerProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = generateCalendarDays(year, month);
  const today = toISODate(new Date());

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
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar
                    size={18}
                    className="text-gray-500 dark:text-slate-400"
                  />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Vencimiento
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
              <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 space-y-1">
                {quickOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      onSelect(opt.getDate());
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span className="font-medium dark:text-slate-200">
                      {opt.label}
                    </span>
                    <span className="text-gray-400 text-xs dark:text-slate-500">
                      {formatDate(opt.getDate(), { short: true })}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    onSelect(null);
                    onClose();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium dark:hover:bg-red-950/30"
                >
                  Sin fecha
                </button>
              </div>

              {/* Calendar */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-slate-800"
                  >
                    <ChevronLeft
                      size={18}
                      className="text-gray-500 dark:text-slate-400"
                    />
                  </button>
                  <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {MONTHS[month]} {year}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-slate-800"
                  >
                    <ChevronRight
                      size={18}
                      className="text-gray-500 dark:text-slate-400"
                    />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["D", "L", "M", "M", "J", "V", "S"].map((d) => (
                    <div
                      key={d}
                      className="text-center text-[10px] font-medium text-gray-400 uppercase tracking-wider py-1 dark:text-slate-500"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, i) => {
                    const isSelected = day.fullDate === selectedDate;
                    const isToday = day.fullDate === today;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          onSelect(day.fullDate);
                          onClose();
                        }}
                        disabled={!day.currentMonth}
                        className={`
                        aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all
                        ${!day.currentMonth ? "text-gray-200 cursor-default" : "text-gray-700 hover:bg-gray-100 cursor-pointer"}
                        ${isSelected ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600" : "text-gray-700 dark:text-slate-300"}
                        ${isToday && !isSelected ? "ring-2 ring-gray-900 ring-offset-1 dark:ring-slate-500 dark:ring-offset-slate-900" : ""}
                      `}
                      >
                        {day.date}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
