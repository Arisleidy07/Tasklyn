"use client";

// ============================================
// TASKLYN — File picker adapted to the device
// Phones / tablets: Galería (photos + videos), Cámara (take a photo) and
// Archivos (documents and other files). Computers: a single
// "Adjuntar archivos" button (photos, videos and documents).
// Used everywhere files are attached (tasks, reports, forms).
// ============================================

import React, { useRef, useSyncExternalStore } from "react";
import { Camera, FileText, Image as ImageIcon, Loader2, Paperclip } from "lucide-react";

export const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.zip,.rar,application/pdf";
export const MEDIA_ACCEPT = "image/*,video/*";

// Touch-first device (phone / tablet): coarse pointer without hover, or a
// mobile user agent (iPadOS reports a desktop UA but has touch points).
function detectTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const noHover = window.matchMedia?.("(hover: none)").matches ?? false;
  const ua = navigator.userAgent || "";
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(ua);
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return (coarse && noHover) || mobileUA || iPadOS;
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia?.("(pointer: coarse)");
  mq?.addEventListener?.("change", onChange);
  return () => mq?.removeEventListener?.("change", onChange);
}

/** True on phones and tablets. Always false during SSR. */
export function useIsTouchDevice(): boolean {
  return useSyncExternalStore(subscribe, detectTouchDevice, () => false);
}

interface FilePickerButtonsProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  busy?: boolean;
  /** Allow documents (PDF, Word, Excel…). Default true. */
  allowDocuments?: boolean;
  /** Allow photos (gallery + camera). Default true. */
  allowImages?: boolean;
  /** Allow videos (picked from the gallery). Default true. */
  allowVideos?: boolean;
  /** Allow picking several files at once. Default true. */
  multiple?: boolean;
  /** Button height class (keeps each screen's existing sizing). */
  heightClassName?: string;
  /** Desktop label. */
  desktopLabel?: string;
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-secondary)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-color)",
};

export default function FilePickerButtons({
  onFiles,
  disabled = false,
  busy = false,
  allowDocuments = true,
  allowImages = true,
  allowVideos = true,
  multiple = true,
  heightClassName = "h-11",
  desktopLabel = "Adjuntar archivos",
}: FilePickerButtonsProps) {
  const isTouch = useIsTouchDevice();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const desktopRef = useRef<HTMLInputElement>(null);

  const mediaAccept = [allowImages && "image/*", allowVideos && "video/*"]
    .filter(Boolean)
    .join(",");
  const hasMedia = mediaAccept.length > 0;
  const desktopAccept = [mediaAccept, allowDocuments && DOCUMENT_ACCEPT]
    .filter(Boolean)
    .join(",");
  const touchButtons = (hasMedia ? 1 : 0) + (allowImages ? 1 : 0) + (allowDocuments ? 1 : 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Reset so the same file can be picked again after removing it
    e.target.value = "";
    if (files.length) onFiles(files);
  };

  const isDisabled = disabled || busy;
  const btnClass = `${heightClassName} ${
    isTouch ? "px-1.5 gap-1" : "px-3 gap-1.5"
  } rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-w-0`;
  const icon = (node: React.ReactNode) =>
    busy ? <Loader2 size={16} className="animate-spin flex-shrink-0" /> : node;

  if (!isTouch) {
    return (
      <div data-file-picker="desktop">
        <input
          ref={desktopRef}
          type="file"
          multiple={multiple}
          accept={desktopAccept}
          onChange={handleChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => desktopRef.current?.click()}
          disabled={isDisabled}
          className={`${btnClass} w-full`}
          style={buttonStyle}
        >
          {icon(<Paperclip size={16} className="flex-shrink-0" />)}
          <span className="truncate">{desktopLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div data-file-picker="touch">
      {hasMedia && (
        <input
          ref={galleryRef}
          type="file"
          multiple={multiple}
          accept={mediaAccept}
          onChange={handleChange}
          className="hidden"
        />
      )}
      {/* capture forces the camera (and ignores `multiple`) — camera only */}
      {allowImages && (
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          className="hidden"
        />
      )}
      {allowDocuments && (
        <input
          ref={filesRef}
          type="file"
          multiple={multiple}
          accept={desktopAccept}
          onChange={handleChange}
          className="hidden"
        />
      )}
      <div
        className={`grid gap-2 ${
          touchButtons >= 3 ? "grid-cols-3" : touchButtons === 2 ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {hasMedia && (
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={isDisabled}
            className={btnClass}
            style={buttonStyle}
          >
            {icon(<ImageIcon size={15} className="flex-shrink-0" />)}
            <span className="truncate">Galería</span>
          </button>
        )}
        {allowImages && (
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={isDisabled}
            className={btnClass}
            style={buttonStyle}
          >
            {icon(<Camera size={15} className="flex-shrink-0" />)}
            <span className="truncate">Cámara</span>
          </button>
        )}
        {allowDocuments && (
          <button
            type="button"
            onClick={() => filesRef.current?.click()}
            disabled={isDisabled}
            className={btnClass}
            style={buttonStyle}
          >
            {icon(<FileText size={15} className="flex-shrink-0" />)}
            <span className="truncate">Archivos</span>
          </button>
        )}
      </div>
    </div>
  );
}
