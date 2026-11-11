"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFormStore } from "@/stores/formStore";
import { useAuthStore } from "@/stores/authStore";
import type { Form, FormStatus } from "@/types";
import {
  FileText,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Archive,
  BarChart3,
  Clock,
  CheckCircle2,
  Pause,
  Play,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

interface FormListProps {
  teamId: string;
  isOwnerOrAdmin: boolean;
}

export default function FormList({ teamId, isOwnerOrAdmin }: FormListProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { forms, loading, deleteForm, updateForm } = useFormStore();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "draft" | "published" | "archived"
  >("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredForms = forms.filter((form) => {
    if (activeFilter === "all") return true;
    return form.status === activeFilter;
  });

  const getStatusIcon = (status: FormStatus) => {
    switch (status) {
      case "published":
        return <CheckCircle2 size={14} className="text-green-500" />;
      case "paused":
        return <Pause size={14} className="text-amber-500" />;
      case "archived":
        return <Archive size={14} className="text-gray-500" />;
      default:
        return <Clock size={14} className="text-blue-500" />;
    }
  };

  const getStatusLabel = (status: FormStatus) => {
    switch (status) {
      case "published":
        return "Publicado";
      case "paused":
        return "Pausado";
      case "archived":
        return "Archivado";
      default:
        return "Borrador";
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("¿Estás seguro de eliminar este formulario?")) return;
    try {
      await deleteForm(formId);
      setMenuOpen(null);
    } catch (error) {
      console.error("Failed to delete form:", error);
      alert("No se pudo eliminar el formulario");
    }
  };

  const handleDuplicate = async (form: Form) => {
    try {
      const newForm = await useFormStore.getState().createForm({
        ...form,
        title: `${form.title} (copia)`,
        status: "draft",
      });
      router.push(`/teams/${teamId}/forms/${newForm}`);
    } catch (error) {
      console.error("Failed to duplicate form:", error);
      alert("No se pudo duplicar el formulario");
    }
  };

  const handleArchive = async (formId: string, currentStatus: FormStatus) => {
    try {
      await updateForm(formId, {
        status: currentStatus === "archived" ? "draft" : "archived",
      });
      setMenuOpen(null);
    } catch (error) {
      console.error("Failed to archive form:", error);
      alert("No se pudo archivar el formulario");
    }
  };

  const handleTogglePublish = async (
    formId: string,
    currentStatus: FormStatus,
  ) => {
    try {
      const newStatus: FormStatus =
        currentStatus === "published" ? "paused" : "published";
      await updateForm(formId, {
        status: newStatus,
        publishedAt:
          newStatus === "published" ? new Date().toISOString() : undefined,
      });
      setMenuOpen(null);
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      alert("No se pudo cambiar el estado del formulario");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-[var(--text-link)]" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {filteredForms.length} formulario
            {filteredForms.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isOwnerOrAdmin && (
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => router.push(`/teams/${teamId}/forms/new`)}
          >
            Crear formulario
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {[
          { id: "all", label: "Todos" },
          { id: "draft", label: "Borradores" },
          { id: "published", label: "Publicados" },
          { id: "archived", label: "Archivados" },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor:
                activeFilter === filter.id ? "var(--bg-info)" : "transparent",
              color:
                activeFilter === filter.id
                  ? "var(--text-link)"
                  : "var(--text-secondary)",
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Form List */}
      {filteredForms.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)]">
          <FileText
            size={32}
            className="text-[var(--text-tertiary)] mx-auto mb-3"
          />
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            No hay formularios
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {activeFilter === "all"
              ? "Crea tu primer formulario para empezar"
              : `No hay formularios ${getStatusLabel(activeFilter as FormStatus).toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filteredForms.map((form) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-input-focus)] transition-all cursor-pointer group"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  router.push(`/teams/${teamId}/forms/${form.id}/responses`);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">
                        {form.title}
                      </h3>
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {getStatusIcon(form.status)}
                        <span className="ml-1">
                          {getStatusLabel(form.status)}
                        </span>
                      </div>
                    </div>
                    {form.description && (
                      <p className="text-sm text-[var(--text-secondary)] truncate mb-2">
                        {form.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <BarChart3 size={12} />
                        {form.responseCount} respuestas
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {form.questions.length} preguntas
                      </span>
                      <span>
                        Actualizado{" "}
                        {new Date(form.updatedAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>

                  {/* Menu button */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === form.id ? null : form.id);
                      }}
                      className="p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    <AnimatePresence>
                      {menuOpen === form.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-8 w-48 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl z-20 overflow-hidden"
                          >
                            {isOwnerOrAdmin && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/teams/${teamId}/forms/${form.id}/edit`,
                                    );
                                    setMenuOpen(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--bg-secondary)] transition-colors"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  <Edit3 size={14} />
                                  Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePublish(form.id, form.status);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--bg-secondary)] transition-colors"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {form.status === "published" ? (
                                    <>
                                      <Pause size={14} />
                                      Pausar
                                    </>
                                  ) : (
                                    <>
                                      <Play size={14} />
                                      Publicar
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(form);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--bg-secondary)] transition-colors"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  <Copy size={14} />
                                  Duplicar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchive(form.id, form.status);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--bg-secondary)] transition-colors"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  <Archive size={14} />
                                  {form.status === "archived"
                                    ? "Desarchivar"
                                    : "Archivar"}
                                </button>
                                <div className="h-px bg-[var(--border-color)]" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(form.id);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-50 transition-colors text-red-600"
                                >
                                  <Trash2 size={14} />
                                  Eliminar
                                </button>
                              </>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
