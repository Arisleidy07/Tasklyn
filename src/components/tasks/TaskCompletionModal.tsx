"use client";

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { updateTask } from "@/lib/firestore";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import {
  CheckCircle2,
  User,
  Users,
  Clock,
  Calendar,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  onConfirm: (performedBy: string | null) => void;
}

interface TeamMemberOption {
  userId: string;
  name: string;
  email: string;
  photoURL?: string;
  role: string;
}

export default function TaskCompletionModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  onConfirm,
}: TaskCompletionModalProps) {
  const { user } = useAuthStore();
  const { currentTeam } = useTeamStore();
  const [selectedPerformer, setSelectedPerformer] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const memberUids = useMemo(() => {
    if (!currentTeam || !user) return [];
    return currentTeam.members
      .map((m) => m.userId)
      .filter((uid) => uid !== user.id);
  }, [currentTeam, user]);

  const { getProfile } = useUserProfiles(memberUids);

  if (!isOpen || !user) return null;

  // Get team members for performer selection
  const teamMembers: TeamMemberOption[] = currentTeam
    ? currentTeam.members.map((member) => ({
        userId: member.userId,
        name:
          member.userId === user.id
            ? user.name
            : getProfile(member.userId).name,
        email:
          member.userId === user.id
            ? user.email
            : getProfile(member.userId).email || "",
        photoURL:
          member.userId === user.id
            ? user.photoURL
            : getProfile(member.userId).photoURL,
        role: member.role,
      }))
    : [];

  // Add current user if not in team members
  if (!teamMembers.find((m) => m.userId === user.id)) {
    teamMembers.unshift({
      userId: user.id,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      role: "owner",
    });
  }

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Update task with completion info
      const updateData: any = {
        status: "completed",
        completedAt: new Date().toISOString(),
        completedBy: user.id,
      };

      if (selectedPerformer && selectedPerformer !== user.id) {
        updateData.performedBy = selectedPerformer;
      }

      await updateTask(taskId, updateData);

      // Add to history
      const historyEntry = {
        id: `history_${Date.now()}`,
        action: "completed" as const,
        performedBy: selectedPerformer || user.id,
        performedAt: new Date().toISOString(),
        details:
          selectedPerformer && selectedPerformer !== user.id
            ? `Completada por ${user.name}, realizada por ${teamMembers.find((m) => m.userId === selectedPerformer)?.name}`
            : `Completada por ${user.name}`,
        completedBy: user.id,
      };

      onConfirm(selectedPerformer);
      onClose();
    } catch (error) {
      console.error("Failed to complete task:", error);
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
          style={{
            backgroundColor: "var(--bg-modal)",
            boxShadow: "var(--shadow-modal)",
          }}
        >
          {/* Header */}
          <div
            className="p-6 border-b"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(22,163,74,0.08)" }}
                >
                  <CheckCircle2 size={24} style={{ color: "#16a34a" }} />
                </div>
                <div>
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    ¿Quién realizó esta tarea?
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    "{taskTitle}"
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info Message */}
            <div
              className="flex gap-3 p-4 rounded-xl border"
              style={{
                backgroundColor: "rgba(37,99,235,0.05)",
                borderColor: "rgba(37,99,235,0.2)",
              }}
            >
              <AlertCircle
                size={18}
                className="flex-shrink-0 mt-0.5"
                style={{ color: "#2563eb" }}
              />
              <div className="text-sm">
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Información de completion
                </p>
                <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
                  Estás marcando esta tarea como completada. Si la realizó otra
                  persona, por favor selecciónala a continuación.
                </p>
              </div>
            </div>

            {/* Performer Selection */}
            <div className="space-y-3">
              <label
                className="text-sm font-medium flex items-center gap-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <Users size={16} />
                ¿Quién realmente realizó la tarea?
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {/* Option: The person completing it */}
                <button
                  onClick={() => setSelectedPerformer(null)}
                  className="w-full p-3 rounded-xl border text-left transition-all duration-200"
                  style={
                    selectedPerformer === null
                      ? {
                          borderColor: "#3b82f6",
                          backgroundColor: "rgba(37,99,235,0.06)",
                        }
                      : {
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-card)",
                        }
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar
                        name={user.name}
                        photoURL={user.photoURL}
                        size="sm"
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: "var(--bg-modal)" }}
                      >
                        <CheckCircle2 size={8} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user.name} (Yo)
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        La completé y la realicé yo mismo
                      </p>
                    </div>
                    {selectedPerformer === null && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Team Members */}
                {teamMembers
                  .filter((member) => member.userId !== user.id)
                  .map((member) => (
                    <button
                      key={member.userId}
                      onClick={() => setSelectedPerformer(member.userId)}
                      className="w-full p-3 rounded-xl border text-left transition-all duration-200"
                      style={
                        selectedPerformer === member.userId
                          ? {
                              borderColor: "#3b82f6",
                              backgroundColor: "rgba(37,99,235,0.06)",
                            }
                          : {
                              borderColor: "var(--border-color)",
                              backgroundColor: "var(--bg-card)",
                            }
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.name}
                          photoURL={member.photoURL}
                          size="sm"
                        />
                        <div className="flex-1">
                          <p
                            className="font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {member.name}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {member.email}
                          </p>
                        </div>
                        {selectedPerformer === member.userId && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <CheckCircle2 size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}

                {/* Option: Other person not in team */}
                <button
                  onClick={() => setSelectedPerformer("other")}
                  className="w-full p-3 rounded-xl border text-left transition-all duration-200"
                  style={
                    selectedPerformer === "other"
                      ? {
                          borderColor: "#3b82f6",
                          backgroundColor: "rgba(37,99,235,0.06)",
                        }
                      : {
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--bg-card)",
                        }
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <User
                        size={16}
                        style={{ color: "var(--text-secondary)" }}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Otra persona
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Alguien fuera del equipo
                      </p>
                    </div>
                    {selectedPerformer === "other" && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <label
                className="text-sm font-medium flex items-center gap-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <Clock size={16} />
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añade alguna nota sobre la completion de esta tarea..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="p-6 border-t"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-secondary)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                Completada por:{" "}
                <span
                  className="font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {user.name}
                </span>
              </div>
              <div
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                Realizada por:{" "}
                <span
                  className="font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {selectedPerformer === null
                    ? user.name
                    : selectedPerformer === "other"
                      ? "Otra persona"
                      : teamMembers.find((m) => m.userId === selectedPerformer)
                          ?.name || "Seleccionar..."}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                isLoading={loading}
                className="flex-1"
                icon={<CheckCircle2 size={16} />}
              >
                Confirmar completion
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </>,
    document.body,
  );
}
