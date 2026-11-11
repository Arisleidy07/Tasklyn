"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useFormStore } from "@/stores/formStore";
import type { Form, Question } from "@/types";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Clock,
  Type,
  AlignLeft,
  List,
  Calendar,
  Star,
  FileText,
  MapPin,
  CheckSquare,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";

const QUESTION_ICONS: Record<string, React.ElementType> = {
  short_text: Type,
  paragraph: AlignLeft,
  multiple_choice: List,
  checkbox: CheckSquare,
  dropdown: List,
  date: Calendar,
  time: Clock,
  number: Star,
  phone: Star,
  email: Star,
  information: FileText,
  location: MapPin,
  confirmation: CheckSquare,
};

export default function FormPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const formId = params.formId as string;
  const { user } = useAuthStore();
  const { currentForm, getFormById } = useFormStore();

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formId) {
      getFormById(formId);
    }
  }, [formId]);

  const handleSubmit = async () => {
    if (!currentForm || !user) return;

    // Validate required questions
    const missing = currentForm.questions.filter(
      (q) => {
        if (!q.isRequired) return false;
        const a = answers[q.id];
        return Array.isArray(a) ? a.length === 0 : !a?.trim();
      }
    );

    if (missing.length > 0) {
      alert(`Por favor responde todas las preguntas obligatorias (${missing.length})`);
      return;
    }

    setLoading(true);

    try {
      await useFormStore.getState().createResponse({
        formId,
        formVersion: 1,
        formTitle: currentForm.title,
        respondentId: user.id,
        respondentName: user.name,
        status: "submitted",
        answers,
        files: [],
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit response:", err);
      alert("No se pudo enviar la respuesta");
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id] || "";

    switch (question.type) {
      case "short_text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Tu respuesta"
            className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
        );

      case "paragraph":
        return (
          <textarea
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Tu respuesta"
            rows={4}
            className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
        );

      case "multiple_choice":
        return (
          <div className="space-y-2">
            {question.options?.map((opt) => (
              <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer hover:border-[var(--border-input-focus)] transition-all">
                <input
                  type="radio"
                  name={question.id}
                  value={opt.id}
                  checked={value === opt.id}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {question.options?.map((opt) => (
              <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer hover:border-[var(--border-input-focus)] transition-all">
                <input
                  type="checkbox"
                  checked={(value as string[] || []).includes(opt.id)}
                  onChange={(e) => {
                    const current = value as string[] || [];
                    if (e.target.checked) {
                      setAnswers({ ...answers, [question.id]: [...current, opt.id] });
                    } else {
                      setAnswers({ ...answers, [question.id]: current.filter((id) => id !== opt.id) });
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case "dropdown":
        return (
          <select
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">Selecciona una opción</option>
            {question.options?.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            placeholder="Tu respuesta"
            className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
        );

      case "information":
        return (
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)]">
            {question.description || question.title}
          </div>
        );

      case "confirmation":
        return (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={value === "true"}
              onChange={(e) =>
                setAnswers({
                  ...answers,
                  [question.id]: e.target.checked ? "true" : "",
                })
              }
              className="w-4 h-4"
            />
            <span className="text-sm text-[var(--text-primary)]">{question.title}</span>
          </label>
        );

      default:
        return (
          <div className="p-4 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] text-center">
            <p className="text-sm text-[var(--text-tertiary)]">
              Tipo de pregunta no soportado: {question.type}
            </p>
          </div>
        );
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] max-w-md"
        >
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            ¡Respuesta enviada!
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Gracias por completar el formulario.
          </p>
          <Button onClick={() => router.push(`/teams/${teamId}`)}>
            Volver al equipo
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <Header
        title={currentForm?.title || "Formulario"}
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

      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Form Header */}
          {currentForm && (
            <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-center">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {currentForm.title}
              </h1>
              {currentForm.description && (
                <p className="text-[var(--text-secondary)]">{currentForm.description}</p>
              )}
            </div>
          )}

          {/* Questions */}
          {currentForm?.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]"
            >
              <div className="flex items-start gap-3 mb-4">
                {QUESTION_ICONS[question.type] && (
                  <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--bg-secondary)" }}>
                    {React.createElement(QUESTION_ICONS[question.type], { size: 16, className: "text-[var(--text-link)" })}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {index + 1}. {question.title}
                    {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {question.description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {question.description}
                    </p>
                  )}
                </div>
              </div>

              {renderQuestionInput(question)}
            </motion.div>
          ))}

          {/* Submit */}
          {currentForm && currentForm.questions.length > 0 && (
            <div className="flex justify-end">
              <Button
                size="lg"
                icon={<Send size={16} />}
                onClick={handleSubmit}
                isLoading={loading}
              >
                Enviar respuesta
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
