"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Camera, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadTeamPhoto, deleteTeamPhoto, prepareImageFile } from "@/lib/storage";
import { updateTeam } from "@/lib/firestore";

interface TeamImageProps {
  teamId: string;
  name: string;
  photoURL?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  color?: string;
  editable?: boolean;
  onUpdate?: (photoURL: string) => void;
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
  "2xl": "w-28 h-28 text-2xl",
};

const iconSizeMap = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
};

const gradientColors = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-purple-600",
];

function getGradientFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradientColors[Math.abs(hash) % gradientColors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TeamImage({
  teamId,
  name,
  photoURL,
  size = "md",
  color,
  editable = false,
  onUpdate,
  className,
}: TeamImageProps) {
  const [currentPhoto, setCurrentPhoto] = useState(photoURL);
  const [isUploading, setIsUploading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);

      try {
        // Validate and prepare the file
        const preparedFile = await prepareImageFile(file);

        // Delete old photo if exists
        if (currentPhoto) {
          await deleteTeamPhoto(currentPhoto);
        }

        // Upload new photo
        const downloadURL = await uploadTeamPhoto(teamId, preparedFile);

        // Update team in Firestore
        await updateTeam(teamId, { photoURL: downloadURL });

        // Update local state
        setCurrentPhoto(downloadURL);
        onUpdate?.(downloadURL);
      } catch (err) {
        console.error("Failed to upload team photo:", err);
        setError(err instanceof Error ? err.message : "Error al subir la imagen");
      } finally {
        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [teamId, currentPhoto, onUpdate]
  );

  const handleRemovePhoto = useCallback(async () => {
    if (!currentPhoto) return;

    setIsUploading(true);
    setError(null);

    try {
      await deleteTeamPhoto(currentPhoto);
      await updateTeam(teamId, { photoURL: null });
      setCurrentPhoto(undefined);
      onUpdate?.("");
    } catch (err) {
      console.error("Failed to remove team photo:", err);
      setError("Error al eliminar la imagen");
    } finally {
      setIsUploading(false);
    }
  }, [teamId, currentPhoto, onUpdate]);

  const handleClick = useCallback(() => {
    if (editable && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [editable, isUploading]);

  const gradient = color ? color : getGradientFromId(teamId);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        className={cn(
          "relative rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br",
          sizeMap[size],
          gradient,
          editable && !isUploading && "cursor-pointer",
          "shadow-sm"
        )}
        onClick={handleClick}
        onMouseEnter={() => editable && setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
        whileHover={editable ? { scale: 1.02 } : undefined}
        whileTap={editable ? { scale: 0.98 } : undefined}
      >
        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-bold text-white select-none">
            {getInitials(name)}
          </span>
        )}

        {/* Upload overlay */}
        <AnimatePresence>
          {editable && showOverlay && !isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Camera size={iconSizeMap[size]} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 size={iconSizeMap[size]} className="text-white animate-spin" />
          </div>
        )}
      </motion.div>

      {/* Remove button */}
      {editable && currentPhoto && !isUploading && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            handleRemovePhoto();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"
        >
          <X size={12} />
        </motion.button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-0 right-0 text-[10px] text-red-500 text-center whitespace-nowrap"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
