"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LIST_COLORS,
  EMOJI_CATEGORIES,
  EMOJI_PREVIEW_CATEGORY_COUNT,
} from "@/lib/listAppearance";

interface ListAppearancePickerProps {
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
  /** Hide one of the sections if the caller only needs the other. */
  showIcon?: boolean;
  showColor?: boolean;
}

const FIELD_LABEL =
  "block text-[11px] font-semibold uppercase tracking-wide";

/**
 * Shared emoji + color picker used by Create/Edit list modals so both
 * share the exact same look, options and behaviour.
 */
export default function ListAppearancePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
  showIcon = true,
  showColor = true,
}: ListAppearancePickerProps) {
  const [expanded, setExpanded] = useState(false);

  // Collapsed view: first N categories flattened into one compact grid.
  const previewEmojis = Array.from(
    new Set(
      EMOJI_CATEGORIES.slice(0, EMOJI_PREVIEW_CATEGORY_COUNT).flatMap(
        (c) => c.emojis,
      ),
    ),
  ).slice(0, 16);

  // Make sure the selected icon is always visible in the collapsed view.
  if (icon && !previewEmojis.includes(icon)) previewEmojis[0] = icon;

  const renderEmoji = (em: string, key: string) => {
    const selected = icon === em;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onIconChange(em)}
        className={cn(
          "w-full aspect-square max-w-[44px] mx-auto rounded-xl text-xl flex items-center justify-center transition-all duration-150",
          "active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
          !selected && "hover:scale-105",
        )}
        style={{
          backgroundColor: selected ? `${color}1f` : "var(--bg-secondary)",
          border: selected ? `2px solid ${color}` : "2px solid transparent",
        }}
        aria-label={em}
        aria-pressed={selected}
      >
        {em}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {showIcon && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={FIELD_LABEL} style={{ color: "var(--text-tertiary)" }}>
              Icono
            </label>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-medium flex items-center gap-1 px-2 py-1 -mr-2 rounded-md transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--text-link)" }}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  Ver menos <ChevronUp size={14} />
                </>
              ) : (
                <>
                  Ver más <ChevronDown size={14} />
                </>
              )}
            </button>
          </div>

          <AnimatePresence initial={false} mode="wait">
            {expanded ? (
              <motion.div
                key="all"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className="space-y-4 max-h-[280px] overflow-y-auto overscroll-contain pr-1 rounded-xl p-3"
                  style={{
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                  }}
                >
                  {EMOJI_CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                      <p
                        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <cat.icon size={11} />
                        {cat.name}
                      </p>
                      <div className="grid grid-cols-8 sm:grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5">
                        {cat.emojis.map((em) =>
                          renderEmoji(em, `${cat.id}-${em}`),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-8 sm:grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5"
              >
                {previewEmojis.map((em) => renderEmoji(em, `p-${em}`))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {showColor && (
        <div>
          <label
            className={cn(FIELD_LABEL, "mb-2")}
            style={{ color: "var(--text-tertiary)" }}
          >
            Color
          </label>
          <div className="grid grid-cols-8 gap-2 sm:gap-2.5">
            {LIST_COLORS.map((c) => {
              const selected = color === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onColorChange(c.value)}
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={selected}
                  className="aspect-square w-full max-w-[36px] mx-auto rounded-full flex items-center justify-center transition-transform duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: selected
                      ? `0 0 0 2px var(--bg-modal), 0 0 0 4px ${c.value}`
                      : "inset 0 0 0 1px rgba(0,0,0,0.08)",
                    transform: selected ? "scale(1.08)" : undefined,
                  }}
                >
                  {selected && <Check size={14} strokeWidth={3} color="white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
