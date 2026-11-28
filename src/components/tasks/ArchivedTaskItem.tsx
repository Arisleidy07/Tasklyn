"use client";

import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { showToast } from "@/stores/toastStore";
import React, { useState } from "react";
import { Task, MemberRole } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canDeleteTask, canEditTask } from "@/lib/permissions";
import { getPriorityConfig } from "@/lib/priority";
import { cn } from "@/lib/utils";
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
import { resolveTaskLocation } from "@/lib/location";

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

  const [isDeleting, setIsDeleting] = useState(false);
  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("[ArchivedTaskItem] delete failed:", error);
      showToast({
        variant: "error",
        message: "No se pudo eliminar la tarea. Inténtalo nuevamente.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasMeta = task.archivedAt || task.archivedBy;
  const taskLocation = resolveTaskLocation(task);

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

          <span
            className={cn(
              "flex-shrink-0 w-2.5 h-2.5 rounded-full opacity-60",
              getPriorityConfig(task.priority).dot,
            )}
            title={getPriorityConfig(task.priority).label}
            aria-label={`Prioridad: ${getPriorityConfig(task.priority).label}`}
          />
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

        {(taskLocation ||
          task.phoneNumbers?.length ||
          task.description ||
          hasMeta) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {taskLocation && (
              <TaskCardMetaChip
                icon={<MapPin size={11} />}
                text={taskLocation.address || "Ver en Google Maps"}
                href={taskLocation.url}
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

      {/* Delete Confirmation (compact) */}
      <ConfirmDeleteDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Eliminar tarea archivada"
        message={
          <>
            ¿Eliminar &quot;{task.title}&quot;? Esta acción no se puede deshacer.
          </>
        }
      />
    </>
  );
}
