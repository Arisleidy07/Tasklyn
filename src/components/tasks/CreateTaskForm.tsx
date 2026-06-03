"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import type { Task } from "@/types";
import { Plus, X, Phone, MapPin, Tag, Flag } from "lucide-react";
import { motion } from "framer-motion";

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
    "low" | "medium" | "high" | "urgent" | undefined
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
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group"
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
      className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xl shadow-gray-200/50"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Título */}
        <AutoResizeTextarea
          value={title}
          onChange={setTitle}
          placeholder="¿Qué necesitas hacer?"
          autoFocus
          className="text-base font-semibold text-gray-900 placeholder:text-gray-300"
          minRows={1}
        />

        {/* Descripción */}
        <AutoResizeTextarea
          value={description}
          onChange={setDescription}
          placeholder="Añade una descripción..."
          className="text-sm text-gray-600 placeholder:text-gray-300"
          minRows={1}
        />

        {/* Ubicación */}
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
          <AutoResizeTextarea
            value={location}
            onChange={setLocation}
            placeholder="Ubicación o dirección"
            className="text-sm text-gray-700 placeholder:text-gray-300"
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
                className="flex-1 text-sm text-gray-700 placeholder:text-gray-300"
                minRows={1}
              />
              {phoneNumbers.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePhone(index)}
                  className="p-1 rounded-md text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPhone}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-6"
          >
            <Plus size={12} />
            Agregar teléfono
          </button>
        </div>

        {/* Priority + Tags row */}
        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Flag size={13} className="text-gray-300" />
            <select
              value={priority || ""}
              onChange={(e) =>
                setPriority((e.target.value as any) || undefined)
              }
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Prioridad</option>
              <option value="urgent">🔴 Crítica</option>
              <option value="high">🟠 Alta</option>
              <option value="medium">🟡 Media</option>
              <option value="low">🟢 Baja</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
            <Tag size={13} className="text-gray-300 flex-shrink-0" />
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
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium"
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
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
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
