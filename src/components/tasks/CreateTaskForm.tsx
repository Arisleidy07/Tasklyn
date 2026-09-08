"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import type { Task } from "@/types";
import { Plus, X, Phone, MapPin, Tag, Flag, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateTaskFormProps {
  listId: string;
  onCreated?: () => void;
}

export default function CreateTaskForm({
  listId,
  onCreated,
}: CreateTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([""]);
  const [priority, setPriority] = useState<
    "low" | "normal" | "medium" | "high" | "urgent" | undefined
  >(undefined);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { createTask } = useTaskStore();

  const reset = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setPhoneNumbers([""]);
    setPriority(undefined);
    setTags([]);
    setTagInput("");
    setError(null);
  };

  const handleAddPhone = () => setPhoneNumbers((p) => [...p, ""]);
  const handleRemovePhone = (index: number) =>
    setPhoneNumbers((p) => p.filter((_, i) => i !== index));
  const handlePhoneChange = (index: number, value: string) => {
    const next = [...phoneNumbers];
    next[index] = value;
    setPhoneNumbers(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    const validPhones = phoneNumbers.filter((p) => p.trim());
    try {
      await createTask({
        listId,
        title: title.trim(),
        description: description.trim(),
        createdBy: user.id,
        location: location.trim() || undefined,
        phoneNumbers: validPhones.length > 0 ? validPhones : undefined,
        priority: priority || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      reset();
      setIsOpen(false);
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la tarea",
      );
    }
  };

  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full min-h-10 flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group"
        style={{
          borderColor: "var(--border-color)",
          color: "var(--text-tertiary)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-input-focus)";
          e.currentTarget.style.color = "var(--text-link)";
          e.currentTarget.style.backgroundColor = "var(--bg-info)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-color)";
          e.currentTarget.style.color = "var(--text-tertiary)";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "var(--bg-info)" }}
        >
          <Plus size={14} style={{ color: "var(--text-link)" }} />
        </div>
        <span className="text-sm font-medium">Agregar tarea</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-4 sm:p-5"
      style={{
        border: "1px solid var(--border-color)",
        backgroundColor: "var(--bg-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label
            className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            Título
          </label>
          <AutoResizeTextarea
            id="create-task-title"
            value={title}
            onChange={setTitle}
            placeholder="¿Qué hay que hacer?"
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-base font-medium leading-snug focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
            minRows={1}
            maxRows={4}
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
          <AutoResizeTextarea
            id="create-task-description"
            value={description}
            onChange={setDescription}
            placeholder="Detalles, contexto o pasos..."
            className="w-full px-4 py-2.5 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
            minRows={2}
            maxRows={6}
          />
        </div>

        {/* Location */}
        <div>
          <label
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            <MapPin size={12} />
            Ubicación
          </label>
          <input
            id="create-task-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Dirección o enlace de Google Maps"
            className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Phones */}
        <div>
          <label
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Phone size={12} />
            Teléfonos de contacto
          </label>
          <div className="space-y-2">
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder={`Teléfono ${index + 1}`}
                  value={phone}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  className="flex-1 min-w-0 h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
                {phoneNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(index)}
                    aria-label="Quitar teléfono"
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--text-error)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-tertiary)")
                    }
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPhone}
              className="flex items-center gap-1.5 text-sm font-medium h-9 px-1 -ml-1 rounded-md hover:opacity-80 transition-colors"
              style={{ color: "var(--text-link)" }}
            >
              <Plus size={14} />
              Agregar otro teléfono
            </button>
          </div>
        </div>

        {/* Priority */}
        <div>
          <label
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Flag size={12} />
            Prioridad
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(
              [
                { value: "low" as const, label: "Baja", color: "#16a34a" },
                { value: "normal" as const, label: "Normal", color: "#2563eb" },
                { value: "medium" as const, label: "Media", color: "#d97706" },
                { value: "high" as const, label: "Alta", color: "#ea580c" },
                {
                  value: "urgent" as const,
                  label: "Urgente",
                  color: "#dc2626",
                },
              ] as const
            ).map((p) => {
              const selected = priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPriority(selected ? undefined : p.value)}
                  className="h-10 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  style={{
                    backgroundColor: selected
                      ? `${p.color}1a`
                      : "var(--bg-secondary)",
                    color: selected ? p.color : "var(--text-secondary)",
                    border: selected
                      ? `1px solid ${p.color}`
                      : "1px solid var(--border-color)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Tag size={12} />
            Etiquetas
          </label>
          <input
            id="create-task-tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                const t = tagInput.trim().replace(/^#/, "");
                if (t && !tags.includes(t)) setTags([...tags, t]);
                setTagInput("");
              }
            }}
            placeholder="#etiqueta + Enter"
            className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
          <AnimatePresence>
            {tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-1.5 flex-wrap mt-2"
              >
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium"
                    style={{
                      backgroundColor: "var(--bg-info)",
                      color: "var(--text-link)",
                    }}
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="hover:opacity-70 transition-opacity"
                      style={{ color: "inherit" }}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl text-sm"
            role="alert"
            style={{
              backgroundColor: "var(--bg-error)",
              color: "var(--text-error)",
              border: "1px solid var(--border-color)",
            }}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div
          className="flex items-center justify-end gap-2 pt-3 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              reset();
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!title.trim()}
            icon={<Plus size={14} />}
          >
            Crear tarea
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
