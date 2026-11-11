"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useFormStore } from "@/stores/formStore";
import type { Form, FormResponse } from "@/types";
import {
  ArrowLeft,
  Download,
  Trash2,
  Calendar,
  User,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Header from "@/components/layout/Header";

export default function FormResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const formId = params.formId as string;
  const { user } = useAuthStore();
  const { currentForm, responses, subscribeToResponses, deleteResponse } =
    useFormStore();

  const [filter, setFilter] = useState<"all" | "submitted" | "draft">("all");

  useEffect(() => {
    if (formId) {
      subscribeToResponses(formId);
    }
    return () => useFormStore.getState().unsubscribeFromResponses(formId);
  }, [formId]);

  const formResponses = responses[formId] || [];
  const filteredResponses = formResponses.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const handleDelete = async (responseId: string) => {
    if (!confirm("¿Eliminar esta respuesta?")) return;
    try {
      await deleteResponse(formId, responseId);
    } catch (error) {
      console.error("Failed to delete response:", error);
      alert("No se pudo eliminar la respuesta");
    }
  };

  const handleExportCSV = () => {
    if (!currentForm || filteredResponses.length === 0) return;

    const headers = [
      "Respondente",
      "Fecha",
      "Estado",
      ...currentForm.questions.map((q) => q.title),
    ];
    const rows = filteredResponses.map((r) => [
      r.respondentName,
      new Date(r.submittedAt).toLocaleString("es-ES"),
      r.status,
      ...currentForm.questions.map((q) => {
        const answer = r.answers[q.id];
        if (Array.isArray(answer)) return answer.join(", ");
        return answer || "";
      }),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentForm.title}_respuestas.csv`;
    a.click();
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <Header
        title="Respuestas"
        showMenuButton={true}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={<Download size={16} />}
              onClick={handleExportCSV}
              disabled={filteredResponses.length === 0}
            >
              Exportar CSV
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<ArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              Volver
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {currentForm?.title}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {filteredResponses.length} respuesta
                {filteredResponses.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[
                { id: "all", label: "Todas" },
                { id: "submitted", label: "Enviadas" },
                { id: "draft", label: "Borradores" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as typeof filter)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor:
                      filter === f.id ? "var(--bg-info)" : "transparent",
                    color:
                      filter === f.id
                        ? "var(--text-link)"
                        : "var(--text-secondary)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Responses */}
          {filteredResponses.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)]">
              <CheckCircle2
                size={32}
                className="text-[var(--text-tertiary)] mx-auto mb-3"
              />
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                No hay respuestas
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Las respuestas aparecerán aquí cuando los usuarios envíen el
                formulario
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResponses.map((response) => (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-input-focus)] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                          style={{
                            backgroundColor:
                              response.status === "submitted"
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(245, 158, 11, 0.1)",
                            color:
                              response.status === "submitted"
                                ? "#10b981"
                                : "#f59e0b",
                          }}
                        >
                          {response.status === "submitted" ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span className="ml-1">Enviada</span>
                            </>
                          ) : (
                            <>
                              <Clock size={12} />
                              <span className="ml-1">Borrador</span>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {new Date(response.submittedAt).toLocaleString(
                            "es-ES",
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <User
                          size={14}
                          className="text-[var(--text-tertiary)]"
                        />
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {response.respondentName}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {currentForm?.questions.slice(0, 3).map((question) => (
                          <div key={question.id} className="text-sm">
                            <span className="text-[var(--text-tertiary)]">
                              {question.title}:
                            </span>
                            <span className="text-[var(--text-secondary)] ml-2">
                              {Array.isArray(response.answers[question.id])
                                ? response.answers[question.id].join(", ")
                                : response.answers[question.id] || "-"}
                            </span>
                          </div>
                        ))}
                        {currentForm && currentForm.questions.length > 3 && (
                          <p className="text-xs text-[var(--text-tertiary)]">
                            +{currentForm.questions.length - 3} preguntas más
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(response.id)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
