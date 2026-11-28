"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import {
  subscribeToTaskComments,
  addComment,
  deleteComment,
  addTaskHistoryEntry,
} from "@/lib/firestore";
import type { TaskComment } from "@/types";
import Avatar from "@/components/ui/Avatar";
import { Send, Trash2, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useUserProfiles } from "@/hooks/useUserProfiles";

// "28 nov 2026 · 14:35"
function formatCommentDate(iso: string): string {
  const d = parseISO(iso);
  if (!isValid(d)) return "";
  return format(d, "d MMM yyyy '·' HH:mm", { locale: es });
}

// Highlight @mentions without injecting HTML (comment text is user input).
function renderWithMentions(content: string): React.ReactNode[] {
  const parts = content.split(/(@[\p{L}\p{N}_]+)/u);
  return parts.map((part, i) =>
    part.startsWith("@") && part.length > 1 ? (
      <span key={i} className="font-medium" style={{ color: "var(--text-link)" }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

interface TaskCommentsProps {
  taskId: string;
  listId: string;
  memberNames: Record<string, string>;
}

export default function TaskComments({
  taskId,
  listId,
  memberNames,
}: TaskCommentsProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsub = subscribeToTaskComments(taskId, setComments);
    return unsub;
  }, [taskId]);

  // Current name / photo of each author (falls back to what was stored)
  const authorIds = useMemo(
    () => Array.from(new Set(comments.map((c) => c.authorId).filter(Boolean))),
    [comments],
  );
  const { getProfile } = useUserProfiles(authorIds);

  if (!user) return null;

  // Parse @mentions in text
  const handleTextChange = (val: string) => {
    setText(val);
    const atIdx = val.lastIndexOf("@");
    if (
      atIdx !== -1 &&
      atIdx ===
        val.length -
          1 -
          (val.slice(atIdx + 1).length - val.slice(atIdx + 1).trimEnd().length)
    ) {
      const query = val.slice(atIdx + 1).split(/\s/)[0];
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string) => {
    const atIdx = text.lastIndexOf("@");
    const newText = text.slice(0, atIdx) + `@${name} `;
    setText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const extractMentions = (content: string): string[] => {
    const matches = content.match(/@(\w+)/g) || [];
    return matches.map((m) => m.slice(1));
  };

  const resolveUserIds = (mentions: string[]): string[] => {
    return mentions
      .map((name) => {
        const entry = Object.entries(memberNames).find(([, n]) =>
          n.toLowerCase().startsWith(name.toLowerCase()),
        );
        return entry?.[0];
      })
      .filter(Boolean) as string[];
  };

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      const mentions = resolveUserIds(extractMentions(text));
      await addComment({
        taskId,
        listId,
        authorId: user.id,
        authorName: user.name,
        authorPhoto: user.photoURL,
        content: text.trim(),
        mentions,
      });
      await addTaskHistoryEntry(taskId, {
        action: "comment_added",
        performedBy: user.id,
        performedByName: user.name,
        performedAt: new Date().toISOString(),
        details: "Comentario añadido",
      });
      setText("");
    } finally {
      setSending(false);
    }
  };

  const mentionSuggestions = Object.entries(memberNames)
    .filter(
      ([id, name]) =>
        id !== user.id &&
        name.toLowerCase().includes(mentionQuery.toLowerCase()),
    )
    .slice(0, 5);

  return (
    <div>
      {/* Comment list */}
      <div className="space-y-2.5 mb-3 max-h-[28rem] overflow-y-auto overscroll-contain pr-0.5">
        <AnimatePresence initial={false}>
          {comments.length === 0 ? (
            <p
              className="text-[var(--text-xs)] italic"
              style={{ color: "var(--text-tertiary)" }}
            >
              Sin comentarios. Sé el primero.
            </p>
          ) : (
            comments.map((c) => {
              const profile = getProfile(c.authorId);
              const name =
                profile?.name || memberNames[c.authorId] || c.authorName || "Usuario";
              const photo = profile?.photoURL || c.authorPhoto;
              return (
                <motion.article
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="group rounded-xl p-3"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                  data-comment-id={c.id}
                >
                  <header className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={name} photoURL={photo} size="md" />
                    <span
                      className="flex-1 min-w-0 text-[var(--text-sm)] font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                      title={name}
                    >
                      {name}
                    </span>
                    {c.authorId === user.id && (
                      <button
                        type="button"
                        onClick={() => deleteComment(c.id)}
                        aria-label="Eliminar comentario"
                        className="sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1.5 transition-opacity flex-shrink-0 rounded-md"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--text-error)";
                          e.currentTarget.style.backgroundColor = "var(--bg-error)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-tertiary)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </header>
                  <p
                    className="mt-2 text-[var(--text-sm)] leading-relaxed whitespace-pre-wrap break-words"
                    style={{ color: "var(--text-secondary)", overflowWrap: "anywhere" }}
                  >
                    {renderWithMentions(c.content)}
                  </p>
                  <p
                    className="mt-2 text-[var(--text-2xs)]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <time dateTime={c.createdAt}>{formatCommentDate(c.createdAt)}</time>
                    {c.editedAt && <span className="italic"> · editado</span>}
                  </p>
                </motion.article>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="relative">
        {showMentions && mentionSuggestions.length > 0 && (
          <div
            className="absolute bottom-full mb-1 left-0 rounded-[var(--radius-lg)] shadow-[var(--shadow-dropdown)] overflow-hidden z-20 min-w-[160px] max-w-[calc(100vw-32px)]"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            {mentionSuggestions.map(([id, name]) => (
              <button
                key={id}
                onMouseDown={() => insertMention(name)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[var(--text-xs)] transition-colors text-left"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <AtSign size={10} className="text-[var(--text-link)]" />
                <span
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {name}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <Avatar name={user.name} photoURL={user.photoURL} size="sm" />
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe un comentario... @nombre"
              rows={2}
              className="w-full text-[var(--text-sm)] px-3 py-2.5 rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--border-input-focus)]/20 resize-none pr-12"
              style={{
                border: "1px solid var(--border-input)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                minHeight: "80px",
                maxHeight: "150px",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className={cn(
                "absolute right-2 bottom-2.5 p-2 rounded-md transition-colors",
                text.trim()
                  ? "text-[var(--text-link)]"
                  : "cursor-not-allowed opacity-50",
              )}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
