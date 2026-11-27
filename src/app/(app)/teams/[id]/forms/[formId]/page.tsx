"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useFormStore } from "@/stores/formStore";
import { uploadFormResponseFile } from "@/lib/storage";
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
  X,
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
  previewUrl: string;
  progress: number;
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        previewUrl: URL.createObjectURL(file),
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
      const target = list.find((f) => f.id === fileId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return { ...prev, [questionId]: list.filter((f) => f.id !== fileId) };
    });
  };

  // ---- Validation ----
  const validateAnswer = (question: Question): string | null => {
    if (!question.isRequired) return null;
    const files = fileAnswers[question.id] ?? [];

    if (FILE_QUESTION_TYPES.has(question.type)) {
      if (files.length === 0) return "Debes adjuntar al menos un archivo";
      if (files.some((f) => f.error)) return "Corrige los archivos con error";
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

  const scrollToFirstError = (firstId: string) => {
    requestAnimationFrame(() => {
      questionRefs.current[firstId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const handleSubmit = async () => {
    if (!currentForm || !user) return;

    const nextErrors: Record<string, string> = {};
    let firstErrorId: string | null = null;
    for (const q of currentForm.questions) {
      const msg = validateAnswer(q);
      if (msg && !nextErrors[q.id]) {
        nextErrors[q.id] = msg;
        if (!firstErrorId) firstErrorId = q.id;
      }
    }

    if (firstErrorId) {
      setErrors(nextErrors);
      scrollToFirstError(firstErrorId);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Upload pending files for file questions
      const responseFiles: ResponseFile[] = [];
      const fileQuestionIds = currentForm.questions
        .filter((q) => FILE_QUESTION_TYPES.has(q.type))
        .map((q) => q.id);

      for (const qid of fileQuestionIds) {
        const pending = fileAnswers[qid] ?? [];
        for (const item of pending) {
          if (item.uploaded) continue;
          const setProg = (p: number) => {
            setFileAnswers((prev) => ({
              ...prev,
              [qid]: (prev[qid] ?? []).map((f) =>
                f.id === item.id ? { ...f, progress: p } : f,
              ),
            }));
          };
          const up = await uploadFormResponseFile(
            formId,
            user.id,
            qid,
            item.file,
            setProg,
          );
          setFileAnswers((prev) => ({
            ...prev,
            [qid]: (prev[qid] ?? []).map((f) =>
              f.id === item.id ? { ...f, progress: 100, uploaded: up } : f,
            ),
          }));
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

      // Store uploaded file names as the answer for file questions
      const finalAnswers: Record<string, string | string[]> = { ...answers };
      for (const qid of fileQuestionIds) {
        const names = (fileAnswers[qid] ?? [])
          .map((f) => f.uploaded?.fileName ?? f.file.name)
          .filter(Boolean);
        finalAnswers[qid] = names;
      }

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

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit response:", err);
      const msg =
        err instanceof Error ? err.message : "No se pudo enviar la respuesta";
      setErrors({ __form: msg });
    } finally {
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
            {files.map((f) => {
              const isImg = f.file.type.startsWith("image/");
              const isVid = f.file.type.startsWith("video/");
              return (
                <div
                  key={f.id}
                  className="relative rounded-lg overflow-hidden group"
                  style={{
                    border: f.error
                      ? "1px solid #ef4444"
                      : "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  {isImg ? (
                    <img
                      src={f.previewUrl}
                      alt={f.file.name}
                      className="w-full h-20 object-cover"
                    />
                  ) : isVid ? (
                    <div className="w-full h-20 flex flex-col items-center justify-center gap-1">
                      <Film size={20} style={{ color: "var(--text-tertiary)" }} />
                      <span className="text-[10px] px-1 truncate w-full text-center">
                        {f.file.name}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-20 flex flex-col items-center justify-center gap-1 p-1">
                      <Paperclip
                        size={18}
                        style={{ color: "var(--text-tertiary)" }}
                      />
                      <span className="text-[10px] px-1 truncate w-full text-center">
                        {f.file.name}
                      </span>
                      <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                        {formatSize(f.file.size)}
                      </span>
                    </div>
                  )}

                  {f.progress > 0 && f.progress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFile(question.id, f.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Eliminar archivo"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {questionError && (
          <p className="mt-2 text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
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
      <p className="mt-2 text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
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
