"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  Loader2,
  Users,
  FolderOpen,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9980]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed inset-0 z-[9981] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(239,68,68,0.12)" }}
                  >
                    <AlertTriangle
                      className="w-6 h-6"
                      style={{ color: "#ef4444" }}
                    />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      ¿Eliminar equipo?
                    </h2>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Esta acción no se puede deshacer. Todos los datos serán
                      eliminados permanentemente.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                {/* Team info */}
                <div
                  className="p-4 rounded-xl mb-4"
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
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <p className="text-sm" style={{ color: "#ef4444" }}>
                      {error}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div
                className="p-6 pt-4 border-t"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isDeleting}
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
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: isDeleting
                        ? "rgba(239,68,68,0.5)"
                        : "#ef4444",
                      color: "#fff",
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />{" "}
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 size={15} /> Eliminar equipo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
