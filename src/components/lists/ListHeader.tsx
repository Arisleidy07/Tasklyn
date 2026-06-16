"use client";

import React from "react";
import { TaskList } from "@/types";
import { Edit2, Share2, Users, Trash2 } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface ListHeaderProps {
  list: TaskList;
  totalTasks: number;
  canEdit: boolean;
  canShare: boolean;
  isOwner: boolean;
  onEdit: () => void;
  onShare: () => void;
  onMembers: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export default function ListHeader({
  list,
  totalTasks,
  canEdit,
  canShare,
  isOwner,
  onEdit,
  onShare,
  onMembers,
  onDelete,
  onBack,
}: ListHeaderProps) {
  const { theme } = useUIStore();
  const isDark = theme === "dark";

  return (
    <div className="relative w-full">
      {/* Background Image with Overlay */}
      {list.backgroundImage ? (
        <div
          className="relative w-full h-48 sm:h-56 md:h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${list.backgroundImage})` }}
        >
          {/* Theme Overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: isDark
                ? "rgba(0, 0, 0, 0.4)"
                : "rgba(255, 255, 255, 0.15)",
            }}
          />
        </div>
      ) : (
        <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
          {/* Theme Overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: isDark
                ? "rgba(0, 0, 0, 0.2)"
                : "rgba(255, 255, 255, 0.1)",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center flex-shrink-0 active:scale-90"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            color: isDark ? "white" : "white",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Title and Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Emoji Icon */}
            {list.icon && (
              <div className="text-4xl sm:text-5xl mb-2">{list.icon}</div>
            )}

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold truncate leading-tight"
              style={{ color: "white" }}
            >
              {list.name}
            </h1>

            {/* Task Count */}
            <p
              className="text-sm sm:text-base mt-1"
              style={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              {totalTasks} tarea{totalTasks !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={onMembers}
              icon={<Users size={16} />}
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
            >
              <span className="hidden sm:inline">Miembros</span>
            </Button>
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                icon={<Edit2 size={16} />}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              >
                <span className="hidden sm:inline">Editar</span>
              </Button>
            )}
            {canShare && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onShare}
                icon={<Share2 size={16} />}
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
              >
                <span className="hidden sm:inline">Compartir</span>
              </Button>
            )}
            {isOwner && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                icon={<Trash2 size={16} />}
                className="bg-red-500/20 hover:bg-red-500/30 text-white backdrop-blur-sm"
              >
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
