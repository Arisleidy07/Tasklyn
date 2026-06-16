"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Loader2, Users, FolderOpen, Trash2 } from "lucide-react";
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
  const [confirmText, setConfirmText] = useState("");

  const expectedText = `eliminar ${team.name}`;
  const canDelete = confirmText.toLowerCase().trim() === expectedText.toLowerCase();

  const handleConfirm = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al eliminar el equipo. Verifica que tienes permisos de propietario."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText("");
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className={cn(
                "w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto",
                "border border-red-100 dark:border-red-900/50"
              )}
              style={{
                backgroundColor: "var(--bg-card)",
              }}
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                    className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
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
                <div className="space-y-2 mb-6">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Se eliminará:
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      "Todas las listas del equipo",
                      "Todas las tareas y comentarios",
                      "Historial de actividad",
                      "Configuración y metas",
                      "Invitaciones pendientes",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Trash2 size={12} className="text-red-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Confirmation input */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Escribe{" "}
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      "eliminar {team.name}"
                    </span>{" "}
                    para confirmar
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={isDeleting}
                    placeholder={`eliminar ${team.name}`}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none",
                      "border-2 focus:ring-0",
                      canDelete
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 dark:border-gray-700 focus:border-blue-500"
                    )}
                    style={{
                      backgroundColor: "var(--bg-input)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={!canDelete || isDeleting}
                    className={cn(
                      "flex-1",
                      canDelete && "bg-red-600 hover:bg-red-700 text-white"
                    )}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar equipo"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
