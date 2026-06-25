"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { useListStore } from "@/stores/listStore";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { ListType } from "@/types";
import { canCreateMoreLists } from "@/lib/permissions";
import { Users, ChevronDown } from "lucide-react";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: string;
}

const LIST_COLORS = [
  { value: "#3b82f6", label: "Azul" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#10b981", label: "Esmeralda" },
  { value: "#f59e0b", label: "Ámbar" },
  { value: "#ef4444", label: "Rojo" },
  { value: "#06b6d4", label: "Cian" },
  { value: "#f97316", label: "Naranja" },
  { value: "#6b7280", label: "Gris" },
  { value: "#0f172a", label: "Negro" },
];

const LIST_ICONS = ["📋", "🎯", "💼", "🚀", "📌", "⭐", "🔥", "💡", "📁", "🏠"];

export default function CreateListModal({
  isOpen,
  onClose,
  defaultTeamId,
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ListType>("shared");
  const [color, setColor] = useState(LIST_COLORS[0].value);
  const [icon, setIcon] = useState(LIST_ICONS[0]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    defaultTeamId || "",
  );

  const { user } = useAuthStore();
  const { createList, getUserLists } = useListStore();
  const { teams } = useTeamStore();

  const handleClose = () => {
    setName("");
    setDescription("");
    setType("shared");
    setColor(LIST_COLORS[0].value);
    setIcon(LIST_ICONS[0]);
    setShowIconPicker(false);
    setSelectedTeamId(defaultTeamId || "");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user || isSubmitting) return;

    const userLists = getUserLists(user.id);
    const userPlan = user.plan || "free";
    if (!canCreateMoreLists(userLists.length, userPlan)) {
      setShowUpgrade(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedType: ListType = selectedTeamId ? "team" : "shared";

      await createList(
        name.trim(),
        user.id,
        resolvedType,
        description.trim() || undefined,
        selectedTeamId || undefined,
      );
      handleClose();
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="listas"
        description="Tu plan Free permite hasta 3 listas. Actualiza a Pro para crear listas ilimitadas."
      />
      <Modal isOpen={isOpen} onClose={handleClose} size="task">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* ── Live Preview Banner ── */}
          <div
            className="relative w-full h-32 flex-shrink-0 flex items-end overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
            }}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 flex items-center gap-3 px-6 pb-5 w-full">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-lg leading-tight truncate drop-shadow">
                  {name || "Nueva lista"}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  {selectedTeamId ? "� Equipo" : "👥 Compartida"}
                  {description
                    ? ` · ${description.slice(0, 28)}${description.length > 28 ? "…" : ""}`
                    : ""}
                </p>
              </div>
            </div>
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Ej: Proyecto Marketing Q3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full h-11 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Descripción{" "}
                  <span
                    style={{
                      color: "var(--text-tertiary)",
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (opcional)
                  </span>
                </label>
                <textarea
                  placeholder="¿De qué trata esta lista?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Emoji Picker */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Icono
                </label>
                <div className="flex flex-wrap gap-2">
                  {LIST_ICONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIcon(em)}
                      className="w-10 h-10 rounded-xl text-xl transition-all hover:scale-110"
                      style={{
                        backgroundColor:
                          icon === em ? color + "22" : "var(--bg-secondary)",
                        border:
                          icon === em
                            ? `2px solid ${color}`
                            : "2px solid transparent",
                        boxShadow:
                          icon === em ? `0 0 0 1px ${color}44` : "none",
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {LIST_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      title={c.label}
                      className="w-8 h-8 rounded-full transition-all duration-150 flex items-center justify-center"
                      style={{
                        backgroundColor: c.value,
                        boxShadow:
                          color === c.value
                            ? `0 0 0 3px var(--bg-modal), 0 0 0 5px ${c.value}`
                            : "none",
                        transform:
                          color === c.value ? "scale(1.15)" : "scale(1)",
                      }}
                    >
                      {color === c.value && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team selector */}
              {user && teams.length > 0 && (
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Equipo
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full h-11 px-4 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                      style={{
                        border: "1px solid var(--border-input)",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="">— Sin equipo</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.icon || "👥"} {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Sticky Footer ── */}
          <div
            className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-modal)",
            }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="min-w-[90px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              isLoading={isSubmitting}
              className="min-w-[120px]"
            >
              Crear lista
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
