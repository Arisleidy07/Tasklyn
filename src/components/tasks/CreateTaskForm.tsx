"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import type { Task } from "@/types";
import { Plus, X, Phone, MapPin, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { getPriorityConfig, PRIORITY_CONFIG } from "@/lib/priority";

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

  const { user } = useAuthStore();
  const { createTask } = useTaskStore();

  const handleAddPhone = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
  };

  const handleRemovePhone = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...phoneNumbers];
    newPhones[index] = value;
    setPhoneNumbers(newPhones);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    // Filter out empty phone numbers
    const validPhones = phoneNumbers.filter((p) => p.trim());

    createTask({
      listId,
      title: title.trim(),
      description: description.trim(),
      createdBy: user.id,
      location: location.trim() || undefined,
      phoneNumbers: validPhones.length > 0 ? validPhones : undefined,
      priority: priority || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    setTitle("");
    setDescription("");
    setLocation("");
    setPhoneNumbers([""]);
    setPriority(undefined);
    setTags([]);
    setTagInput("");
    setIsOpen(false);
    onCreated?.();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group"
        style={{
          borderColor: "var(--border-color)",
          color: "var(--text-tertiary)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#93c5fd";
          e.currentTarget.style.color = "#3b82f6";
          e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-color)";
          e.currentTarget.style.color = "var(--text-tertiary)";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
          <Plus size={14} className="text-blue-600" />
        </div>
        <span className="text-sm font-medium">Agregar tarea</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5 shadow-xl"
      style={{
        border: "1px solid rgba(37,99,235,0.25)",
        backgroundColor: "var(--bg-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Título */}
        <AutoResizeTextarea
          value={title}
          onChange={setTitle}
          placeholder="¿Qué necesitas hacer?"
          autoFocus
          className="text-base font-semibold"
          minRows={1}
        />

        {/* Descripción */}
        <AutoResizeTextarea
          value={description}
          onChange={setDescription}
          placeholder="Añade una descripción..."
          className="text-sm"
          minRows={1}
        />

        {/* Ubicación */}
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
          <AutoResizeTextarea
            value={location}
            onChange={setLocation}
            placeholder="Ubicación o dirección"
            className="text-sm"
            minRows={1}
          />
        </div>

        {/* Teléfonos */}
        <div className="space-y-1.5">
          {phoneNumbers.map((phone, index) => (
            <div key={index} className="flex items-start gap-2">
              <Phone size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
              <AutoResizeTextarea
                value={phone}
                onChange={(v) => handlePhoneChange(index, v)}
                placeholder={`Teléfono ${index + 1}`}
                className="flex-1 text-sm"
                minRows={1}
              />
              {phoneNumbers.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePhone(index)}
                  className="p-1 rounded-md transition-colors flex-shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-tertiary)";
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPhone}
            className="flex items-center gap-1.5 text-xs transition-colors ml-6"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-tertiary)";
            }}
          >
            <Plus size={12} />
            Agregar teléfono
          </button>
        </div>

        {/* Priority selector */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm leading-none">
              {getPriorityConfig(priority).emoji}
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              Prioridad
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              Object.entries(PRIORITY_CONFIG) as [
                keyof typeof PRIORITY_CONFIG,
                (typeof PRIORITY_CONFIG)[keyof typeof PRIORITY_CONFIG],
              ][]
            ).map(([value, cfg]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setPriority(priority === value ? undefined : value)
                }
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                  priority === value
                    ? `${cfg.dot.replace("bg-", "bg-").replace("500", "500")} text-white border-transparent`
                    : `${cfg.bg} ${cfg.bgDark} ${cfg.text} ${cfg.textDark} ${cfg.border} ${cfg.borderDark}`
                }`}
                style={
                  priority === value
                    ? {
                        backgroundColor: cfg.dot.includes("red")
                          ? "#ef4444"
                          : cfg.dot.includes("orange")
                            ? "#f97316"
                            : cfg.dot.includes("yellow")
                              ? "#eab308"
                              : cfg.dot.includes("blue")
                                ? "#3b82f6"
                                : "#22c55e",
                        color: "white",
                        borderColor: "transparent",
                      }
                    : {}
                }
              >
                <span className="text-[9px] leading-none">{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
            {priority && (
              <button
                type="button"
                onClick={() => setPriority(undefined)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all flex items-center gap-1"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-tertiary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                  e.currentTarget.style.backgroundColor =
                    "rgba(239,68,68,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X size={9} />
                Quitar
              </button>
            )}
          </div>
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-1.5">
          <Tag
            size={13}
            style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
          />
          <input
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
            className="flex-1 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  backgroundColor: "rgba(37,99,235,0.08)",
                  color: "#2563eb",
                }}
              >
                #{t}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="hover:text-red-500"
                >
                  <X size={9} />
                </button>
              </span>
            ))}
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
              setTitle("");
              setDescription("");
              setLocation("");
              setPhoneNumbers([""]);
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
            Crear
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
