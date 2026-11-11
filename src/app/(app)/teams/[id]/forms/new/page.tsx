"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useFormStore } from "@/stores/formStore";
import { useTeamStore } from "@/stores/teamStore";
import type { Form, Question, QuestionType } from "@/types";
import {
  ArrowLeft,
  Save,
  Eye,
  Trash2,
  Plus,
  GripVertical,
  Settings,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";

export default function NewFormPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { user } = useAuthStore();
  const { createForm, setCurrentForm } = useFormStore();
  const { currentTeam } = useTeamStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formId = await createForm({
        teamId,
        title: title.trim(),
        description: description.trim() || undefined,
        status: "draft",
        createdBy: user!.id,
        createdByName: user!.name,
        questions: [],
        settings: {
          allowResponses: true,
          requireLogin: true,
          collectEmail: false,
          showProgressBar: true,
          shuffleQuestions: false,
        },
      });

      router.push(`/teams/${teamId}/forms/${formId}/edit`);
    } catch (err) {
      console.error("Failed to create form:", err);
      setError("No se pudo crear el formulario");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <Header
        title="Nuevo Formulario"
        showMenuButton={true}
        actions={
          <Button
            size="sm"
            variant="ghost"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Volver
          </Button>
        }
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Formulario básico */}
          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Información del formulario
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Encuesta de satisfacción"
                  className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el propósito de este formulario..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                icon={<Save size={16} />}
                onClick={handleCreate}
                isLoading={loading}
                disabled={!title.trim()}
              >
                Crear formulario
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)]">
            <p className="text-sm text-[var(--text-secondary)]">
              Después de crear el formulario, podrás agregar preguntas, configurar
              opciones y personalizar el diseño.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
