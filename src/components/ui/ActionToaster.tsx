"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Loader2 } from "lucide-react";
import { useToastStore, type ActionToast } from "@/stores/toastStore";

const ICONS = {
  success: { Icon: CheckCircle2, color: "var(--text-success, #16a34a)" },
  error: { Icon: AlertCircle, color: "var(--text-error, #dc2626)" },
  warning: { Icon: AlertTriangle, color: "#d97706" },
  info: { Icon: Info, color: "var(--text-link, #2563eb)" },
} as const;

function ToastItem({ toast }: { toast: ActionToast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const [busy, setBusy] = useState(false);
  const { Icon, color } = ICONS[toast.variant];

  useEffect(() => {
    if (busy) return;
    const t = setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => clearTimeout(t);
  }, [toast.id, toast.durationMs, dismiss, busy]);

  const runAction = async () => {
    if (!toast.onAction || busy) return;
    setBusy(true);
    try {
      await toast.onAction();
    } finally {
      dismiss(toast.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      role={toast.variant === "error" ? "alert" : "status"}
      className="pointer-events-auto w-full max-w-[420px] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-md"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
      }}
    >
      <Icon size={18} className="flex-shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
          {toast.message}
        </p>
        {toast.description && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>
            {toast.description}
          </p>
        )}
      </div>
      {toast.actionLabel && toast.onAction && (
        <button
          type="button"
          onClick={runAction}
          disabled={busy}
          className="flex-shrink-0 h-8 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60"
          style={{ color: "var(--text-link, #2563eb)", backgroundColor: "var(--bg-info)" }}
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg"
        style={{ color: "var(--text-tertiary)" }}
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

/** Bottom-centred stack; sits above the mobile bottom nav and safe area. */
export default function ActionToaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      className="fixed inset-x-0 z-[100001] flex flex-col items-center gap-2 px-3 pointer-events-none bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
