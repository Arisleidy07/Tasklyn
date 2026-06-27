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
  RotateCcw,
  AlertTriangle,
  MapPin,
  Phone,
  FileText,
  Archive,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import TaskCardMetaChip from "./TaskCardMetaChip";

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

  const getUserName = (userId: string) => memberNames[userId] || "—";

  const handleRestore = () => {
    if (!user) return;
    unarchiveTask(task.id, user.id);
  };

  const handleConfirmDelete = () => {
    deleteTask(task.id);
    setShowDeleteConfirm(false);
  };

  const hasMeta = task.archivedAt || task.archivedBy;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className="glass-card relative flex flex-col gap-1.5 p-3 rounded-[var(--radius-card)] mb-2 transition-all duration-150 hover:shadow-[var(--shadow-card-hover)]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <Archive size={12} style={{ color: "var(--text-tertiary)" }} />
          </div>

          <p
            className="flex-1 min-w-0 text-[var(--text-base)] font-medium leading-snug line-through opacity-60"
            style={{ color: "var(--text-primary)" }}
          >
            {task.title}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {canEdit && (
              <button
                onClick={handleRestore}
                className="p-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-link)";
                  e.currentTarget.style.backgroundColor = "var(--bg-info)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Restaurar"
              >
                <RotateCcw size={14} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-error)";
                  e.currentTarget.style.backgroundColor = "var(--bg-error)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-tertiary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {(task.location ||
          task.phoneNumbers?.length ||
          task.description ||
          hasMeta) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.location && (
              <TaskCardMetaChip
                icon={<MapPin size={11} />}
                text={task.location}
                href={`https://maps.google.com/?q=${encodeURIComponent(task.location)}`}
                color="var(--text-tertiary)"
              />
            )}
            {task.phoneNumbers?.[0] && (
              <TaskCardMetaChip
                icon={<Phone size={11} />}
                text={task.phoneNumbers[0]}
                href={`tel:${task.phoneNumbers[0]}`}
                color="var(--text-tertiary)"
              />
            )}
            {task.description && (
              <TaskCardMetaChip
                icon={<FileText size={11} />}
                text="Nota"
                color="var(--text-tertiary)"
              />
            )}
            {hasMeta && (
              <TaskCardMetaChip
                icon={<Clock size={11} />}
                text={`${timeAgo(task.archivedAt || task.createdAt)}${task.archivedBy ? ` · ${getUserName(task.archivedBy)}` : ""}`}
                color="var(--text-tertiary)"
              />
            )}
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Eliminar tarea archivada"
      >
        <div className="space-y-3">
          <div
            className="flex items-start gap-3 p-3 rounded-[var(--radius-lg)] text-[var(--text-sm)]"
            style={{
              backgroundColor: "var(--bg-error)",
              color: "var(--text-error)",
            }}
          >
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <p>
              ¿Eliminar "<strong>{task.title}</strong>"? No se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3">
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
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
