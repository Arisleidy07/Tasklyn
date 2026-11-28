"use client";

// ============================================
// TASKLYN — Compact delete confirmation
// Centered card sized to its content on every screen (no full-height sheet),
// title + visible X, short message, "Cancelar" / "Eliminar".
// ============================================

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2, X } from "lucide-react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  /** Shows a spinner and blocks closing while true. */
  loading?: boolean;
}

export default function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Eliminar tarea",
  message,
  confirmLabel = "Eliminar",
  loading = false,
}: ConfirmDeleteDialogProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        e.stopPropagation();
        onClose();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey, true);
    // Focus the safe action first
    const t = setTimeout(() => cancelRef.current?.focus(), 30);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey, true);
    };
  }, [isOpen, loading, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center px-4"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top))",
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          // Keep clicks inside from reaching cards / panels underneath
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={loading ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[400px] rounded-2xl p-5 shadow-[var(--shadow-modal)]"
            style={{
              backgroundColor: "var(--bg-modal)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--bg-error)", color: "var(--text-error)" }}
              >
                <Trash2 size={18} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h2
                  id={titleId}
                  className="text-base font-semibold leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </h2>
                <div
                  className="mt-1.5 text-sm leading-relaxed break-words"
                  style={{ color: "var(--text-secondary)", overflowWrap: "anywhere" }}
                >
                  {message}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-shrink-0 -mt-1 -mr-1 w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-10 px-4 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                style={{
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void onConfirm()}
                disabled={loading}
                className="h-10 px-4 min-w-[104px] rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#dc2626" }}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
