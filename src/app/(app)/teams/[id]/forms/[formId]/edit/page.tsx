"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useFormStore } from "@/stores/formStore";
import type { Form, Question, QuestionType } from "@/types";
import {
  ArrowLeft,
  Save,
  Eye,
  Trash2,
  Plus,
  GripVertical,
  Settings,
  Type,
  AlignLeft,
  List,
  Calendar,
  Clock,
  Hash,
  Phone,
  Mail,
  Upload,
  Image as ImageIcon,
  Video,
  Star,
  FileText,
  MapPin,
  CheckSquare,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";

const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ElementType }[] = [
  { type: "short_text", label: "Texto corto", icon: Type },
  { type: "paragraph", label: "Párrafo", icon: AlignLeft },
  { type: "multiple_choice", label: "Opción múltiple", icon: List },
  { type: "checkbox", label: "Casillas", icon: CheckSquare },
  { type: "dropdown", label: "Lista desplegable", icon: List },
  { type: "date", label: "Fecha", icon: Calendar },
  { type: "time", label: "Hora", icon: Clock },
  { type: "number", label: "Número", icon: Hash },
  { type: "phone", label: "Teléfono", icon: Phone },
  { type: "email", label: "Email", icon: Mail },
  { type: "file_upload", label: "Archivo", icon: Upload },
  { type: "image_upload", label: "Imagen", icon: ImageIcon },
  { type: "video_upload", label: "Video", icon: Video },
  { type: "linear_scale", label: "Escala", icon: Star },
  { type: "rating", label: "Calificación", icon: Star },
  { type: "information", label: "Información", icon: FileText },
  { type: "location", label: "Ubicación", icon: MapPin },
  { type: "confirmation", label: "Confirmación", icon: CheckSquare },
];

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const formId = params.formId as string;
  const { user } = useAuthStore();
  const { currentForm, updateForm, getFormById } = useFormStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (formId) {
      getFormById(formId);
    }
  }, [formId]);

  useEffect(() => {
    if (currentForm) {
      setTitle(currentForm.title);
      setDescription(currentForm.description || "");
      setQuestions(currentForm.questions || []);
    }
  }, [currentForm]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateForm(formId, {
        title: title.trim(),
        description: description.trim() || undefined,
        questions,
      });
    } catch (err) {
      console.error("Failed to save form:", err);
      setError("No se pudo guardar el formulario");
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type,
      title: "Nueva pregunta",
      order: questions.length,
      isRequired: false,
    };

    setQuestions([...questions, newQuestion]);
    setShowAddQuestion(false);
    setEditingQuestion(newQuestion);
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
    );
  };

  const deleteQuestion = (questionId: string) => {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    setQuestions(questions.filter((q) => q.id !== questionId));
    if (editingQuestion?.id === questionId) {
      setEditingQuestion(null);
    }
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, moved);
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <Header
        title="Editar Formulario"
        showMenuButton={true}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={<Eye size={16} />}
              onClick={() => router.push(`/teams/${teamId}/forms/${formId}`)}
            >
              Vista previa
            </Button>
            <Button
              size="sm"
              icon={<Save size={16} />}
              onClick={handleSave}
              isLoading={saving}
            >
              Guardar
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
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
                  rows={2}
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
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Preguntas ({questions.length})
              </h2>
              <Button
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowAddQuestion(true)}
              >
                Agregar pregunta
              </Button>
            </div>

            <AnimatePresence>
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-input-focus)] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 mt-2">
                      <button
                        onClick={() => moveQuestion(index, index - 1)}
                        disabled={index === 0}
                        className="p-1 rounded transition-colors disabled:opacity-30"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveQuestion(index, index + 1)}
                        disabled={index === questions.length - 1}
                        className="p-1 rounded transition-colors disabled:opacity-30"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {QUESTION_TYPES.find(t => t.type === question.type)?.label}
                        </span>
                        {question.isRequired && (
                          <span className="text-xs text-red-500 font-medium">* Obligatorio</span>
                        )}
                      </div>
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {question.title}
                      </h3>
                      {question.description && (
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          {question.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingQuestion(question)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {questions.length === 0 && (
              <div className="text-center py-12 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)]">
                <FileText
                  size={32}
                  className="text-[var(--text-tertiary)] mx-auto mb-3"
                />
                <p className="text-sm text-[var(--text-secondary)]">
                  No hay preguntas
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Agrega tu primera pregunta para empezar
                </p>
              </div>
            )}
          </div>

          {/* Add Question Modal */}
          <AnimatePresence>
            {showAddQuestion && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-50"
                  onClick={() => setShowAddQuestion(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xl z-50 overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-[var(--border-color)]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Agregar pregunta
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {QUESTION_TYPES.map((qt) => (
                        <button
                          key={qt.type}
                          onClick={() => addQuestion(qt.type)}
                          className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--border-input-focus)] transition-all text-left"
                        >
                          <qt.icon size={20} className="text-[var(--text-link)] mb-2" />
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {qt.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Edit Question Modal */}
          <AnimatePresence>
            {editingQuestion && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-50"
                  onClick={() => setEditingQuestion(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xl z-50 overflow-hidden flex flex-col"
                >
                  <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Editar pregunta
                    </h3>
                    <button
                      onClick={() => setEditingQuestion(null)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={editingQuestion.title}
                        onChange={(e) =>
                          updateQuestion(editingQuestion.id, { title: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                        style={{
                          border: "1px solid var(--border-input)",
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={editingQuestion.description || ""}
                        onChange={(e) =>
                          updateQuestion(editingQuestion.id, { description: e.target.value })
                        }
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl text-base outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none"
                        style={{
                          border: "1px solid var(--border-input)",
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="required"
                        checked={editingQuestion.isRequired}
                        onChange={(e) =>
                          updateQuestion(editingQuestion.id, { isRequired: e.target.checked })
                        }
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor="required" className="text-sm text-[var(--text-secondary)]">
                        Obligatorio
                      </label>
                    </div>
                  </div>
                  <div className="p-4 border-t border-[var(--border-color)] flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setEditingQuestion(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => setEditingQuestion(null)}
                    >
                      Listo
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
