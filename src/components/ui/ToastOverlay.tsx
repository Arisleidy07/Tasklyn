"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export default function ToastOverlay() {
  const { toasts, dismissToast } = useNotifications();

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      dismissToast(toasts[0].id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts, dismissToast]);

  return (
    <div className="fixed top-4 right-4 z-[100000] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.slice(-3).map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "toast-panel pointer-events-auto w-[320px] sm:w-[360px] backdrop-blur-md rounded-2xl shadow-2xl p-4 flex items-start gap-3",
              "bg-white/95 border border-gray-100 shadow-black/8",
              "dark:bg-slate-900/95 dark:border-slate-800 dark:shadow-black/20",
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-tight">
                {toast.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {toast.body}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className={cn(
                "p-1 rounded-lg transition-colors flex-shrink-0",
                "text-gray-300 hover:text-gray-600 hover:bg-gray-50",
                "dark:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
