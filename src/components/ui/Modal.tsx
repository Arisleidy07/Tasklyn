"use client";

import React, { useEffect, useCallback } from "react";
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
  sm: "sm:max-w-sm md:max-w-md",
  md: "sm:max-w-md md:max-w-lg",
  lg: "sm:max-w-lg md:max-w-xl",
  xl: "sm:max-w-4xl md:max-w-5xl lg:max-w-6xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Mobile: bottom sheet */}
          <div className="fixed inset-x-0 bottom-0 z-[99999] sm:hidden">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              {title && (
                <div className="flex items-start justify-between px-5 pt-3 pb-2 flex-shrink-0">
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
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              <div className="px-5 pb-8 pt-2 overflow-y-auto">{children}</div>
            </motion.div>
          </div>

          {/* Desktop: centered dialog */}
          <div className="hidden sm:flex fixed inset-0 z-[99999] items-center justify-center p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto",
                sizeMap[size],
              )}
            >
              {title && (
                <div className="flex items-start justify-between px-6 pt-6 pb-2 sticky top-0 bg-white z-10">
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
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              <div className="px-6 pb-6 pt-2">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
