"use client";

// ============================================
// TASKLYN — Full-screen attachment viewer
// Images (object-fit: contain), videos with controls, documents (open /
// download), navigation (arrows, keyboard, swipe), visible close button,
// safe-area aware on phones. Rendered in a portal so transformed ancestors
// (animated cards, drawers) never clip it.
// ============================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Play,
  Loader2,
} from "lucide-react";

export interface ViewerItem {
  id: string;
  url: string;
  name: string;
  type: string; // MIME
  category: "image" | "video" | "file";
  thumbUrl?: string;
}

interface AttachmentViewerProps {
  items: ViewerItem[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  /** Shown instead of content while the full list is loading. */
  loading?: boolean;
}

function documentKind(name: string, type: string): "sheet" | "archive" | "doc" {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["xls", "xlsx", "csv"].includes(ext) || type.includes("sheet") || type.includes("excel")) return "sheet";
  if (["zip", "rar"].includes(ext) || type.includes("zip") || type.includes("rar")) return "archive";
  return "doc";
}

/** Icon for a document attachment (sheet / archive / generic document). */
export function DocumentIcon({
  name,
  type,
  size = 16,
  className,
  style,
}: {
  name: string;
  type: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const kind = documentKind(name, type);
  if (kind === "sheet") return <FileSpreadsheet size={size} className={className} style={style} />;
  if (kind === "archive") return <FileArchive size={size} className={className} style={style} />;
  return <FileText size={size} className={className} style={style} />;
}

async function downloadFile(item: ViewerItem) {
  try {
    const res = await fetch(item.url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch {
    // Bucket without CORS for fetch → let the browser handle it
    window.open(item.url, "_blank", "noopener,noreferrer");
  }
}

export default function AttachmentViewer({
  items,
  index,
  open,
  onClose,
  onIndexChange,
  loading,
}: AttachmentViewerProps) {
  const [current, setCurrent] = useState(index);
  const [downloading, setDownloading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState<Record<string, boolean>>({});
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Sync external index when (re)opened
  const [lastOpenIndex, setLastOpenIndex] = useState<number | null>(null);
  if (open && lastOpenIndex !== index) {
    setLastOpenIndex(index);
    setCurrent(index);
  }
  if (!open && lastOpenIndex !== null) setLastOpenIndex(null);

  const count = items.length;
  const safeIndex = count ? Math.min(Math.max(current, 0), count - 1) : 0;
  const item = items[safeIndex];

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      const next = (safeIndex + delta + count) % count;
      setCurrent(next);
      onIndexChange?.(next);
    },
    [count, safeIndex, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, go]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100050] flex flex-col text-white select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de archivos"
      // Portal events still bubble through the React tree: keep clicks and
      // drags from reaching the task card / sortable list underneath.
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.96)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 h-14 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item?.name || ""}</p>
          {count > 1 && (
            <p className="text-xs text-white/60">
              {safeIndex + 1} de {count}
            </p>
          )}
        </div>
        {item && (
          <>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10"
              aria-label="Abrir en una pestaña nueva"
              title="Abrir"
            >
              <ExternalLink size={18} />
            </a>
            <button
              type="button"
              onClick={async () => {
                setDownloading(true);
                await downloadFile(item);
                setDownloading(false);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10"
              aria-label="Descargar"
              title="Descargar"
            >
              {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
          </>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20"
          aria-label="Cerrar visor"
          title="Cerrar"
        >
          <X size={22} />
        </button>
      </div>

      {/* Content */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-14"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const s = touchStart.current;
          touchStart.current = null;
          if (!s) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {loading || !item ? (
          <Loader2 size={32} className="animate-spin text-white/70" />
        ) : item.category === "image" ? (
          <>
            {!imgLoaded[item.id] && item.thumbUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbUrl}
                alt=""
                aria-hidden
                className="absolute max-w-full max-h-full w-auto h-auto blur-sm opacity-60"
                style={{ objectFit: "contain" }}
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={item.id}
              src={item.url}
              alt={item.name}
              onLoad={() => setImgLoaded((m) => ({ ...m, [item.id]: true }))}
              className="relative max-w-full max-h-full w-auto h-auto"
              style={{ objectFit: "contain" }}
              draggable={false}
            />
          </>
        ) : item.category === "video" ? (
          <video
            key={item.id}
            src={item.url}
            poster={item.thumbUrl}
            controls
            playsInline
            preload="metadata"
            className="max-w-full max-h-full w-auto h-auto bg-black"
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div className="flex flex-col items-center text-center gap-3 px-6">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <DocumentIcon name={item.name} type={item.type} size={40} />
            </div>
            <p className="text-sm font-medium break-all max-w-sm">{item.name}</p>
            <div className="flex gap-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-lg bg-white text-black text-sm font-semibold flex items-center gap-1.5"
              >
                <ExternalLink size={16} /> Abrir documento
              </a>
              <button
                type="button"
                onClick={() => void downloadFile(item)}
                className="h-10 px-4 rounded-lg bg-white/10 text-sm font-medium flex items-center gap-1.5"
              >
                <Download size={16} /> Descargar
              </button>
            </div>
          </div>
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-white/20 flex items-center justify-center"
              aria-label="Anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-white/20 flex items-center justify-center"
              aria-label="Siguiente"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {count > 1 && (
        <div className="flex-shrink-0 flex gap-1.5 overflow-x-auto px-3 py-2 justify-start sm:justify-center">
          {items.map((it, i) => {
            const thumb = it.thumbUrl || (it.category === "image" ? it.url : undefined);
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => {
                  setCurrent(i);
                  onIndexChange?.(i);
                }}
                className={`relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-white/10 flex items-center justify-center ${i === safeIndex ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
                aria-label={`Ver ${it.name}`}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <DocumentIcon name={it.name} type={it.type} size={18} />
                )}
                {it.category === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={14} fill="white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body,
  );
}
