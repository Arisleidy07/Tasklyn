"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Move, Check, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PhotoCropperModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  onDelete?: () => void;
}

type Point = { x: number; y: number };
type Area = { x: number; y: number; width: number; height: number };

export default function PhotoCropperModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
  onDelete,
}: PhotoCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteCallback = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 1));

  const createCroppedImage = async (): Promise<Blob> => {
    if (!croppedAreaPixels) throw new Error("No crop area selected");

    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Could not get canvas context");

    // Set canvas size to the cropped area size
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not create blob"));
        },
        "image/jpeg",
        0.95
      );
    });
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await createCroppedImage();
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
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
          className="fixed inset-0 z-[99999] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative z-10 w-full max-w-lg mx-4",
              "bg-white rounded-2xl shadow-2xl overflow-hidden",
              "flex flex-col max-h-[90vh]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Move size={14} className="text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  Ajustar foto
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cropper Area */}
            <div className="relative flex-1 min-h-[300px] bg-gray-900">
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
                    background: "#1f2937",
                  },
                  cropAreaStyle: {
                    border: "2px solid #3b82f6",
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                  },
                }}
              />

              {/* Zoom Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  disabled={zoom <= 1}
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs text-white/80 font-medium min-w-[40px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  disabled={zoom >= 3}
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="px-4 py-2 bg-blue-50/50 border-b border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Arrastra para mover • Usa los controles para hacer zoom
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 p-4 bg-white">
              <div>
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar foto
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  isLoading={isProcessing}
                  icon={<Check size={14} />}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
