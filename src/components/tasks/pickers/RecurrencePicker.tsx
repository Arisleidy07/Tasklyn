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
                className="relative z-10 w-full max-w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Repeat size={18} className="text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Repetir
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors",
                          isActive
                            ? "bg-gray-900 text-white font-medium"
                            : "text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        <span>{opt.label}</span>
                        {isActive && <Check size={16} />}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setShowCustom(true)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-gray-900 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Personalizar...
                  </button>

                  {currentRecurrence && (
                    <button
                      onClick={() => {
                        onSelect(null);
                        onClose();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
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
                className="relative z-10 w-full max-w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Personalizar repetición
                  </h3>
                  <button
                    onClick={() => setShowCustom(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Frequency type */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Frecuencia
                    </label>
                    <div className="flex bg-gray-100 rounded-xl p-1">
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
                          className={cn(
                            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                            customType === f.key
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700",
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interval */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
                        className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-lg font-semibold text-gray-900">
                        {interval}
                      </span>
                      <button
                        onClick={() => setInterval(interval + 1)}
                        className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Days of week (only for weeks) */}
                  {customType === "weeks" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Días de la semana
                      </label>
                      <div className="flex gap-1.5">
                        {weekDays.map((d) => {
                          const active = selectedDays.includes(d.value);
                          return (
                            <button
                              key={d.value}
                              onClick={() => toggleDay(d.value)}
                              className={cn(
                                "flex-1 aspect-square rounded-xl text-sm font-semibold transition-all",
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
                    </div>
                  )}

                  <button
                    onClick={handleCustomSave}
                    className="w-full h-11 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
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
