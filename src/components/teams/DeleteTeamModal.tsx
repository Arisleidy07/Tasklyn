"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Users,
  FolderOpen,
  Trash2,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { Team } from "@/types";

interface DeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  team: Team;
  listCount?: number;
  memberCount?: number;
}

export default function DeleteTeamModal({
  isOpen,
  onClose,
  onConfirm,
  team,
  listCount = 0,
  memberCount = 0,
}: DeleteTeamModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al eliminar el equipo. Verifica que tienes permisos de propietario.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="¿Eliminar equipo?"
      description="Esta acción no se puede deshacer. Todos los datos serán eliminados permanentemente."
      size="sm"
      icon={<AlertTriangle size={22} style={{ color: "#ef4444" }} />}
      disableClose={isDeleting}
      footer={
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 min-h-[44px] rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-secondary)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 min-h-[44px] rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            style={{
              backgroundColor: isDeleting ? "rgba(239,68,68,0.5)" : "#ef4444",
              color: "#fff",
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Eliminando...
              </>
            ) : (
              <>
                <Trash2 size={15} /> Eliminar equipo
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="px-5 sm:px-6 py-2 space-y-4">
        {/* Team info */}
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <p
            className="font-medium text-base mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {team.name}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div
              className="flex items-center gap-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <FolderOpen size={14} />
              <span>{listCount} listas</span>
            </div>
            <div
              className="flex items-center gap-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <Users size={14} />
              <span>{memberCount} miembros</span>
            </div>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="space-y-1.5">
          {[
            "Miembros del equipo",
            "Configuración e información",
            "Invitaciones pendientes",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              <div className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mt-4 p-3 rounded-xl"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <p className="text-sm" style={{ color: "#ef4444" }}>
              {error}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
