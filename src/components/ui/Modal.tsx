"use client";

import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-4xl lg:max-w-5xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — renders in document.body, covers sidebar/topbar/nav at root z-index level */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[99998] bg-black/65 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Mobile: true fullscreen, slides from top */}
          <motion.div
            initial={{ y: "-100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="sm:hidden fixed inset-0 z-[99999] flex flex-col bg-white"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/80 flex-shrink-0 bg-white/95 backdrop-blur-sm">
              <div className="flex-1 min-w-0 pr-3">
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-0.5 text-sm text-gray-500 truncate">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-5 py-5"
              style={{
                paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              {children}
            </div>
          </motion.div>

          {/* Desktop: centered dialog */}
          <div className="hidden sm:flex fixed inset-0 z-[99999] items-center justify-center p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative w-full bg-white rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] border border-gray-200/60 overflow-hidden flex flex-col max-h-[88vh]",
                sizeMap[size],
              )}
            >
              {title && (
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0 bg-white sticky top-0 z-10">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h2>
                    {description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-90 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              <div className="px-6 pb-6 pt-5 overflow-y-auto flex-1">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
