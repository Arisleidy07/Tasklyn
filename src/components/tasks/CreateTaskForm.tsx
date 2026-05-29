"use client";

import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { Plus, X, Phone, MapPin, FileText } from "lucide-react";
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
    });

    setTitle("");
    setDescription("");
    setLocation("");
    setPhoneNumbers([""]);
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Título de la tarea
          </label>
          <Input
            placeholder="Ej: Instalar router principal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="text-sm"
          />
        </div>

        {/* Phone Numbers - Dynamic */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <Phone size={12} className="text-gray-400" />
            Teléfonos
          </label>
          <AnimatePresence mode="popLayout">
            {phoneNumbers.map((phone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                className="flex items-center gap-2"
              >
                <Input
                  type="tel"
                  placeholder={`Teléfono ${index + 1}`}
                  value={phone}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  className="text-sm flex-1"
                />
                {phoneNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhone(index)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleAddPhone}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
              <Plus size={12} />
            </div>
            Agregar otro teléfono
          </button>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <MapPin size={12} className="text-gray-400" />
            Ubicación
          </label>
          <Input
            placeholder="Dirección o enlace de Google Maps"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <FileText size={12} className="text-gray-400" />
            Descripción
          </label>
          <Textarea
            placeholder="Detalles adicionales de la tarea..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
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
            Crear tarea
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
