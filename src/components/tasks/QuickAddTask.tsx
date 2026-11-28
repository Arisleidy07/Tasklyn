"use client";

// ============================================
// TASKLYN — Quick add (Microsoft To Do style) + paste-to-create
//
// • Type a title → Enter / ✓ → one task.
// • Paste a list → one task per item (auto when unambiguous, inline preview
//   otherwise). Labelled details (Descripción, Teléfono, Prioridad…) fill the
//   existing task fields.
// • Every write goes through useTaskStore (same shape as the full form).
// ============================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Check,
  Loader2,
  X,
  AlertTriangle,
  Phone,
  MapPin,
  Flag,
  Calendar,
  UserRound,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useTaskStore, type BulkTaskInput } from "@/stores/taskStore";
import { useToastStore } from "@/stores/toastStore";
import { newTaskId } from "@/lib/firestore";
import {
  parseTaskText,
  resolveAssignee,
  type ParsedTask,
} from "@/lib/taskPasteParser";
import { getPriorityConfig } from "@/lib/priority";

interface QuickAddTaskProps {
  listId: string;
  userId: string;
  /** Members that can be assigned (id + display name). */
  members: Array<{ userId: string; name: string }>;
  canAssign: boolean;
  /** Plan-limit check: returns an error message when n more tasks are not allowed. */
  checkLimit?: (n: number) => string | null;
}

interface DraftTask extends BulkTaskInput {
  /** Raw "Responsable:" text that could not be matched to a member. */
  unresolvedAssignee?: string;
}

interface FailedBatch {
  tasks: DraftTask[];
  savedCount: number;
  error: string;
}

// The field moves between the empty-state and the "Pendientes" section when
// the first task appears (React remounts it). Remember that it should keep
// focus so rapid entry is not interrupted.
let keepFocus: { listId: string; until: number } | null = null;

const pluralTasks = (n: number) => (n === 1 ? "1 tarea" : `${n} tareas`);

/** Plain text from the clipboard; falls back to HTML (Word/Docs) when empty. */
function clipboardText(e: React.ClipboardEvent): string {
  const plain = e.clipboardData.getData("text/plain");
  if (plain) return plain;
  const html = e.clipboardData.getData("text/html");
  if (!html || typeof DOMParser === "undefined") return "";
  const docHtml = new DOMParser().parseFromString(html, "text/html");
  docHtml.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  docHtml
    .querySelectorAll("p,div,li,tr,h1,h2,h3,h4,h5,h6")
    .forEach((el) => el.append("\n"));
  docHtml.querySelectorAll("td,th").forEach((el) => el.append("\t"));
  return docHtml.body.textContent || "";
}

