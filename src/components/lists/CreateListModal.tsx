"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useListStore } from "@/stores/listStore";
import { useAuthStore } from "@/stores/authStore";
import { ListType } from "@/types";
import { canCreateMoreLists } from "@/lib/permissions";
import { List, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateListModal({
  isOpen,
  onClose,
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ListType>("personal");
  const { user } = useAuthStore();
  const { createList, getUserLists } = useListStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    const userLists = getUserLists(user.id);
    if (!canCreateMoreLists(userLists.length, user.plan)) {
      return;
    }

    createList(name.trim(), user.id, type);
    setName("");
    setType("personal");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva lista"
      description="Organiza tus tareas en una lista dedicada."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nombre de la lista"
          placeholder="Ej. Proyecto Alpha, Compras, Objetivos Q4..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tipo de lista
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("personal")}
              className={cn(
                "flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                type === "personal"
                  ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-100"
                  : "border-gray-200 hover:border-blue-200 hover:bg-gray-50",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  type === "personal" ? "bg-blue-100" : "bg-gray-100",
                )}
              >
                <Lock
                  size={18}
                  className={
                    type === "personal" ? "text-blue-600" : "text-gray-400"
                  }
                />
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    type === "personal" ? "text-blue-700" : "text-gray-700",
                  )}
                >
                  Personal
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Solo tú</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType("shared")}
              className={cn(
                "flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                type === "shared"
                  ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-100"
                  : "border-gray-200 hover:border-blue-200 hover:bg-gray-50",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  type === "shared" ? "bg-blue-100" : "bg-gray-100",
                )}
              >
                <List
                  size={18}
                  className={
                    type === "shared" ? "text-blue-600" : "text-gray-400"
                  }
                />
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    type === "shared" ? "text-blue-700" : "text-gray-700",
                  )}
                >
                  Compartida
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Colaborar</p>
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Crear lista
          </Button>
        </div>
      </form>
    </Modal>
  );
}
