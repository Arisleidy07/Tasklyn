"use client";

// ============================================
// TASKLYN — Attachment thumbnails on the task card
// Up to 3 thumbnails + "+N". Reads the summary stored on the task document
// (no listener per card). Tasks created before the summary existed get one
// lazy, cached read when the card becomes visible.
// ============================================

import React, { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { Task, TaskAttachment, TaskAttachmentPreview } from "@/types";
import { getTaskAttachments } from "@/lib/firestore";
import AttachmentViewer, { DocumentIcon, type ViewerItem } from "./AttachmentViewer";

const legacyCache = new Map<string, Promise<TaskAttachment[]>>();

function loadAll(taskId: string, force = false): Promise<TaskAttachment[]> {
  if (force || !legacyCache.has(taskId)) {
    const p = getTaskAttachments(taskId).catch(() => [] as TaskAttachment[]);
    legacyCache.set(taskId, p);
  }
  return legacyCache.get(taskId)!;
}

const toViewer = (a: TaskAttachment | TaskAttachmentPreview): ViewerItem => ({
  id: a.id,
  url: a.url,
  name: a.name,
  type: a.type,
  category: a.category,
  thumbUrl: a.thumbUrl,
});

function Thumb({ item }: { item: TaskAttachmentPreview }) {
  const [failed, setFailed] = useState(false);
  const src = item.thumbUrl || (item.category === "image" ? item.url : undefined);
  if (src && !failed) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {item.category === "video" && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
              <Play size={10} fill="white" className="text-white ml-px" />
            </span>
          </span>
        )}
      </>
    );
  }
  if (item.category === "video") {
    return (
      <span className="w-full h-full flex items-center justify-center bg-gray-800">
        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
          <Play size={10} fill="white" className="text-white ml-px" />
        </span>
      </span>
    );
  }
  const ext = item.name.split(".").pop()?.slice(0, 4).toUpperCase();
  return (
    <span className="w-full h-full flex flex-col items-center justify-center gap-0.5">
      <DocumentIcon name={item.name} type={item.type} size={16} style={{ color: "var(--text-tertiary)" }} />
      {ext && (
        <span className="text-[8px] font-semibold leading-none" style={{ color: "var(--text-tertiary)" }}>
          {ext}
        </span>
      )}
    </span>
  );
}

export default function TaskCardAttachments({ task }: { task: Task }) {
  const hasSummary = typeof task.attachmentCount === "number";
  const [legacy, setLegacy] = useState<TaskAttachment[] | null>(null);
  const [viewer, setViewer] = useState<{ items: ViewerItem[]; index: number; loading: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Legacy tasks: read once, only when the card scrolls into view
  useEffect(() => {
    if (hasSummary || !task.id) return;
    const el = rootRef.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          loadAll(task.id).then((all) => !cancelled && setLegacy(all));
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [hasSummary, task.id]);

  const previews: TaskAttachmentPreview[] = hasSummary
    ? task.attachmentPreviews || []
    : (legacy || []).slice(0, 3);
  const total = hasSummary ? task.attachmentCount || 0 : legacy?.length || 0;

  const openAt = async (attId: string | null, fallbackIndex: number) => {
    setViewer({ items: previews.map(toViewer), index: Math.min(fallbackIndex, previews.length - 1), loading: total > previews.length && attId === null });
    const all = await loadAll(task.id, hasSummary);
    if (!all.length) return;
    const idx = attId ? Math.max(0, all.findIndex((a) => a.id === attId)) : Math.min(fallbackIndex, all.length - 1);
    setViewer({ items: all.map(toViewer), index: idx, loading: false });
  };

  if (!hasSummary && !legacy) return <div ref={rootRef} aria-hidden className="h-0" />;
  if (total === 0 || previews.length === 0) return <div ref={rootRef} aria-hidden className="h-0" />;

  const extra = total - previews.length;

  return (
    <div ref={rootRef} className="sm:pl-7 mt-1.5">
      <div className="flex items-center gap-1.5">
        {previews.map((att, i) => (
          <button
            key={att.id}
            type="button"
            className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden"
            style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
            onClick={(e) => {
              e.stopPropagation();
              void openAt(att.id, i);
            }}
            aria-label={`Ver ${att.name}`}
            title={att.name}
          >
            <Thumb item={att} />
          </button>
        ))}
        {extra > 0 && (
          <button
            type="button"
            className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-xs font-semibold"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              void openAt(null, previews.length);
            }}
            aria-label={`Ver los ${total} archivos adjuntos`}
          >
            +{extra}
          </button>
        )}
      </div>
      <AttachmentViewer
        open={!!viewer}
        items={viewer?.items || []}
        index={viewer?.index || 0}
        loading={viewer?.loading}
        onClose={() => setViewer(null)}
      />
    </div>
  );
}