export default function QuickAddTask({
  listId,
  userId,
  members,
  canAssign,
  checkLimit,
}: QuickAddTaskProps) {
  const createTasksBulk = useTaskStore((s) => s.createTasksBulk);
  const undoBulkCreate = useTaskStore((s) => s.undoBulkCreate);
  const showToast = useToastStore((s) => s.show);

  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ tasks: DraftTask[]; warnings: string[] } | null>(null);
  const [failed, setFailed] = useState<FailedBatch | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const lastPaste = useRef<{ text: string; at: number } | null>(null);

  const toDrafts = useCallback(
    (parsed: ParsedTask[]): { drafts: DraftTask[]; unresolved: number } => {
      let unresolved = 0;
      const drafts = parsed.map((p) => {
        const draft: DraftTask = {
          id: newTaskId(),
          title: p.title,
          description: p.description,
          phoneNumbers: p.phoneNumbers,
          location: p.location,
          locationUrl: p.locationUrl,
          priority: p.priority,
          dueDate: p.dueDate,
          dueTime: p.dueDate ? p.dueTime : undefined,
        };
        if (p.dueTime && !p.dueDate) {
          // A time without a date cannot be stored on its own — keep it.
          draft.description = [draft.description, `Hora: ${p.dueTime}`].filter(Boolean).join("\n");
        }
        if (p.assigneeName) {
          const match = canAssign ? resolveAssignee(p.assigneeName, members) : null;
          if (match) {
            draft.assignedTo = match;
          } else {
            unresolved++;
            draft.unresolvedAssignee = p.assigneeName;
            draft.description = [draft.description, `Responsable: ${p.assigneeName}`]
              .filter(Boolean)
              .join("\n");
          }
        }
        return draft;
      });
      return { drafts, unresolved };
    },
    [members, canAssign],
  );

  const focusInput = useCallback(() => {
    keepFocus = { listId, until: Date.now() + 1500 };
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [listId]);

  useEffect(() => {
    if (keepFocus && keepFocus.listId === listId && Date.now() < keepFocus.until) {
      inputRef.current?.focus();
    }
  }, [listId]);

  const save = useCallback(
    async (drafts: DraftTask[], opts: { isRetry?: boolean; clearInput?: boolean } = {}) => {
      if (inFlight.current || drafts.length === 0) return false;
      const limitMsg = opts.isRetry ? null : checkLimit?.(drafts.length) ?? null;
      if (limitMsg) {
        setError(limitMsg);
        return false;
      }
      inFlight.current = true;
      setSaving(true);
      setError(null);
      try {
        const { savedIds, failedIds, error: saveError } = await createTasksBulk({
          listId,
          createdBy: userId,
          tasks: drafts,
          isRetry: opts.isRetry,
        });

        if (failedIds.length > 0) {
          const failedSet = new Set(failedIds);
          setFailed((prev) => ({
            tasks: drafts.filter((d) => failedSet.has(d.id)),
            savedCount: (opts.isRetry ? prev?.savedCount ?? 0 : 0) + savedIds.length,
            error: saveError || "No se pudieron guardar algunas tareas.",
          }));
          if (savedIds.length === 0) {
            setError(saveError || "No se pudo guardar. Inténtalo de nuevo.");
          }
        } else {
          setFailed(null);
        }

        if (savedIds.length > 0) {
          if (opts.clearInput) setValue("");
          setPreview(null);
          const n = savedIds.length;
          showToast({
            variant: failedIds.length ? "warning" : "success",
            message:
              n === 1
                ? "Se creó 1 tarea correctamente"
                : `Se crearon ${n} tareas correctamente`,
            description: failedIds.length
              ? `${pluralTasks(failedIds.length)} no se ${failedIds.length === 1 ? "guardó" : "guardaron"}.`
              : undefined,
            actionLabel: "Deshacer",
            onAction: async () => {
              try {
                await undoBulkCreate(savedIds);
                showToast({
                  variant: "info",
                  message: n === 1 ? "Se deshizo la creación de la tarea" : `Se deshizo la creación de ${n} tareas`,
                });
              } catch (err) {
                showToast({
                  variant: "error",
                  message: "No se pudo deshacer",
                  description: err instanceof Error ? err.message : undefined,
                });
              }
            },
          });
        }
        return failedIds.length === 0;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar. Inténtalo de nuevo.");
        return false;
      } finally {
        inFlight.current = false;
        setSaving(false);
        focusInput();
      }
    },
    [checkLimit, createTasksBulk, focusInput, listId, showToast, undoBulkCreate, userId],
  );

  const submitTyped = async () => {
    const title = value.replace(/\s+/g, " ").trim();
    if (!title || inFlight.current) return;
    // Pressing Enter again after a failed save retries the SAME task id, so a
    // write that actually reached the server is never duplicated.
    if (failed && failed.tasks.length === 1 && failed.tasks[0].title === title.slice(0, 250)) {
      await save(failed.tasks, { isRetry: true, clearInput: true });
      return;
    }
    // Typed text: one task, exactly what the user wrote.
    await save([{ id: newTaskId(), title: title.slice(0, 250) }], { clearInput: true });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = clipboardText(e);
    const nonEmpty = text.split(/\r\n|\r|\n|\u2028|\u2029/).filter((l) => l.trim());
    // A single line pastes normally into the field.
    if (nonEmpty.length < 2 && !text.includes("\t")) return;
    e.preventDefault();

    // Ignore duplicate paste events (double-fired / repeated within 1.5 s)
    const now = Date.now();
    if (inFlight.current || (lastPaste.current && lastPaste.current.text === text && now - lastPaste.current.at < 1500)) {
      return;
    }
    lastPaste.current = { text, at: now };

    const result = parseTaskText(text);
    if (result.tasks.length === 0) return;
    const { drafts, unresolved } = toDrafts(result.tasks);
    const warnings = [...result.warnings];
    if (unresolved > 0) {
      warnings.push(
        canAssign
          ? "No se encontró un miembro con ese nombre como responsable; se dejó en la descripción."
          : "Tu plan no permite asignar responsables; el nombre se dejó en la descripción.",
      );
    }

    if (warnings.length === 0) {
      // Anything already typed in the field stays there untouched.
      void save(drafts);
    } else {
      setPreview({ tasks: drafts, warnings });
    }
  };

  const updateDraftTitle = (id: string, title: string) =>
    setPreview((p) => (p ? { ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, title } : t)) } : p));

  const removeDraft = (id: string) =>
    setPreview((p) => {
      if (!p) return p;
      const tasks = p.tasks.filter((t) => t.id !== id);
      return tasks.length ? { ...p, tasks } : null;
    });

  const confirmPreview = () => {
    if (!preview) return;
    const tasks = preview.tasks
      .map((t) => ({ ...t, title: t.title.replace(/\s+/g, " ").trim().slice(0, 250) }))
      .filter((t) => t.title);
    if (tasks.length) void save(tasks);
  };

  const canSubmit = value.trim().length > 0 && !saving;

  return (
    <div className="mt-3" data-quick-add>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submitTyped();
        }}
        className="flex items-center gap-2 rounded-xl px-3 h-12 transition-shadow focus-within:ring-2 focus-within:ring-blue-500/40"
        style={{
          backgroundColor: "var(--bg-card)",
          border: `1px solid ${error ? "var(--text-error)" : "var(--border-color)"}`,
        }}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={() => inputRef.current?.focus()}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ color: "var(--text-link, #2563eb)" }}
          aria-label="Escribir nueva tarea"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
        </button>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Escape" && preview) setPreview(null);
          }}
          placeholder="Escribe o pega tus tareas aquí…"
          aria-label="Escribe o pega tus tareas aquí"
          enterKeyHint="done"
          autoComplete="off"
          maxLength={2000}
          disabled={saving && !value}
          className="flex-1 min-w-0 h-full bg-transparent text-[15px] sm:text-sm focus:outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
          style={{
            backgroundColor: canSubmit ? "#2563eb" : "var(--bg-tertiary)",
            color: canSubmit ? "#fff" : "var(--text-tertiary)",
          }}
          aria-label="Crear tarea"
          title="Crear tarea (Enter)"
        >
          {saving && value ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
        </button>
      </form>

      {error && (
        <p className="text-xs mt-1.5 px-1" role="alert" style={{ color: "var(--text-error)" }}>
          {error}
        </p>
      )}

      {/* Partial failure — retry with the SAME ids (no duplicates) */}
      {failed && (
        <div
          className="mt-2 rounded-xl p-3 text-sm"
          style={{ backgroundColor: "var(--bg-error, #fef2f2)", border: "1px solid var(--border-color)" }}
          role="alert"
        >
          <p className="font-medium" style={{ color: "var(--text-error)" }}>
            {failed.savedCount > 0
              ? `Se guardaron ${pluralTasks(failed.savedCount)}; ${pluralTasks(failed.tasks.length)} no se ${failed.tasks.length === 1 ? "pudo" : "pudieron"} guardar.`
              : `No se ${failed.tasks.length === 1 ? "pudo" : "pudieron"} guardar ${pluralTasks(failed.tasks.length)}.`}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {failed.error}
          </p>
          <ul className="mt-2 space-y-0.5 max-h-28 overflow-y-auto text-xs" style={{ color: "var(--text-secondary)" }}>
            {failed.tasks.map((t) => (
              <li key={t.id} className="truncate">• {t.title}</li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save(failed.tasks, { isRetry: true, clearInput: failed.tasks.length === 1 && failed.tasks[0].title === value.trim() })}
              className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: "#2563eb", color: "#fff" }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              Reintentar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setFailed(null)}
              className="h-8 px-3 rounded-lg text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Inline preview for ambiguous pastes (no extra modal) */}
      <AnimatePresence initial={false}>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mt-2 rounded-xl p-3"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Revisa cómo se organizarán {pluralTasks(preview.tasks.length)}
                </p>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="p-1 rounded-lg flex-shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                  aria-label="Cancelar"
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="mt-1.5 space-y-1">
                {preview.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-1.5 text-xs" style={{ color: "#b45309" }}>
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
              <ol className="mt-3 space-y-1.5 max-h-[45vh] overflow-y-auto overscroll-contain pr-1">
                {preview.tasks.map((t, i) => {
                  const prio = t.priority ? getPriorityConfig(t.priority) : null;
                  return (
                    <li
                      key={t.id}
                      className="rounded-lg px-2 py-1.5"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] w-5 text-right flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                          {i + 1}.
                        </span>
                        <input
                          value={t.title}
                          onChange={(e) => updateDraftTitle(t.id, e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
                          style={{ color: "var(--text-primary)" }}
                          aria-label={`Título de la tarea ${i + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeDraft(t.id)}
                          className="p-1 rounded flex-shrink-0"
                          style={{ color: "var(--text-tertiary)" }}
                          aria-label={`Quitar tarea ${i + 1}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {(t.description || t.phoneNumbers || t.location || t.locationUrl || prio || t.dueDate || t.assignedTo) && (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 pl-7 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          {prio && (
                            <span className="flex items-center gap-1"><Flag size={10} />{prio.label}</span>
                          )}
                          {t.dueDate && (
                            <span className="flex items-center gap-1"><Calendar size={10} />{t.dueDate}{t.dueTime ? ` · ${t.dueTime}` : ""}</span>
                          )}
                          {t.phoneNumbers?.map((ph) => (
                            <span key={ph} className="flex items-center gap-1"><Phone size={10} />{ph}</span>
                          ))}
                          {(t.location || t.locationUrl) && (
                            <span className="flex items-center gap-1 min-w-0"><MapPin size={10} /><span className="truncate max-w-[180px]">{t.location || "Google Maps"}</span></span>
                          )}
                          {t.assignedTo && (
                            <span className="flex items-center gap-1"><UserRound size={10} />{members.find((m) => m.userId === t.assignedTo)?.name}</span>
                          )}
                          {t.description && (
                            <span className="flex items-start gap-1 w-full min-w-0">
                              <FileText size={10} className="mt-0.5 flex-shrink-0" />
                              <span className="whitespace-pre-line line-clamp-3 break-words">{t.description}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="h-10 sm:h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmPreview}
                  disabled={saving}
                  className="h-10 sm:h-9 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                  style={{ backgroundColor: "#2563eb", color: "#fff" }}
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Crear {pluralTasks(preview.tasks.length)}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Memo helper for the list page: id + display name of assignable members. */
export function useQuickAddMembers(
  memberIds: string[],
  names: Record<string, string>,
): Array<{ userId: string; name: string }> {
  return useMemo(
    () =>
      memberIds
        .map((id) => ({ userId: id, name: names[id] || "" }))
        .filter((m) => m.name && m.name !== "..."),
    [memberIds, names],
  );
}
