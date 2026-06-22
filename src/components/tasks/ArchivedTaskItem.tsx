"use client";

import React, { useState } from "react";
import { Task, MemberRole } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canDeleteTask, canEditTask } from "@/lib/permissions";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  Trash2,
  Clock,
  Phone,
  MapPin,
  FileText,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { cn, timeAgo, linkifyPhoneNumbers, linkifyLocation } from "@/lib/utils";

interface ArchivedTaskItemProps {
  task: Task;
  role: MemberRole | null;
  memberNames: Record<string, string>;
}

export default function ArchivedTaskItem({
  task,
  role,
  memberNames,
}: ArchivedTaskItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuthStore();
  const { deleteTask, unarchiveTask } = useTaskStore();

  const canEdit = canEditTask(role);
  const canDelete = canDeleteTask(role);

  const getUserName = (userId: string) => memberNames[userId] || "Cargando...";

  const handleRestore = () => {
    if (!user) return;
    unarchiveTask(task.id, user.id);
  };

  const handleConfirmDelete = () => {
    deleteTask(task.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="group/archived rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-card)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 0 0 0 transparent",
        }}
        whileHover={{ boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
      >
        {/* Archived accent stripe */}
        <div
          className="h-0.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(156,163,175,0.4) 0%, rgba(156,163,175,0.1) 100%)",
          }}
        />

        <div className="flex items-start gap-3 p-4">
          {/* Archive icon badge */}
          <div
            className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <Clock size={13} style={{ color: "var(--text-tertiary)" }} />
          </div>

          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Title */}
            <p
              className="text-sm font-medium leading-snug break-words whitespace-normal line-through"
              style={{ color: "var(--text-secondary)" }}
            >
              {task.title}
            </p>

            {/* Details row */}
            {task.phoneNumbers?.length || task.location || task.description ? (
              <div
                className="rounded-xl px-3 py-2.5 space-y-2"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {task.phoneNumbers && task.phoneNumbers.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Phone
                      size={11}
                      className="flex-shrink-0 mt-0.5 text-blue-500"
                    />
                    <span
                      className="text-[12px] leading-relaxed flex-1"
                      style={{ color: "var(--text-secondary)" }}
                      dangerouslySetInnerHTML={{
                        __html: task.phoneNumbers
                          .map((phone) => linkifyPhoneNumbers(phone))
                          .join(
                            ' <span style="color:var(--text-muted);margin:0 4px">·</span> ',
                          ),
                      }}
                    />
                  </div>
                )}
                {task.location && (
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={11}
                      className="flex-shrink-0 mt-0.5 text-blue-500"
                    />
                    <span
                      className="text-[12px] leading-relaxed flex-1"
                      style={{ color: "var(--text-secondary)" }}
                      dangerouslySetInnerHTML={{
                        __html: linkifyLocation(task.location),
                      }}
                    />
                  </div>
                )}
                {task.description && (
                  <div className="flex items-start gap-2">
                    <FileText
                      size={11}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <p
                      className="text-[12px] leading-relaxed flex-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {task.description}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Meta */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-tertiary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Clock size={9} />
                {timeAgo(task.archivedAt || task.createdAt)}
              </span>
              {task.archivedBy && (
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  · por {getUserName(task.archivedBy)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {canEdit && (
              <button
                onClick={handleRestore}
                className="p-2 rounded-xl transition-all duration-150 cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center active:scale-90"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#2563eb";
                  e.currentTarget.style.backgroundColor =
                    "rgba(37,99,235,0.08)";
                  e.currentTarget.style.borderColor = "rgba(37,99,235,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
                title="Restaurar tarea"
              >
                <RotateCcw size={14} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl transition-all duration-150 cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center active:scale-90"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.backgroundColor =
                    "rgba(239,68,68,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Eliminar permanentemente"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Eliminar tarea archivada"
      >
        <div className="space-y-4">
          <div
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{
              backgroundColor: "rgba(239,68,68,0.06)",
              borderColor: "rgba(239,68,68,0.2)",
            }}
          >
            <AlertTriangle
              size={18}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "#ef4444" }}
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                Esta acción es permanente
              </p>
              <p
                className="text-sm mt-0.5 leading-relaxed"
                style={{ color: "#ef4444" }}
              >
                ¿Deseas eliminar esta nota permanentemente? No podrás
                recuperarla.
              </p>
            </div>
          </div>
          <p
            className="text-sm font-medium line-clamp-2 px-1"
            style={{ color: "var(--text-secondary)" }}
          >
            &quot;{task.title}&quot;
          </p>
          <div className="flex gap-3 pt-1">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              className="flex-1"
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
