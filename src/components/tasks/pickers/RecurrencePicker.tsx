"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Repeat, Check } from "lucide-react";
import type { RecurrenceConfig, RecurrenceType } from "@/types";
import { cn } from "@/lib/utils";

interface RecurrencePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (rec: RecurrenceConfig | null) => void;
  currentRecurrence?: RecurrenceConfig | null;
}

const quickOptions: { label: string; type: RecurrenceType }[] = [
  { label: "Diariamente", type: "daily" },
  { label: "Días laborales", type: "weekdays" },
  { label: "Semanalmente", type: "weekly" },
  { label: "Mensualmente", type: "monthly" },
  { label: "Anualmente", type: "yearly" },
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

export default function RecurrencePicker({
  isOpen,
  onClose,
  onSelect,
  currentRecurrence,
}: RecurrencePickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    currentRecurrence?.daysOfWeek || [],
  );
  const [interval, setInterval] = useState(currentRecurrence?.interval || 1);
  const [customType, setCustomType] = useState<"days" | "weeks" | "months">(
    "weeks",
  );

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    );
  };

  const handleQuickSelect = (type: RecurrenceType) => {
    onSelect({ type });
    onClose();
  };

  const handleCustomSave = () => {
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
            {!showCustom ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative z-10 w-full max-w-[min(340px,calc(100vw-32px))] rounded-2xl overflow-y-auto"
                style={{
                  backgroundColor: "var(--bg-modal)",
                  boxShadow: "var(--shadow-modal)",
                  border: "1px solid var(--border-color)",
                  maxHeight: "min(420px, calc(100dvh - 64px))",
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex items-center gap-2">
                    <Repeat
                      size={18}
                      style={{ color: "var(--text-secondary)" }}
                    />
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Repetir
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
                <div className="px-5 py-3 space-y-1">
                  {quickOptions.map((opt) => {
                    const isActive = currentRecurrence?.type === opt.type;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleQuickSelect(opt.type)}
                        className={cn(
                          "w-full min-h-10 flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]",
                          isActive
                            ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
                            : "text-[var(--text-primary)]",
                        )}
                      >
                        <span>{opt.label}</span>
                        {isActive && <Check size={16} />}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setShowCustom(true)}
                    className="w-full min-h-10 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: "var(--text-link)" }}
                  >
                    Personalizar...
                  </button>

                  {currentRecurrence && (
                    <button
                      onClick={() => {
                        onSelect(null);
                        onClose();
                      }}
                      className="w-full min-h-10 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-error)]"
                      style={{ color: "var(--text-error)" }}
                    >
                      No repetir
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative z-10 w-full max-w-[min(360px,calc(100vw-32px))] rounded-2xl overflow-y-auto"
                style={{
                  backgroundColor: "var(--bg-modal)",
                  boxShadow: "var(--shadow-modal)",
                  border: "1px solid var(--border-color)",
                  maxHeight: "min(520px, calc(100dvh - 64px))",
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
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
                    Personalizar repetición
                  </h3>
                  <button
                    onClick={() => setShowCustom(false)}
                    className="min-w-10 min-h-10 p-1.5 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Frequency type */}
                  <div className="space-y-2">
                    <label
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Frecuencia
                    </label>
                    <div
                      className="flex rounded-xl p-1"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      {(
                        [
                          { key: "days", label: "Días" },
                          { key: "weeks", label: "Semanas" },
                          { key: "months", label: "Meses" },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setCustomType(f.key)}
                          className="flex-1 min-h-10 py-2 rounded-lg text-sm font-medium transition-all"
                          style={
                            customType === f.key
                              ? {
                                  backgroundColor: "var(--bg-card)",
                                  color: "var(--text-primary)",
                                  boxShadow: "var(--shadow-button)",
                                }
                              : { color: "var(--text-tertiary)" }
                          }
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interval */}
                  <div className="space-y-2">
                    <label
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Cada{" "}
                      {customType === "days"
                        ? "cuántos días"
                        : customType === "weeks"
                          ? "cuántas semanas"
                          : "cuántos meses"}
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setInterval(Math.max(1, interval - 1))}
                        className="w-10 h-10 rounded-xl font-semibold transition-colors"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-tertiary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-secondary)";
                        }}
                      >
                        −
                      </button>
                      <span
                        className="flex-1 text-center text-lg font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {interval}
                      </span>
                      <button
                        onClick={() => setInterval(interval + 1)}
                        className="w-10 h-10 rounded-xl font-semibold transition-colors"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-tertiary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-secondary)";
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Days of week (only for weeks) */}
                  {customType === "weeks" && (
                    <div className="space-y-2">
                      <label
                        className="text-xs font-medium uppercase tracking-wide"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Días de la semana
                      </label>
                      <div className="flex gap-1.5">
                        {weekDays.map((d) => {
                          const active = selectedDays.includes(d.value);
                          return (
                            <button
                              key={d.value}
                              onClick={() => toggleDay(d.value)}
                              className="flex-1 aspect-square rounded-xl text-sm font-semibold transition-all"
                              style={
                                active
                                  ? {
                                      backgroundColor: "var(--text-link)",
                                      color: "var(--text-inverse)",
                                    }
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
                    </div>
                  )}

                  <button
                    onClick={handleCustomSave}
                    className="w-full h-11 rounded-xl text-sm font-medium transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: "var(--text-link)",
                      color: "var(--text-inverse)",
                    }}
                  >
                    Guardar repetición
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
