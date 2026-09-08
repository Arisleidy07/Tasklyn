"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { useListStore } from "@/stores/listStore";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { ListType } from "@/types";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { ChevronDown } from "lucide-react";
import { DEFAULT_LIST_COLOR, DEFAULT_LIST_ICON } from "@/lib/listAppearance";
import ListAppearancePicker from "./ListAppearancePicker";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: string;
}

export default function CreateListModal({
  isOpen,
  onClose,
  defaultTeamId,
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_LIST_COLOR);
  const [icon, setIcon] = useState(DEFAULT_LIST_ICON);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    defaultTeamId || "",
  );

  const { user } = useAuthStore();
  const { createList, getUserLists } = useListStore();
  const { teams } = useTeamStore();
  const limits = usePlanLimits();

  const userLists = user ? getUserLists(user.id) : [];
  const listCheck = limits.canCreateList(userLists.length);

  const handleClose = () => {
    setName("");
    setDescription("");
    setColor(DEFAULT_LIST_COLOR);
    setIcon(DEFAULT_LIST_ICON);
    setSelectedTeamId(defaultTeamId || "");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user || isSubmitting) return;

    if (!listCheck.allowed) {
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
        { color, icon },
      );
      handleClose();
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
        description={
          listCheck.allowed
            ? undefined
            : `Tu plan actual permite hasta ${listCheck.limit} listas. Actualiza a Pro para listas ilimitadas.`
        }
      />
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="task"
        hideHeader
        disableClose={isSubmitting}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="min-w-[96px] h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-list-form"
              disabled={!name.trim()}
              isLoading={isSubmitting}
              className="min-w-[128px] h-10"
            >
              Crear lista
            </Button>
          </div>
        }
      >
        <form id="create-list-form" onSubmit={handleSubmit}>
          {/* Preview banner */}
          <div
            className="relative w-full h-28 sm:h-32 flex-shrink-0 flex items-end overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${color}dd, ${color}99)`,
            }}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 flex items-center gap-3 px-5 sm:px-6 pb-4 sm:pb-5 w-full">
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0 border border-white/20"
                style={{
                  backgroundColor: "rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-base sm:text-lg leading-tight truncate drop-shadow">
                  {name || "Nueva lista"}
                </p>
                <p className="text-white/80 text-xs mt-0.5 truncate">
                  {selectedTeamId ? "👥 Equipo" : "🔗 Compartida"}
                  {description
                    ? ` · ${description.slice(0, 34)}${description.length > 34 ? "…" : ""}`
                    : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white/20 hover:bg-white/30 text-white"
              aria-label="Cerrar"
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

          <div className="px-5 sm:px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
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
                className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Descripción{" "}
                <span className="font-normal normal-case tracking-normal opacity-80">
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

            {/* Icono + color */}
            <ListAppearancePicker
              icon={icon}
              color={color}
              onIconChange={setIcon}
              onColorChange={setColor}
            />

            {/* Team selector */}
            {user && teams.length > 0 && (
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
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
        </form>
      </Modal>
    </>
  );
}
