"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Camera,
  Type,
  FileText,
  Palette,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import TeamImage from "@/components/ui/TeamImage";
import type { Team } from "@/types";

const PRESET_COLORS = [
  { name: "Blue", value: "#3b82f6", gradient: "from-blue-500 to-indigo-600" },
  {
    name: "Purple",
    value: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    name: "Emerald",
    value: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    name: "Orange",
    value: "#f59e0b",
    gradient: "from-orange-500 to-amber-600",
  },
  { name: "Rose", value: "#f43f5e", gradient: "from-rose-500 to-pink-600" },
  { name: "Cyan", value: "#06b6d4", gradient: "from-cyan-500 to-blue-600" },
  { name: "Lime", value: "#84cc16", gradient: "from-lime-500 to-green-600" },
  {
    name: "Fuchsia",
    value: "#d946ef",
    gradient: "from-fuchsia-500 to-purple-600",
  },
];

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  onSave: (updates: {
    name: string;
    description: string;
    color: string;
    photoURL?: string;
  }) => Promise<void>;
}

export default function EditTeamModal({
  isOpen,
  onClose,
  team,
  onSave,
}: EditTeamModalProps) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || "");
  const [selectedColor, setSelectedColor] = useState(
    team.color || PRESET_COLORS[0].value,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState(team.photoURL);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(team.name);
      setDescription(team.description || "");
      setSelectedColor(team.color || PRESET_COLORS[0].value);
      setPhotoURL(team.photoURL);
      setError(null);
    }
  }, [isOpen, team]);

  const hasChanges =
    name !== team.name ||
    description !== (team.description || "") ||
    selectedColor !== (team.color || PRESET_COLORS[0].value) ||
    photoURL !== team.photoURL;

  const handleSave = async () => {
    if (!name.trim()) {
      setError("El nombre del equipo es obligatorio");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        color: selectedColor,
        photoURL: photoURL,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar los cambios",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handlePhotoUpdate = (newPhotoURL: string) => {
    setPhotoURL(newPhotoURL || undefined);
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
              className="w-full max-w-lg rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)" }}
            >
              {/* Header */}
              <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <Camera
                      size={18}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Editar equipo
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Personaliza la apariencia y configuración
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="p-1.5 rounded-lg transition-colors"
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

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Team Image */}
                <div className="flex items-center gap-4">
                  <TeamImage
                    teamId={team.id}
                    name={name || team.name}
                    photoURL={photoURL}
                    size="xl"
                    editable
                    onUpdate={handlePhotoUpdate}
                    color={selectedColor}
                  />
                  <div className="flex-1">
                    <p
                      className="font-medium mb-1"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Foto del equipo
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Haz clic en la imagen para cambiarla. Formatos: JPG, PNG.
                      Máximo 5MB.
                    </p>
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Type size={14} />
                    Nombre del equipo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving}
                    placeholder="Ej: Marketing, Ventas, Desarrollo..."
                    maxLength={60}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none",
                      "border focus:ring-2 focus:ring-blue-500/20",
                    )}
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-input)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <p
                    className="text-xs text-right"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {name.length}/60
                  </p>
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <FileText size={14} />
                    Descripción
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving}
                    placeholder="¿Para qué es este equipo?"
                    rows={3}
                    maxLength={200}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none resize-none",
                      "border focus:ring-2 focus:ring-blue-500/20",
                    )}
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-input)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <p
                    className="text-xs text-right"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {description.length}/200
                  </p>
                </div>

                {/* Color Selection */}
                <div className="space-y-3">
                  <label
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Palette size={14} />
                    Color del equipo
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        disabled={isSaving}
                        className={cn(
                          "w-10 h-10 rounded-xl bg-gradient-to-br transition-all duration-200",
                          "flex items-center justify-center",
                          selectedColor === color.value
                            ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
                            : "hover:scale-105",
                        )}
                        style={{
                          background: `linear-gradient(135deg, ${color.value}, ${color.value}dd)`,
                        }}
                        title={color.name}
                      >
                        {selectedColor === color.value && (
                          <Check size={16} className="text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <p className="text-sm text-red-600">{error}</p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div
                className="px-6 py-4 border-t flex justify-end gap-3"
                style={{ borderColor: "var(--border-color)" }}
              >
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving || !name.trim()}
                  isLoading={isSaving}
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
