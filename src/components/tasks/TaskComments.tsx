"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import {
  subscribeToTaskComments,
  addComment,
  deleteComment,
} from "@/lib/firestore";
import type { TaskComment } from "@/types";
import Avatar from "@/components/ui/Avatar";
import { Send, Trash2, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

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

  const renderContent = (content: string) =>
    content.replace(
      /@(\w+)/g,
      (match) => `<span class="text-blue-600 font-medium">${match}</span>`,
    );

  return (
    <div>
      {/* Comment list */}
      <div className="space-y-2 mb-3 max-h-52 overflow-y-auto">
        <AnimatePresence initial={false}>
          {comments.length === 0 ? (
            <p
              className="text-[var(--text-xs)] italic"
              style={{ color: "var(--text-tertiary)" }}
            >
              Sin comentarios. Sé el primero.
            </p>
          ) : (
            comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 group"
              >
                <Avatar
                  name={c.authorName}
                  photoURL={c.authorPhoto}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[var(--text-xs)] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {c.authorName}
                    </span>
                    <span
                      className="text-[var(--text-2xs)]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {formatDistanceToNow(parseISO(c.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                    {c.editedAt && (
                      <span
                        className="text-[var(--text-2xs)] italic"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        (editado)
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[var(--text-sm)] mt-0.5 break-words"
                    style={{ color: "var(--text-secondary)" }}
                    dangerouslySetInnerHTML={{
                      __html: renderContent(c.content),
                    }}
                  />
                </div>
                {c.authorId === user.id && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 transition-opacity flex-shrink-0 rounded-md"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.backgroundColor =
                        "rgba(239,68,68,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-tertiary)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </motion.div>
            ))
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
                <AtSign size={10} className="text-blue-500" />
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
              rows={1}
              className="w-full text-[var(--text-sm)] px-3 py-2 rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none pr-9"
              style={{
                border: "1px solid var(--border-input)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
                minHeight: "32px",
                maxHeight: "72px",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className={cn(
                "absolute right-2 bottom-1.5 p-1 rounded-md transition-colors",
                text.trim() ? "text-blue-600" : "cursor-not-allowed",
              )}
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
