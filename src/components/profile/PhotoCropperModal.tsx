"use client";

import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Check, Trash2, User, Move } from "lucide-react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setPreviewUrl(null);
    }
  }, [isOpen, imageSrc]);

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

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 1));

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

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[2147483647] flex flex-col"
          style={{ isolation: "isolate" }}
        >
          {/* Fullscreen dark overlay - ABSOLUTE BLACK */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />

          {/* Header - Floating */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Move size={16} className="text-white/70" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm sm:text-base">
                  Ajustar foto
                </h2>
                <p className="text-white/50 text-xs hidden sm:block">
                  Arrastra y haz zoom para ajustar
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </motion.div>

          {/* Main Cropper Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex-1 min-h-0"
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropCompleteCallback}
              cropShape="round"
              showGrid={true}
              style={{
                containerStyle: {
                  background: "#000000",
                  width: "100%",
                  height: "100%",
                },
                cropAreaStyle: {
                  border: "3px solid rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
                },
                mediaStyle: {
                  transition: "transform 0.1s ease-out",
                },
              }}
            />

            {/* Zoom Controls - Bottom Center */}
            <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-full px-3 py-2 sm:px-4 sm:py-2.5 border border-white/10">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <ZoomOut size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <span className="text-xs sm:text-sm text-white/90 font-medium min-w-[40px] sm:min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <ZoomIn size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            {/* Preview Circle - Bottom Right on Desktop */}
            <div className="hidden md:flex absolute bottom-6 right-6 flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/20 bg-gray-800">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={28} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-black">
                  <Check size={12} className="text-white" />
                </div>
              </div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">
                Preview
              </span>
            </div>
          </motion.div>

          {/* Bottom Actions Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative z-10 bg-gradient-to-t from-black via-black/95 to-transparent"
          >
            {/* Mobile Preview */}
            <div className="md:hidden flex justify-center pt-4 pb-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-3 ring-white/20 bg-gray-800">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={24} className="text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4">
              {onDelete && currentPhotoURL && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm font-medium"
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              )}

              <div className="flex-1" />

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isProcessing || !previewUrl}
                  className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span>Guardar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
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
