"use client";

import React from "react";
import { TaskList } from "@/types";
import { Edit2, Share2, Users, Trash2 } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

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
  useUIStore();

  const btnBase: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(10px)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.25)",
  };

  return (
    <div className="relative w-full px-4 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-6">
      {/* ── Top bar: back left, actions right ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Back */}
        <button
          onClick={onBack}
          className="p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center flex-shrink-0 active:scale-90"
          style={btnBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.18)";
          }}
          aria-label="Volver"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onMembers}
            className="p-2 rounded-xl transition-colors active:scale-90"
            style={btnBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.18)";
            }}
            title="Miembros"
          >
            <Users size={18} />
          </button>
          {canShare && (
            <button
              onClick={onShare}
              className="p-2 rounded-xl transition-colors active:scale-90"
              style={btnBase}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.28)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.18)";
              }}
              title="Compartir"
            >
              <Share2 size={18} />
            </button>
          )}
          {canEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded-xl transition-colors active:scale-90"
              style={btnBase}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.28)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.18)";
              }}
              title="Editar lista"
            >
              <Edit2 size={18} />
            </button>
          )}
          {isOwner && (
            <button
              onClick={onDelete}
              className="p-2 rounded-xl transition-colors active:scale-90"
              style={{
                ...btnBase,
                backgroundColor: "rgba(239,68,68,0.25)",
                borderColor: "rgba(239,68,68,0.4)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.38)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.25)";
              }}
              title="Eliminar lista"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Title row: emoji + name + count ── */}
      <div className="flex items-center gap-3 mt-5">
        {list.icon && (
          <span className="text-3xl sm:text-4xl leading-none flex-shrink-0">
            {list.icon}
          </span>
        )}
        <div className="min-w-0">
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight truncate"
            style={{ color: "white" }}
          >
            {list.name}
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            {totalTasks} tarea{totalTasks !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
