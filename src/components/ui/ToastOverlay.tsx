"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

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
            className="pointer-events-auto w-[320px] sm:w-[360px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/8 border border-gray-100 p-4 flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {toast.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {toast.body}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
