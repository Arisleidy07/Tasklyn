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
            className="fixed inset-0 z-[99998] bg-[var(--bg-modal-overlay)] backdrop-blur-sm"
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
              className="relative z-10 w-full max-w-[min(340px,calc(100vw-32px))] rounded-2xl overflow-y-auto"
              style={{
                backgroundColor: "var(--bg-modal)",
                boxShadow: "var(--shadow-modal)",
                border: "1px solid var(--border-color)",
                maxHeight: "min(560px, calc(100dvh - 64px))",
                paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex items-center gap-2">
                  <Calendar
                    size={18}
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Vencimiento
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="min-w-10 min-h-10 p-1.5 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick options */}
              <div
                className="px-5 py-3 border-b space-y-1"
                style={{ borderColor: "var(--border-color)" }}
              >
                {quickOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      onSelect(opt.getDate());
                      onClose();
                    }}
                    className="w-full min-h-10 flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span>{opt.label}</span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {formatDate(opt.getDate(), { short: true })}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    onSelect(null);
                    onClose();
                  }}
                  className="w-full min-h-10 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-error)]"
                  style={{ color: "var(--text-error)" }}
                >
                  Sin fecha
                </button>
              </div>

              {/* Calendar */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <ChevronLeft
                      size={18}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </button>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {MONTHS[month]} {year}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <ChevronRight
                      size={18}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["D", "L", "M", "M", "J", "V", "S"].map((d) => (
                    <div
                      key={d}
                      className="text-center text-[10px] font-medium uppercase tracking-wider py-1"
                      style={{ color: "var(--text-tertiary)" }}
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
                        className="aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all"
                        style={{
                          color: !day.currentMonth
                            ? "var(--text-muted)"
                            : isSelected
                              ? "var(--text-inverse)"
                              : "var(--text-primary)",
                          backgroundColor: isSelected
                            ? "var(--text-primary)"
                            : "transparent",
                          cursor: !day.currentMonth ? "default" : "pointer",
                          outline:
                            isToday && !isSelected
                              ? "2px solid var(--text-primary)"
                              : "none",
                          outlineOffset: "2px",
                        }}
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
