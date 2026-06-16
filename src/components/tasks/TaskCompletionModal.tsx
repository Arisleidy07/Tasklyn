"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import Avatar from "@/components/ui/Avatar";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  onConfirm: (performedBy: string | null) => void;
  listMembers?: Array<{ userId: string; role: string }>;
}

export default function TaskCompletionModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  onConfirm,
  listMembers,
}: TaskCompletionModalProps) {
  const { user } = useAuthStore();
  const { completeTask } = useTaskStore();
  const [selectedPerformer, setSelectedPerformer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const otherMemberUids = listMembers
    ? listMembers.map((m) => m.userId).filter((uid) => uid !== user?.id)
    : [];
  const { getProfile } = useUserProfiles(otherMemberUids);

  if (!isOpen || !user || typeof document === "undefined") return null;

  const otherMembers = (listMembers || [])
    .filter((m) => m.userId !== user.id)
    .map((m) => ({
      userId: m.userId,
      role: m.role,
      name: getProfile(m.userId).name,
      photoURL: getProfile(m.userId).photoURL,
    }));

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const performer = selectedPerformer
        ? { id: selectedPerformer, name: getProfile(selectedPerformer).name }
        : undefined;

      await completeTask(
        taskId,
        user.id,
        user.name,
        listMembers,
        performer,
      );

      onConfirm(selectedPerformer);
      onClose();
    } catch (err) {
      console.error("[TaskCompletion] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const showMemberList = otherMembers.length > 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99998]"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-2xl shadow-2xl overflow-hidden"
              style={{
                maxWidth: showMemberList ? "420px" : "360px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-50">
                    <CheckCircle2 size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      Completar tarea
                    </p>
                    <p
                      className="text-[11px] truncate max-w-[200px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {taskTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-secondary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Member picker — only shown when list has other members */}
              {showMemberList && (
                <div className="px-5 pb-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                    ¿Quién la realizó?
                  </p>

                  {/* Yo mismo */}
                  <button
                    onClick={() => setSelectedPerformer(null)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                      selectedPerformer === null
                        ? "border-blue-500 bg-blue-50"
                        : "border-transparent"
                    )}
                    style={selectedPerformer !== null ? { backgroundColor: "var(--bg-secondary)", borderColor: "transparent" } : {}}
                  >
                    <Avatar name={user.name} photoURL={user.photoURL} size="sm" />
                    <span className="flex-1 text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                      {user.name} <span className="font-normal text-[11px]" style={{ color: "var(--text-tertiary)" }}>(yo)</span>
                    </span>
                    {selectedPerformer === null && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={10} className="text-white" />
                      </div>
                    )}
                  </button>

                  {/* Otros miembros */}
                  {otherMembers.map((m) => (
                    <button
                      key={m.userId}
                      onClick={() => setSelectedPerformer(m.userId)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                        selectedPerformer === m.userId
                          ? "border-blue-500 bg-blue-50"
                          : "border-transparent"
                      )}
                      style={selectedPerformer !== m.userId ? { backgroundColor: "var(--bg-secondary)", borderColor: "transparent" } : {}}
                    >
                      <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                      <span className="flex-1 text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {m.name}
                      </span>
                      {selectedPerformer === m.userId && (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Footer buttons */}
              <div
                className="flex gap-3 px-5 py-4 border-t"
                style={{ borderColor: "var(--border-color)" }}
              >
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: loading ? "rgba(22,163,74,0.5)" : "#16a34a",
                    color: "#fff",
                  }}
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {loading ? "Guardando..." : "Completar"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
