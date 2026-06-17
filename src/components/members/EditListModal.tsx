"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TaskList, MemberRole } from "@/types";
import { useListStore } from "@/stores/listStore";
import { useAuthStore } from "@/stores/authStore";
import { getUserRole, canEditList } from "@/lib/permissions";
import { X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/types";

interface EditListModalProps {
  list: TaskList;
  memberProfiles: Record<string, User>;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "details" | "members";
}

const QUICK_EMOJIS = ["📋","🏠","💼","🎯","⭐","🔥","💡","🚀","📚","🎨","🎵","🎮","🛠️","🔧","⚙️","💻","📱","🗂️","✅","🏆"];
const MORE_EMOJIS = ["🌍","🌱","🌊","🧩","🎪","🎭","🦋","🐝","🌸","🍀","🏋️","🎬","📷","🎤","🎸","🧪","🔬","🧲","🛡️","💎","🌙","☀️","⚡","🎁","📦","🗺️","🧭","🔑","💰","📊","📈","📉","🗝️","🏗️","🚗","✈️","🏖️","🎲","🧸"];

const BG_GALLERIES = [
  {
    label: "Paisajes",
    items: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    ],
  },
  {
    label: "Ciudad",
    items: [
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80",
    ],
  },
  {
    label: "Gradientes",
    items: [
      "linear-gradient(135deg,#667eea,#764ba2)",
      "linear-gradient(135deg,#f093fb,#f5576c)",
      "linear-gradient(135deg,#4facfe,#00f2fe)",
      "linear-gradient(135deg,#43e97b,#38f9d7)",
      "linear-gradient(135deg,#fa709a,#fee140)",
      "linear-gradient(135deg,#a18cd1,#fbc2eb)",
    ],
  },
];

const COLORS = [
  { value: "#3b82f6", name: "Azul" },
  { value: "#8b5cf6", name: "Morado" },
  { value: "#22c55e", name: "Verde" },
  { value: "#f97316", name: "Naranja" },
  { value: "#ef4444", name: "Rojo" },
  { value: "#eab308", name: "Amarillo" },
  { value: "#ec4899", name: "Rosa" },
  { value: "#1f2937", name: "Negro" },
];

export default function EditListModal({
  list,
  memberProfiles,
  isOpen,
  onClose,
}: EditListModalProps) {
  const { user } = useAuthStore();
  const { updateList } = useListStore();

  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");
  const [icon, setIcon] = useState(list.icon || "");
  const [backgroundImage, setBackgroundImage] = useState(list.backgroundImage || "");
  const [color, setColor] = useState(list.color || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMoreEmojis, setShowMoreEmojis] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(list.name);
      setDescription(list.description || "");
      setIcon(list.icon || "");
      setBackgroundImage(list.backgroundImage || "");
      setColor(list.color || "");
      setSaved(false);
      setShowMoreEmojis(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, list.name, list.description, list.icon, list.backgroundImage, list.color]);

  if (!user || typeof document === "undefined") return null;

  const myRole = getUserRole(list, user.id);
  const canEdit = canEditList(myRole);

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await updateList(list.id, {
        name: name.trim(),
        description: description.trim(),
        icon: icon || undefined,
        backgroundImage: backgroundImage || undefined,
        color: color || undefined,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  const isGradient = (v: string) => v.startsWith("linear-gradient");
  const allEmojis = showMoreEmojis ? [...QUICK_EMOJIS, ...MORE_EMOJIS] : QUICK_EMOJIS;

  const content = (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-card)" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h2 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Editar lista
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-secondary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 80px)" }}
      >
        <div className="px-5 py-5 space-y-6">

          {/* Preview */}
          {(backgroundImage || icon) && (
            <div
              className="w-full h-24 rounded-2xl relative overflow-hidden flex items-center justify-center gap-3"
              style={{
                background: backgroundImage && isGradient(backgroundImage) ? backgroundImage : undefined,
                backgroundImage: backgroundImage && !isGradient(backgroundImage) ? `url(${backgroundImage})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: backgroundImage ? undefined : "var(--bg-secondary)",
              }}
            >
              {backgroundImage && <div className="absolute inset-0 bg-black/20" />}
              <span className="relative text-3xl">{icon || "📋"}</span>
              <span
                className="relative font-semibold text-lg drop-shadow"
                style={{ color: backgroundImage ? "#fff" : "var(--text-primary)" }}
              >
                {name || "Sin nombre"}
              </span>
              {backgroundImage && (
                <button
                  onClick={() => setBackgroundImage("")}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la lista"
              disabled={!canEdit}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
              style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-input)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              disabled={!canEdit}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none disabled:opacity-60"
              style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-input)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Emoji / Icon */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-tertiary)" }}>
              Icono
            </label>
            <div className="flex flex-wrap gap-2">
              {allEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji === icon ? "" : emoji)}
                  disabled={!canEdit}
                  className="w-10 h-10 rounded-xl text-xl transition-all hover:scale-110 disabled:opacity-50"
                  style={{
                    backgroundColor: icon === emoji ? "var(--bg-tertiary)" : "var(--bg-secondary)",
                    border: icon === emoji ? "2px solid #3b82f6" : "2px solid transparent",
                  }}
                >
                  {emoji}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowMoreEmojis(!showMoreEmojis)}
                className="flex items-center gap-1 px-3 h-10 rounded-xl text-xs font-medium transition-colors"
                style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}
              >
                {showMoreEmojis ? <><ChevronUp size={12} /> Menos</> : <><ChevronDown size={12} /> Más</>}
              </button>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-tertiary)" }}>
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(({ value, name: cname }) => (
                <button
                  key={value}
                  type="button"
                  title={cname}
                  onClick={() => setColor(color === value ? "" : value)}
                  disabled={!canEdit}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 disabled:opacity-50 flex items-center justify-center"
                  style={{
                    backgroundColor: value,
                    boxShadow: color === value ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${value}` : "none",
                  }}
                >
                  {color === value && <Check size={13} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Background gallery */}
          {canEdit && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide mb-3 block" style={{ color: "var(--text-tertiary)" }}>
                Imagen de fondo
              </label>
              <div className="space-y-4">
                {BG_GALLERIES.map((gallery) => (
                  <div key={gallery.label}>
                    <p className="text-[11px] font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
                      {gallery.label}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {gallery.items.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setBackgroundImage(backgroundImage === item ? "" : item)}
                          className="w-full rounded-xl transition-all hover:scale-105 relative overflow-hidden"
                          style={{
                            height: "52px",
                            background: isGradient(item) ? item : undefined,
                            backgroundImage: !isGradient(item) ? `url(${item})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            border: backgroundImage === item ? "3px solid #3b82f6" : "3px solid transparent",
                            boxShadow: backgroundImage === item ? "0 0 0 1px #3b82f6" : "none",
                          }}
                        >
                          {backgroundImage === item && (
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/30">
                              <Check size={16} className="text-white drop-shadow" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div
        className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-t"
        style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-card)" }}
      >
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || isSaving || !canEdit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ backgroundColor: saved ? "#16a34a" : "#2563eb", color: "#fff" }}
        >
          {saved && <Check size={15} />}
          {isSaving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990]"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Mobile: fullscreen */}
          <div
            className="sm:hidden fixed inset-0 z-[9991] flex flex-col"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            {content}
          </div>

          {/* Desktop: centered modal */}
          <div className="hidden sm:flex fixed inset-0 z-[9991] items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}
            >
              {content}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
