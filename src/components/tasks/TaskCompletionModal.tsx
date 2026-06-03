"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
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

  if (!isOpen || !user) return null;

  // Get team members for performer selection
  const teamMembers: TeamMemberOption[] = currentTeam
    ? currentTeam.members.map((member) => ({
        userId: member.userId,
        name:
          member.userId === user.id
            ? user.name
            : `Miembro ${member.userId.slice(0, 6)}`,
        email:
          member.userId === user.id
            ? user.email
            : `member@${member.userId.slice(0, 6)}.com`,
        photoURL: member.userId === user.id ? user.photoURL : undefined,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-500/20 flex items-center justify-center">
                <CheckCircle2
                  size={24}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                  ¿Quién realizó esta tarea?
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  "{taskTitle}"
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Message */}
          <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <AlertCircle
              size={18}
              className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            />
            <div className="text-sm">
              <p className="text-blue-900 dark:text-blue-100 font-medium">
                Información de completion
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Estás marcando esta tarea como completada. Si la realizó otra
                persona, por favor selecciónala a continuación.
              </p>
            </div>
          </div>

          {/* Performer Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <Users size={16} />
              ¿Quién realmente realizó la tarea?
            </label>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Option: The person completing it */}
              <button
                onClick={() => setSelectedPerformer(null)}
                className={cn(
                  "w-full p-3 rounded-xl border text-left transition-all duration-200",
                  selectedPerformer === null
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400"
                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      name={user.name}
                      photoURL={user.photoURL}
                      size="sm"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                      <CheckCircle2 size={8} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      {user.name} (Yo)
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
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
                    className={cn(
                      "w-full p-3 rounded-xl border text-left transition-all duration-200",
                      selectedPerformer === member.userId
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400"
                        : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={member.name}
                        photoURL={member.photoURL}
                        size="sm"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
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
                className={cn(
                  "w-full p-3 rounded-xl border text-left transition-all duration-200",
                  selectedPerformer === "other"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400"
                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                    <User
                      size={16}
                      className="text-gray-500 dark:text-slate-400"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      Otra persona
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
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
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <Clock size={16} />
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade alguna nota sobre la completion de esta tarea..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500 dark:text-slate-400">
              Completada por:{" "}
              <span className="font-medium text-gray-700 dark:text-slate-300">
                {user.name}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-slate-400">
              Realizada por:{" "}
              <span className="font-medium text-gray-700 dark:text-slate-300">
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
  );
}
