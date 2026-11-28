"use client";

// ============================================
// TASKLYN — Preview grid for files selected but not yet saved
// Real image thumbnails, video first frame + play icon, document icon +
// name. Per-file remove, status (Pendiente / Subiendo / Completado / Error)
// with progress and retry. Object URLs are revoked when no longer used.
// ============================================

import React, { useEffect, useRef, useState } from "react";
import { X, Play, CheckCircle2, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import AttachmentViewer, { DocumentIcon, type ViewerItem } from "./AttachmentViewer";

export type PendingStatus = "pending" | "uploading" | "done" | "error";

export interface PendingFileItem {
  id: string;
  file: File;
  status?: PendingStatus;
  progress?: number; // 0-100
  error?: string;
}

interface PendingFilesGridProps {
  items: PendingFileItem[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  disabled?: boolean;
  /** Tailwind grid columns class. */
  columnsClassName?: string;
}

const STATUS_LABEL: Record<PendingStatus, string> = {
  pending: "Pendiente",
  uploading: "Subiendo",
  done: "Completado",
  error: "Error",
};

export function categoryOf(file: File): "image" | "video" | "file" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif"].includes(ext)) return "image";
  if (["mp4", "mov", "webm", "m4v", "3gp"].includes(ext)) return "video";
  return "file";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// One object URL per File, shared across renders (progress updates re-render
// often; recreating URLs would flicker and leak).
const urlCache = new WeakMap<File, string>();
function objectUrlFor(file: File): string {
  let url = urlCache.get(file);
  if (!url) {
    url = URL.createObjectURL(file);
    urlCache.set(file, url);
  }
  return url;
}
export function revokeObjectUrlFor(file: File) {
  const url = urlCache.get(file);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(file);
  }
}

let seq = 0;
export const pendingFileId = () => `pf_${Date.now().toString(36)}_${(seq++).toString(36)}`;

export default function PendingFilesGrid({
  items,
  onRemove,
  onRetry,
  disabled,
  columnsClassName = "grid-cols-3 sm:grid-cols-4",
}: PendingFilesGridProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Revoke URLs of files that left the list, and all of them on unmount
  const shownFiles = useRef<File[]>([]);
  useEffect(() => {
    const current = new Set(items.map((i) => i.file));
    shownFiles.current.forEach((f) => !current.has(f) && revokeObjectUrlFor(f));
    shownFiles.current = [...current];
  }, [items]);
  useEffect(() => {
    const tracked = shownFiles;
    return () => tracked.current.forEach(revokeObjectUrlFor);
  }, []);

  const urls = new Map<File, string>();
  items.forEach((it) => {
    if (categoryOf(it.file) !== "file") urls.set(it.file, objectUrlFor(it.file));
  });

  const viewerItems: ViewerItem[] = items
    .filter((it) => urls.has(it.file))
    .map((it) => ({
      id: it.id,
      url: urls.get(it.file)!,
      name: it.file.name,
      type: it.file.type,
      category: categoryOf(it.file),
    }));

  if (items.length === 0) return null;

  return (
    <>
      <div className={`grid ${columnsClassName} gap-2`}>
        {items.map((it) => {
          const cat = categoryOf(it.file);
          const url = urls.get(it.file);
          const status = it.status;
          const viewIdx = viewerItems.findIndex((v) => v.id === it.id);
          return (
            <div
              key={it.id}
              className="relative aspect-square rounded-xl overflow-hidden group"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: `1px solid ${status === "error" ? "var(--text-error)" : "var(--border-color)"}`,
              }}
              data-field-error={status === "error" ? "" : undefined}
            >
              <button
                type="button"
                className="absolute inset-0 w-full h-full"
                onClick={() => viewIdx >= 0 && setViewerIndex(viewIdx)}
                aria-label={cat === "file" ? it.file.name : `Ampliar ${it.file.name}`}
                disabled={cat === "file"}
              >
                {cat === "image" && url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={it.file.name} className="w-full h-full object-cover" draggable={false} />
                ) : cat === "video" && url ? (
                  <>
                    <video
                      src={`${url}#t=0.1`}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover pointer-events-none bg-black"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-8 h-8 rounded-full bg-black/55 flex items-center justify-center">
                        <Play size={14} fill="white" className="text-white ml-0.5" />
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="w-full h-full flex flex-col items-center justify-center gap-1 px-2 text-center">
                    <DocumentIcon name={it.file.name} type={it.file.type} size={26} style={{ color: "var(--text-tertiary)" }} />
                    <span className="text-[10px] leading-tight line-clamp-2 break-all" style={{ color: "var(--text-secondary)" }}>
                      {it.file.name}
                    </span>
                  </span>
                )}
              </button>

              {/* Bottom status bar */}
              <div className="absolute inset-x-0 bottom-0 px-1.5 pb-1 pt-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                {status === "uploading" ? (
                  <>
                    <div className="h-1 rounded-full bg-white/30 overflow-hidden">
                      <div className="h-full bg-white transition-all" style={{ width: `${Math.max(3, it.progress || 0)}%` }} />
                    </div>
                    <p className="text-[9px] text-white/90 mt-0.5 flex items-center gap-1">
                      <Loader2 size={8} className="animate-spin" /> {STATUS_LABEL.uploading} {Math.round(it.progress || 0)}%
                    </p>
                  </>
                ) : status === "done" ? (
                  <p className="text-[10px] text-white flex items-center gap-1">
                    <CheckCircle2 size={10} /> {STATUS_LABEL.done}
                  </p>
                ) : status === "error" ? (
                  <p className="text-[10px] text-red-200 flex items-center gap-1">
                    <AlertCircle size={10} /> {STATUS_LABEL.error}
                  </p>
                ) : (
                  <p className="text-[10px] text-white/90 truncate">
                    {status === "pending" ? `${STATUS_LABEL.pending} · ` : ""}
                    {formatFileSize(it.file.size)}
                  </p>
                )}
              </div>

              {status === "error" && (
                <div className="absolute inset-x-0 top-0 p-1.5 bg-black/70 pointer-events-none">
                  <p className="text-[10px] leading-tight text-red-200 line-clamp-3">
                    {it.error || "No se pudo subir este archivo. Inténtalo nuevamente."}
                  </p>
                </div>
              )}

              {status === "error" && onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(it.id)}
                  disabled={disabled}
                  className="absolute bottom-1 right-1 h-7 px-2 rounded-full bg-white text-black text-[10px] font-semibold flex items-center gap-1"
                  aria-label={`Reintentar ${it.file.name}`}
                >
                  <RotateCcw size={10} /> Reintentar
                </button>
              )}

              {onRemove && status !== "uploading" && status !== "done" && (
                <button
                  type="button"
                  onClick={() => onRemove(it.id)}
                  disabled={disabled}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label={`Quitar ${it.file.name}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <AttachmentViewer
        open={viewerIndex !== null}
        items={viewerItems}
        index={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}
