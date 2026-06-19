"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Trash2,
  ImagePlus,
  ChevronDown,
  Check,
  AlertTriangle,
} from "lucide-react";
import { uploadBackgroundImage } from "@/lib/storage";
import { addBackgroundImage } from "@/lib/firestore";
import type { User } from "@/types";

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
}

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The category that should be pre-selected when the modal opens.
   *  Every time this prop changes AND the modal opens fresh, the
   *  internal selectedCategory resets to this value. */
  defaultCategory: string;
  /** List of available categories to select from */
  availableCategories?: string[];
  user: User;
  onUploaded: (url: string) => void;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  defaultCategory,
  availableCategories = [],
  user,
  onUploaded,
}: ImageUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(defaultCategory);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Build category list from availableCategories, ensuring defaultCategory is included
  const categoryList =
    availableCategories.length > 0 ? availableCategories : [defaultCategory];

  // ── KEY FIX: every time the modal opens, sync category to the prop ──
  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      setSelectedCategory(defaultCategory);
      setUploadError(null);
      setShowCategoryMenu(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen, defaultCategory]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newItems: PendingImage[] = arr.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, ""),
    }));
    setPendingImages((prev) => [...prev, ...newItems]);
  }, []);

  const removeImage = (id: string) => {
    setPendingImages((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const updateName = (id: string, name: string) => {
    setPendingImages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p)),
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (pendingImages.length === 0 || isUploading) return;
    setIsUploading(true);
    setUploadError(null);
    let lastUrl = "";
    try {
      for (const item of pendingImages) {
        const url = await uploadBackgroundImage(user.id, item.file);
        await addBackgroundImage({
          url,
          category: selectedCategory,
          uploadedBy: user.id,
          uploaderName: user.name,
          displayName: item.name.trim() || item.file.name,
        });
        lastUrl = url;
        URL.revokeObjectURL(item.previewUrl);
      }
      if (lastUrl && isMountedRef.current) {
        onUploaded(lastUrl);
      }
      if (isMountedRef.current) {
        setPendingImages([]);
        onClose();
      }
    } catch (err) {
      console.error("Upload error:", err);
      if (isMountedRef.current) {
        setUploadError(
          "Error al subir. Verifica tu conexión e inténtalo de nuevo.",
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);
    setUploadError(null);
    setShowCategoryMenu(false);
    onClose();
  };

  if (!isOpen || typeof document === "undefined") return null;

  const uploadCount = pendingImages.length;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99998]"
            style={{
              backgroundColor: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(10px)",
            }}
            onClick={handleClose}
          />

          {/* ── Modal container ── */}
          {/* Mobile: slides up from bottom, ~90vh
              Desktop (sm+): centered, 80vw × 85vh max */}
          {/* Mobile: items-end (slides from bottom), Desktop: items-center (centered) */}
          <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="
                flex flex-col overflow-hidden shadow-2xl
                rounded-t-3xl sm:rounded-3xl
                w-full h-[90dvh]
                sm:w-[80vw] sm:max-w-[960px] sm:h-[85vh]
              "
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pull handle — mobile only */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div
                  className="w-10 h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--border-color)" }}
                />
              </div>

              {/* ── Header ── */}
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(37,99,235,0.12)" }}
                  >
                    <ImagePlus size={19} style={{ color: "#2563eb" }} />
                  </div>
                  <div>
                    <p
                      className="text-[15px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Subir imágenes
                    </p>
                    <p
                      className="text-[12px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {uploadCount > 0
                        ? `${uploadCount} imagen${uploadCount > 1 ? "es" : ""} seleccionada${uploadCount > 1 ? "s" : ""} · ${selectedCategory}`
                        : `Categoría: ${selectedCategory}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isUploading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── Body — scrollable ── */}
              <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-6 py-5 space-y-5">
                {/* Category selector */}
                <div>
                  <label
                    className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Categoría
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryMenu((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        border: "1.5px solid var(--border-color)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span className="font-semibold">{selectedCategory}</span>
                      <ChevronDown
                        size={16}
                        style={{
                          color: "var(--text-tertiary)",
                          transform: showCategoryMenu
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    <AnimatePresence>
                      {showCategoryMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl shadow-2xl z-20 overflow-hidden"
                          style={{
                            backgroundColor: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {categoryList.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat);
                                setShowCategoryMenu(false);
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors"
                              style={{
                                color:
                                  selectedCategory === cat
                                    ? "#2563eb"
                                    : "var(--text-primary)",
                                backgroundColor:
                                  selectedCategory === cat
                                    ? "rgba(37,99,235,0.07)"
                                    : "transparent",
                                fontWeight:
                                  selectedCategory === cat ? 600 : 400,
                              }}
                              onMouseEnter={(e) => {
                                if (selectedCategory !== cat)
                                  e.currentTarget.style.backgroundColor =
                                    "var(--bg-secondary)";
                              }}
                              onMouseLeave={(e) => {
                                if (selectedCategory !== cat)
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                              }}
                            >
                              {cat}
                              {selectedCategory === cat && (
                                <Check size={14} style={{ color: "#2563eb" }} />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all select-none"
                  style={{
                    border: `2px dashed ${isDragOver ? "#2563eb" : "var(--border-color)"}`,
                    backgroundColor: isDragOver
                      ? "rgba(37,99,235,0.06)"
                      : "var(--bg-secondary)",
                    padding: "32px 24px",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: isDragOver
                        ? "rgba(37,99,235,0.15)"
                        : "var(--bg-tertiary, var(--bg-card))",
                    }}
                  >
                    <Upload
                      size={22}
                      style={{
                        color: isDragOver ? "#2563eb" : "var(--text-tertiary)",
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className="text-[14px] font-semibold"
                      style={{
                        color: isDragOver ? "#2563eb" : "var(--text-secondary)",
                      }}
                    >
                      {isDragOver
                        ? "Suelta las imágenes aquí"
                        : "Toca o arrastra para seleccionar"}
                    </p>
                    <p
                      className="text-[12px] mt-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      JPG, PNG, WEBP, GIF — Máx. 10 MB por imagen
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                {/* Pending images list */}
                {uploadCount > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        className="text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Imágenes a subir
                      </label>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                        style={{
                          backgroundColor: "rgba(37,99,235,0.1)",
                          color: "#2563eb",
                        }}
                      >
                        {uploadCount}
                      </span>
                    </div>

                    {pendingImages.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 rounded-2xl"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        {/* Thumbnail — large */}
                        <div
                          className="flex-shrink-0 rounded-xl overflow-hidden"
                          style={{
                            width: 80,
                            height: 80,
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <input
                            value={item.name}
                            onChange={(e) =>
                              updateName(item.id, e.target.value)
                            }
                            className="w-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-xl px-3 py-2"
                            style={{
                              color: "var(--text-primary)",
                              border: "1.5px solid var(--border-color)",
                              backgroundColor: "var(--bg-card)",
                            }}
                            placeholder="Nombre de la imagen"
                          />
                          <p
                            className="text-[11px] mt-1.5 px-1"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                            {selectedCategory}
                          </p>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeImage(item.id)}
                          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: "rgba(239,68,68,0.1)",
                            color: "#ef4444",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(239,68,68,0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(239,68,68,0.1)";
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}

                    {/* Add more */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-medium transition-colors"
                      style={{
                        border: "1.5px dashed var(--border-color)",
                        color: "var(--text-tertiary)",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-secondary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <ImagePlus size={15} />
                      Agregar más imágenes
                    </button>
                  </div>
                )}

                {/* Error banner */}
                {uploadError && (
                  <div
                    className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.22)",
                    }}
                  >
                    <AlertTriangle
                      size={16}
                      style={{
                        color: "#ef4444",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    />
                    <p className="text-[13px]" style={{ color: "#ef4444" }}>
                      {uploadError}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div
                className="flex gap-3 px-6 py-4 flex-shrink-0 border-t"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                <button
                  onClick={handleClose}
                  disabled={isUploading}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || uploadCount === 0}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    background:
                      isUploading || uploadCount === 0
                        ? "var(--bg-secondary)"
                        : "linear-gradient(135deg,#2563eb,#1d4ed8)",
                    color:
                      isUploading || uploadCount === 0
                        ? "var(--text-tertiary)"
                        : "#fff",
                    boxShadow:
                      isUploading || uploadCount === 0
                        ? "none"
                        : "0 3px 12px rgba(37,99,235,0.38)",
                  }}
                >
                  {isUploading ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      {uploadCount === 0
                        ? "Subir imágenes"
                        : `Subir ${uploadCount} imagen${uploadCount > 1 ? "es" : ""}`}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
