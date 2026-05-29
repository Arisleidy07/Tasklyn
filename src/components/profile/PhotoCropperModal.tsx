"use client";

import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Check, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoCropperModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  onDelete?: () => void;
  currentPhotoURL?: string;
}

type Point = { x: number; y: number };
type Area = { x: number; y: number; width: number; height: number };

export default function PhotoCropperModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  onDelete,
  currentPhotoURL,
}: PhotoCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onCropCompleteCallback = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  // Generate preview when crop changes
  useEffect(() => {
    if (croppedAreaPixels && imageSrc) {
      generatePreview(imageSrc, croppedAreaPixels).then(setPreviewUrl);
    }
  }, [croppedAreaPixels, imageSrc]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 1));

  const createCroppedImage = async (): Promise<Blob> => {
    if (!croppedAreaPixels) throw new Error("No crop area selected");
    return await getCroppedImg(imageSrc, croppedAreaPixels);
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await createCroppedImage();
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Error al recortar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-center justify-center"
        >
          {/* Dark overlay - ENCIMA DE TODO */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />

          {/* Main Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative z-10 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl",
              "md:rounded-2xl overflow-hidden",
              "flex flex-col md:flex-row bg-white",
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Left side - Cropper */}
            <div className="relative flex-1 min-h-[50vh] md:min-h-[500px] bg-gray-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteCallback}
                cropShape="round"
                showGrid={false}
                style={{
                  containerStyle: {
                    background: "#111827",
                  },
                  cropAreaStyle: {
                    border: "2px solid white",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
                  },
                }}
              />

              {/* Zoom Controls - floating */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 rounded-full px-4 py-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                  disabled={zoom <= 1}
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-sm text-white/90 font-medium min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                  disabled={zoom >= 3}
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>

            {/* Right side - Preview & Controls */}
            <div className="w-full md:w-[320px] bg-white flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">
                  Ajustar foto
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Mueve y haz zoom para ajustar
                </p>
              </div>

              {/* Preview Section */}
              <div className="flex-1 p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Vista previa
                    </p>
                    <div className="flex justify-center">
                      <div className="relative">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-100"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-50">
                            <User size={40} className="text-gray-300" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                          <Check size={14} className="text-white" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-3">
                      Así se verá tu foto de perfil
                    </p>
                  </div>

                  {/* Current photo */}
                  {currentPhotoURL && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Foto actual
                      </p>
                      <div className="flex items-center gap-3">
                        <img
                          src={currentPhotoURL}
                          alt="Current"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">
                            Se reemplazará al guardar
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-100 space-y-3">
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3",
                    "bg-gray-900 hover:bg-gray-800 text-white rounded-xl",
                    "text-sm font-medium transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Guardar foto
                    </>
                  )}
                </button>

                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-3",
                      "text-red-600 hover:bg-red-50 rounded-xl",
                      "text-sm font-medium transition-colors",
                    )}
                  >
                    <Trash2 size={16} />
                    Eliminar foto
                  </button>
                )}

                <button
                  onClick={onClose}
                  className={cn(
                    "w-full px-4 py-3 text-gray-500 hover:text-gray-700",
                    "text-sm font-medium transition-colors",
                  )}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Generate preview URL from crop area
async function generatePreview(imageSrc: string, crop: Area): Promise<string> {
  const blob = await getCroppedImg(imageSrc, crop);
  return URL.createObjectURL(blob);
}

// Helper to create cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No canvas context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to Blob failed"));
      },
      "image/jpeg",
      0.95,
    );
  });
}

// Helper function to create image from URL
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

// Helper function to create image from URL
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}
