"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useFormStore } from "@/stores/formStore";
import { uploadFormResponseFile } from "@/lib/storage";
import PendingFilesGrid from "@/components/attachments/PendingFilesGrid";
import {
  focusFirstInvalidField,
  notifyInvalidFields,
} from "@/lib/formValidation";
import { showToast } from "@/stores/toastStore";
import type { Question, ResponseFile } from "@/types";
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
  Upload,
  Film,
  Paperclip,
  AlertCircle,
  Loader2,
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
  file_upload: Paperclip,
  image_upload: FileText,
  video_upload: Film,
  linear_scale: Star,
  rating: Star,
  information: FileText,
  location: MapPin,
  confirmation: CheckSquare,
};

const FILE_QUESTION_TYPES = new Set([
  "file_upload",
  "image_upload",
  "video_upload",
]);

interface PendingFormFile {
  id: string;
  file: File;
  progress: number;
  uploading?: boolean;
  error?: string;
  uploaded?: {
    url: string;
    storagePath: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}

function genFileId() {
  return `ff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isImageType(q: Question) {
  return q.type === "image_upload";
}
function isVideoType(q: Question) {
  return q.type === "video_upload";
}
function acceptFor(q: Question): string {
  if (isImageType(q)) return "image/*";
  if (isVideoType(q)) return "video/*";
  return ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.json,.zip,.rar,image/*,video/*";
}

export default function FormPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const formId = params.formId as string;
  const { user } = useAuthStore();
  const { currentForm, getFormById } = useFormStore();

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [fileAnswers, setFileAnswers] = useState<
    Record<string, PendingFormFile[]>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (formId) {
      getFormById(formId);
    }
  }, [formId]);

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // ---- File question helpers ----
  const addFiles = (question: Question, fileList: FileList | null) => {
    if (!fileList?.length) return;
    const max = question.maxFiles ?? 5;
    const items: PendingFormFile[] = Array.from(fileList)
      .slice(0, Math.max(0, max - (fileAnswers[question.id]?.length ?? 0)))
      .map((file) => ({
        id: genFileId(),
        file,
        progress: 0,
      }));
    setFileAnswers((prev) => ({
      ...prev,
      [question.id]: [...(prev[question.id] ?? []), ...items],
    }));
    setErrors((prev) => {
      if (!prev[question.id]) return prev;
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
  };

  const removeFile = (questionId: string, fileId: string) => {
    setFileAnswers((prev) => {
      const list = prev[questionId] ?? [];
      return { ...prev, [questionId]: list.filter((f) => f.id !== fileId) };
    });
  };

  // ---- Validation ----
  const validateAnswer = (question: Question): string | null => {
    if (!question.isRequired) return null;
    const files = fileAnswers[question.id] ?? [];

    if (FILE_QUESTION_TYPES.has(question.type)) {
      if (files.length === 0) return "Debes adjuntar al menos un archivo";
      if (files.some((f) => f.error))
        return "Algunos archivos no se pudieron subir. Pulsa “Reintentar” o quítalos.";
      return null;
    }

    const a = answers[question.id];
    const empty = Array.isArray(a) ? a.length === 0 : !a || !String(a).trim();
    if (!empty) return null;

    switch (question.type) {
      case "date":
        return "Selecciona una fecha";
      case "time":
        return "Selecciona una hora";
      case "email":
        return "Introduce un correo electrónico válido";
      case "phone":
        return "Introduce un número de teléfono válido";
      case "number":
      case "linear_scale":
      case "rating":
        return "Introduce un número";
      case "confirmation":
        return "Debes confirmar esta opción";
      default:
        return "Este campo es obligatorio";
    }
  };

  const submittingRef = useRef(false);

  const handleSubmit = async () => {
    if (!currentForm || !user || submittingRef.current) return;

    const nextErrors: Record<string, string> = {};
    for (const q of currentForm.questions) {
      const msg = validateAnswer(q);
      if (msg && !nextErrors[q.id]) nextErrors[q.id] = msg;
    }
    const invalid = Object.keys(nextErrors).length;
    if (invalid > 0) {
      setErrors(nextErrors);
      focusFirstInvalidField();
      notifyInvalidFields(invalid);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setErrors({});

    const patchFile = (qid: string, id: string, update: Partial<PendingFormFile>) =>
      setFileAnswers((prev) => ({
        ...prev,
        [qid]: (prev[qid] ?? []).map((f) => (f.id === id ? { ...f, ...update } : f)),
      }));

    try {
      // Upload pending files; a failure does not stop the rest, and files
      // uploaded on a previous attempt are reused (collected locally because
      // state updates are asynchronous).
      const responseFiles: ResponseFile[] = [];
      const namesByQuestion: Record<string, string[]> = {};
      const failures: string[] = [];
      const fileQuestionIds = currentForm.questions
        .filter((q) => FILE_QUESTION_TYPES.has(q.type))
        .map((q) => q.id);

      for (const qid of fileQuestionIds) {
        namesByQuestion[qid] = [];
        for (const item of fileAnswers[qid] ?? []) {
          let up = item.uploaded;
          if (!up) {
            patchFile(qid, item.id, { uploading: true, progress: 0, error: undefined });
            try {
              up = await uploadFormResponseFile(formId, user.id, qid, item.file, (p) =>
                patchFile(qid, item.id, { progress: p }),
              );
              patchFile(qid, item.id, { uploading: false, progress: 100, uploaded: up });
            } catch (err) {
              const message =
                err instanceof Error && err.message
                  ? err.message
                  : item.file.type.startsWith("image/")
                    ? "No se pudo subir esta fotografía. Inténtalo nuevamente."
                    : "No se pudo subir este archivo. Inténtalo nuevamente.";
              failures.push(message);
              patchFile(qid, item.id, { uploading: false, error: message });
              continue;
            }
          }
          namesByQuestion[qid].push(up.fileName);
          responseFiles.push({
            id: `${qid}-${item.id}`,
            questionId: qid,
            fileName: up.fileName,
            fileType: up.fileType,
            fileSize: up.fileSize,
            url: up.url,
            storagePath: up.storagePath,
            uploadedAt: new Date().toISOString(),
          });
        }
      }

      if (failures.length > 0) {
        setErrors({
          __form:
            failures.length === 1
              ? failures[0]
              : `No se pudieron subir ${failures.length} archivos. Pulsa “Reintentar” en cada uno.`,
        });
        showToast({ variant: "error", message: "La respuesta aún no se envió", description: "Algunos archivos no se pudieron subir." });
        focusFirstInvalidField();
        return;
      }

      const finalAnswers: Record<string, string | string[]> = { ...answers, ...namesByQuestion };

      await useFormStore.getState().createResponse({
        formId,
        formVersion: 1,
        formTitle: currentForm.title,
        respondentId: user.id,
        respondentName: user.name,
        status: "submitted",
        answers: finalAnswers,
        files: responseFiles,
      });

      showToast({ variant: "success", message: "Respuesta enviada correctamente" });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit response:", err);
      const code = (err as { code?: string })?.code;
      const msg =
        code === "permission-denied"
          ? "No tienes permiso para responder este formulario."
          : err instanceof Error
            ? err.message
            : "No se pudo enviar la respuesta";
      setErrors({ __form: msg });
      showToast({ variant: "error", message: "No se pudo enviar la respuesta", description: msg });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const inputStyle = {
    border: "1px solid var(--border-input)",
    backgroundColor: "var(--bg-input)",
    color: "var(--text-primary)",
  } as const;

  const renderFileQuestion = (question: Question) => {
    const files = fileAnswers[question.id] ?? [];
    const questionError = errors[question.id];
    const fileInputId = `file-input-${question.id}`;

    return (
      <div>
        <input
          id={fileInputId}
          type="file"
          multiple={question.maxFiles !== 1}
          accept={acceptFor(question)}
          className="hidden"
          onChange={(e) => {
            addFiles(question, e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() =>
            document.getElementById(fileInputId)?.click()
          }
          className="w-full h-11 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          style={{
            border: `1px dashed ${questionError ? "#ef4444" : "var(--border-input)"}`,
            backgroundColor: "var(--bg-input)",
            color: questionError ? "#ef4444" : "var(--text-secondary)",
          }}
        >
          <Upload size={16} />
          {isImageType(question)
            ? "Añadir imágenes"
            : isVideoType(question)
              ? "Añadir videos"
              : "Añadir archivos"}
          <span className="text-xs opacity-70">
            (máx. {question.maxFiles ?? 5})
          </span>
        </button>

        {files.length > 0 && (
          <div className="mt-3">
            <PendingFilesGrid
              items={files.map((f) => ({
                id: f.id,
                file: f.file,
                progress: f.progress,
                error: f.error,
                status: f.uploaded
                  ? "done"
                  : f.uploading
                    ? "uploading"
                    : f.error
                      ? "error"
                      : loading
                        ? "pending"
                        : undefined,
              }))}
              onRemove={(id) => removeFile(question.id, id)}
              onRetry={() => void handleSubmit()}
              disabled={loading}
            />
          </div>
        )}

        {questionError && (
          <p data-field-error className="mt-2 text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
            <AlertCircle size={12} /> {questionError}
          </p>
        )}
      </div>
    );
  };

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id] || "";
    const questionError = errors[question.id];
    const errorBorder = questionError ? "1px solid #ef4444" : undefined;

    const errorText = questionError && (
      <p data-field-error className="mt-2 text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
        <AlertCircle size={12} /> {questionError}
      </p>
    );

    switch (question.type) {
      case "short_text":
        return (
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder="Tu respuesta"
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{ ...inputStyle, border: errorBorder ?? inputStyle.border }}
            />
            {errorText}
          </div>
        );

      case "paragraph":
        return (
          <div>
            <textarea
              value={value}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder="Tu respuesta"
              rows={4}
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none"
              style={{ ...inputStyle, border: errorBorder ?? inputStyle.border }}
            />
            {errorText}
          </div>
        );

      case "multiple_choice":
        return (
          <div>
            <div className="space-y-2">
              {question.options?.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:border-[var(--border-input-focus)] transition-all"
                  style={{
                    borderColor: questionError ? "#ef4444" : "var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={opt.id}
                    checked={value === opt.id}
                    onChange={(e) => setAnswer(question.id, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
                </label>
              ))}
            </div>
            {errorText}
          </div>
        );

      case "checkbox":
        return (
          <div>
            <div className="space-y-2">
              {question.options?.map((opt) => (
                <label
                  key={opt.id}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:border-[var(--border-input-focus)] transition-all"
                  style={{
                    borderColor: questionError ? "#ef4444" : "var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(value as string[] || []).includes(opt.id)}
                    onChange={(e) => {
                      const current = (value as string[]) || [];
                      if (e.target.checked) {
                        setAnswer(question.id, [...current, opt.id]);
                      } else {
                        setAnswer(
                          question.id,
                          current.filter((id) => id !== opt.id),
                        );
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
                </label>
              ))}
            </div>
            {errorText}
          </div>
        );

      case "dropdown":
        return (
          <div>
            <select
              value={value}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{ ...inputStyle, border: errorBorder ?? inputStyle.border }}
            >
              <option value="">Selecciona una opción</option>
              {question.options?.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            {errorText}
          </div>
        );

      case "date":
        return (
          <div>
            <input
              type="date"
              value={value}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{ ...inputStyle, border: errorBorder ?? inputStyle.border }}
            />
            {errorText}
          </div>
        );

      case "time":
        return (
          <div>
            <input
              type="time"
              step={60}
              value={value}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{ ...inputStyle, border: errorBorder ?? inputStyle.border }}
            />
            {errorText}
          </div>
        );

      case "number":
      case "linear_scale":
        return (
          <div>
            <input
              type="number"
              value={value}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder="Tu respuesta"
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{ ...inputStyle, border: errorBorder ?? inputStyle.border }}
            />
            {errorText}
          </div>
        );

      case "phone":
        return (
          <div>
            <input
              type="tel"
              value={value}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder="Ej: 809-555-1234"
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{ ...inputStyle, border: errorBorder ?? inputStyle.border }}
            />
            {errorText}
          </div>
        );

      case "email":
        return (
          <div>
            <input
              type="email"
              value={value}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{ ...inputStyle, border: errorBorder ?? inputStyle.border }}
            />
            {errorText}
          </div>
        );

      case "rating":
        return (
          <div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAnswer(question.id, String(n))}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor:
                      Number(value) >= n ? "#fbbf24" : "var(--bg-secondary)",
                  }}
                >
                  <Star
                    size={20}
                    style={{
                      color: Number(value) >= n ? "#b45309" : "var(--text-tertiary)",
                    }}
                  />
                </button>
              ))}
            </div>
            {errorText}
          </div>
        );

      case "file_upload":
      case "image_upload":
      case "video_upload":
        return renderFileQuestion(question);

      case "information":
        return (
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)]">
            {question.description || question.title}
          </div>
        );

      case "confirmation":
        return (
          <div>
            <label
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
              style={{
                borderColor: questionError ? "#ef4444" : "var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <input
                type="checkbox"
                checked={value === "true"}
                onChange={(e) =>
                  setAnswer(
                    question.id,
                    e.target.checked ? "true" : "",
                  )
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-[var(--text-primary)]">{question.title}</span>
            </label>
            {errorText}
          </div>
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

          {/* Submit-level error (e.g. storage failure) */}
          {errors.__form && (
            <div
              className="p-4 rounded-xl flex items-start gap-3"
              style={{
                backgroundColor: "var(--bg-error, #fef2f2)",
                border: "1px solid #fecaca",
              }}
            >
              <AlertCircle size={18} style={{ color: "#dc2626" }} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium" style={{ color: "#dc2626" }}>
                  No se pudo enviar la respuesta
                </p>
                <p className="text-xs mt-1" style={{ color: "#b91c1c" }}>
                  {errors.__form} Tus respuestas y archivos siguen guardados; puedes
                  intentarlo de nuevo.
                </p>
              </div>
            </div>
          )}

          {/* Questions */}
          {currentForm?.questions.map((question, index) => (
            <motion.div
              key={question.id}
              ref={(el) => {
                questionRefs.current[question.id] = el;
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 rounded-2xl border bg-[var(--bg-card)]"
              style={{
                borderColor: errors[question.id] ? "#ef4444" : "var(--border-color)",
              }}
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
                icon={
                  loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )
                }
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
