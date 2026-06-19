"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import Avatar from "@/components/ui/Avatar";
import { CheckCircle2, X, UserCheck, UserCog } from "lucide-react";
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
  const [selectedPerformer, setSelectedPerformer] = useState<string | null>(
    null,
  );
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

      await completeTask(taskId, user.id, user.name, listMembers, performer);

      onConfirm(selectedPerformer);
      onClose();
    } catch (err) {
      console.error("[TaskCompletion] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const showMemberList = otherMembers.length > 0;
  const iDidTheWork = selectedPerformer === null;
  const someoneElseDidTheWork = selectedPerformer !== null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99998]"
            style={{
              backgroundColor: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(6px)",
            }}
            onClick={onClose}
          />

          {/* Modal — slides up on mobile, centered on desktop */}
          <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 360 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-[400px] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                maxHeight: "85dvh",
              }}
            >
              {/* Pull handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div
                  className="w-8 h-1 rounded-full"
                  style={{ backgroundColor: "var(--border-color)" }}
                />
              </div>

              {/* Header */}
              <div className="flex items-start justify-between px-5 pt-5 pb-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(22,163,74,0.12)" }}
                  >
                    <CheckCircle2 size={22} style={{ color: "#16a34a" }} />
                  </div>
                  <div>
                    <p
                      className="text-[15px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Completar tarea
                    </p>
                    <p
                      className="text-[12px] leading-snug mt-0.5"
                      style={{
                        color: "var(--text-tertiary)",
                        maxWidth: "240px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {taskTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl flex-shrink-0 transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── COMPLETADA POR ── */}
              <div className="px-5 pb-4">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  <UserCheck size={14} style={{ color: "#3b82f6" }} />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Completada por
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                  style={{
                    backgroundColor: "rgba(59,130,246,0.06)",
                    borderColor: "rgba(59,130,246,0.25)",
                  }}
                >
                  <Avatar name={user.name} photoURL={user.photoURL} size="md" />
                  <div>
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user.name}
                      <span
                        className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded-md"
                        style={{
                          backgroundColor: "rgba(59,130,246,0.15)",
                          color: "#3b82f6",
                        }}
                      >
                        Yo
                      </span>
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Estás marcando esta tarea como completada
                    </p>
                  </div>
                </div>
              </div>

              {/* ── REALIZADA POR ── */}
              {showMemberList && (
                <div className="px-5 pb-4">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <UserCog size={14} style={{ color: "#8b5cf6" }} />
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Realizada por
                    </span>
                  </div>

                  {/* Opción: Yo mismo */}
                  <button
                    onClick={() => setSelectedPerformer(null)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all mb-2"
                    style={
                      iDidTheWork
                        ? {
                            backgroundColor: "rgba(22,163,74,0.08)",
                            border: "1.5px solid #16a34a",
                          }
                        : {
                            backgroundColor: "var(--bg-secondary)",
                            border: "1.5px solid transparent",
                          }
                    }
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar
                        name={user.name}
                        photoURL={user.photoURL}
                        size="md"
                      />
                      {iDidTheWork && (
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: "#16a34a",
                            border: "2px solid var(--bg-card)",
                          }}
                        >
                          <CheckCircle2 size={9} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.name}
                        <span
                          className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          Yo
                        </span>
                      </p>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Yo realicé el trabajo
                      </p>
                    </div>
                  </button>

                  {/* Opción: Otro miembro */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {otherMembers.map((m) => {
                      const isSelected = selectedPerformer === m.userId;
                      return (
                        <button
                          key={m.userId}
                          onClick={() => setSelectedPerformer(m.userId)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
                          style={
                            isSelected
                              ? {
                                  backgroundColor: "rgba(139,92,246,0.08)",
                                  border: "1.5px solid #8b5cf6",
                                }
                              : {
                                  backgroundColor: "var(--bg-secondary)",
                                  border: "1.5px solid transparent",
                                }
                          }
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar
                              name={m.name}
                              photoURL={m.photoURL}
                              size="md"
                            />
                            {isSelected && (
                              <div
                                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: "#8b5cf6",
                                  border: "2px solid var(--bg-card)",
                                }}
                              >
                                <CheckCircle2 size={9} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[13px] font-medium truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {m.name}
                            </p>
                            <p
                              className="text-[11px]"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Realizó el trabajo por mí
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No members: simple confirm text */}
              {!showMemberList && (
                <div className="px-5 pb-4 flex-shrink-0">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ backgroundColor: "rgba(22,163,74,0.06)" }}
                  >
                    <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
                    <p
                      className="text-[13px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Se marcará como completada por ti
                    </p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div
                className="flex gap-3 px-5 py-4 flex-shrink-0 border-t"
                style={{ borderColor: "var(--border-color)" }}
              >
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium transition-colors"
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
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: loading
                      ? "rgba(22,163,74,0.6)"
                      : "linear-gradient(135deg, #16a34a, #15803d)",
                    color: "#fff",
                    boxShadow: loading
                      ? "none"
                      : "0 2px 10px rgba(22,163,74,0.35)",
                  }}
                >
                  {loading ? (
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {loading
                    ? "Guardando..."
                    : iDidTheWork
                      ? "Completar tarea"
                      : "Completar por otra persona"}
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
