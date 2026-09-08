"use client";

import React, { useState } from "react";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { CheckCircle2, UserCheck, UserCog } from "lucide-react";

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

  if (!isOpen || !user) return null;

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
      const completedBy = selectedPerformer ?? user.id;
      const completerName = selectedPerformer
        ? getProfile(selectedPerformer).name
        : user.name;

      await completeTask(taskId, completedBy, completerName, listMembers, {
        id: user.id,
        name: user.name,
      });

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Completar tarea"
      description={taskTitle}
      size="md"
      icon={<CheckCircle2 size={20} />}
      disableClose={loading}
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 min-h-[44px] rounded-2xl text-sm font-medium transition-colors"
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
            className="flex-1 min-h-[44px] rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background: loading
                ? "rgba(22,163,74,0.6)"
                : "linear-gradient(135deg, #16a34a, #15803d)",
              color: "#fff",
              boxShadow: loading ? "none" : "0 2px 10px rgba(22,163,74,0.35)",
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
      }
    >
      <div className="px-5 sm:px-6 py-2 space-y-4">
        {/* ── COMPLETADA POR ── */}
        <div>
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
          <div>
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
                <Avatar name={user.name} photoURL={user.photoURL} size="md" />
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
                      <Avatar name={m.name} photoURL={m.photoURL} size="md" />
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
          <div>
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
      </div>
    </Modal>
  );
}
