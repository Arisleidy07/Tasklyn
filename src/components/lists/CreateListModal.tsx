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
import { Lock, Users, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [type, setType] = useState<ListType>("personal");
  const [color, setColor] = useState(LIST_COLORS[0].value);
  const [icon, setIcon] = useState(LIST_ICONS[0]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | "personal">(
    defaultTeamId || "personal",
  );

  const { user } = useAuthStore();
  const { createList, getUserLists } = useListStore();
  const { teams, getPersonalTeam } = useTeamStore();

  const handleClose = () => {
    setName("");
    setDescription("");
    setType("personal");
    setColor(LIST_COLORS[0].value);
    setIcon(LIST_ICONS[0]);
    setShowIconPicker(false);
    setSelectedTeamId(defaultTeamId || "personal");
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
      const personalTeam = getPersonalTeam(user.id);
      const resolvedTeamId =
        selectedTeamId === "personal"
          ? (personalTeam?.id ?? undefined)
          : selectedTeamId;
      const resolvedType: ListType =
        selectedTeamId === "personal" ? "personal" : "team";

      await createList(
        name.trim(),
        user.id,
        resolvedType,
        description.trim() || undefined,
        resolvedTeamId,
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
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Nueva lista"
        description="Configura tu lista de tareas"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Icon + Name row */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                style={{ backgroundColor: color + "20" }}
              >
                {icon}
              </button>
              {showIconPicker && (
                <div className="absolute top-full left-0 mt-2 z-50 p-2 grid grid-cols-5 gap-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 w-[160px]">
                  {LIST_ICONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setIcon(em);
                        setShowIconPicker(false);
                      }}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg text-base transition-all",
                        icon === em
                          ? "bg-blue-100 dark:bg-blue-500/20 ring-2 ring-blue-500"
                          : "hover:bg-gray-100 dark:hover:bg-slate-700",
                      )}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Nombre de la lista"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full h-12 px-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <textarea
              placeholder="Descripción opcional..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Team selector */}
          {user && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                Equipo
              </p>
              <div className="relative">
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3 py-2.5 pr-8 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="personal">👤 Personal (privada)</option>
                  {teams
                    .filter((t) => !t.isPersonal)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon || "👥"} {t.name}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* Color picker */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Color
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {LIST_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all duration-150",
                    color === c.value
                      ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900 scale-110"
                      : "hover:scale-105",
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Type selector */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Visibilidad
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType("personal")}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left",
                  type === "personal"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    type === "personal"
                      ? "bg-blue-100 dark:bg-blue-500/20"
                      : "bg-gray-100 dark:bg-slate-700",
                  )}
                >
                  <Lock
                    size={15}
                    className={
                      type === "personal"
                        ? "text-blue-600"
                        : "text-gray-400 dark:text-slate-500"
                    }
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      type === "personal"
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-slate-300",
                    )}
                  >
                    Personal
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    Solo tú
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("shared")}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left",
                  type === "shared"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    type === "shared"
                      ? "bg-blue-100 dark:bg-blue-500/20"
                      : "bg-gray-100 dark:bg-slate-700",
                  )}
                >
                  <Users
                    size={15}
                    className={
                      type === "shared"
                        ? "text-blue-600"
                        : "text-gray-400 dark:text-slate-500"
                    }
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      type === "shared"
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-slate-300",
                    )}
                  >
                    Compartida
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    Colaborar
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Preview strip */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: color + "20" }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                {name || "Nombre de la lista"}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                {type === "personal" ? "Lista personal" : "Lista compartida"}
                {description
                  ? ` · ${description.slice(0, 30)}${description.length > 30 ? "…" : ""}`
                  : ""}
              </p>
            </div>
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              isLoading={isSubmitting}
            >
              Crear lista
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
