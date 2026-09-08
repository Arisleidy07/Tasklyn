"use client";

import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "task" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: ModalSize;
  /** Hide the default header. Useful when the modal renders its own header (e.g. previews). */
  hideHeader?: boolean;
  /** Optional sticky footer (actions). Rendered outside the scroll area. */
  footer?: React.ReactNode;
  /** Optional icon shown next to the title. */
  icon?: React.ReactNode;
  /** Prevent closing on backdrop click / Escape (e.g. while submitting). */
  disableClose?: boolean;
}

const sizeMap: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-2xl",
  task: "max-w-[720px]",
  full: "max-w-full sm:max-w-[90vw] lg:max-w-[1100px]",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  hideHeader = false,
  footer,
  icon,
  disableClose = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableClose) onClose();
    },
    [onClose, disableClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[2147483647] flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={disableClose ? undefined : onClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative z-10 flex flex-col w-full overflow-hidden",
              "rounded-t-2xl sm:rounded-2xl",
              "max-h-[92dvh] sm:max-h-[88dvh]",
              "shadow-[var(--shadow-modal)]",
              sizeMap[size],
            )}
            style={{
              backgroundColor: "var(--bg-modal)",
              borderColor: "var(--border-color)",
              borderWidth: "1px",
            }}
          >
            {/* Header */}
            {!hideHeader && (title || description) && (
              <div
                className="flex items-start justify-between gap-3 px-5 py-4 sm:px-6 sm:py-4 border-b flex-shrink-0"
                style={{
                  backgroundColor: "var(--bg-modal)",
                  borderColor: "var(--border-color)",
                }}
              >
                {icon && (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-link)",
                    }}
                  >
                    {icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-base sm:text-lg font-semibold leading-tight truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      className="text-sm mt-0.5 line-clamp-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-shrink-0 p-2 rounded-lg transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain touch-pan-y min-h-0"
              style={{
                backgroundColor: "var(--bg-modal)",
                paddingBottom: footer
                  ? undefined
                  : "env(safe-area-inset-bottom, 0px)",
              }}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="flex-shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 border-t"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-modal)",
                  paddingBottom:
                    "max(0.875rem, env(safe-area-inset-bottom, 0px))",
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
