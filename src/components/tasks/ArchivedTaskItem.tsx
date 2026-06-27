"use client";

import React, { useState } from "react";
import { Task, MemberRole } from "@/types";
import { useTaskStore } from "@/stores/taskStore";
import { useAuthStore } from "@/stores/authStore";
import { canDeleteTask, canEditTask } from "@/lib/permissions";
import { motion } from "framer-motion";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Trash2, Clock, RotateCcw, AlertTriangle } from "lucide-react";
import { timeAgo } from "@/lib/utils";

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
  const chips: string[] = [];
  if (task.phoneNumbers?.length)
    chips.push(`${task.phoneNumbers.length} teléf.`);
  if (task.location) chips.push("ubicación");
  if (task.description) chips.push("nota");

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className="group/archived relative flex items-stretch min-h-[44px] rounded-[var(--radius-md)] border transition-colors duration-150"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-card)";
        }}
      >
        <div className="flex-1 flex items-center gap-3 py-2 pr-3 min-w-0">
          <div
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <Clock size={12} style={{ color: "var(--text-tertiary)" }} />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-[var(--text-base)] font-medium leading-snug truncate line-through opacity-70"
              style={{ color: "var(--text-primary)" }}
            >
              {task.title}
            </p>
            {(chips.length > 0 || hasMeta) && (
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {chips.length > 0 && (
                  <span
                    className="text-[var(--text-2xs)]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {chips.join(" · ")}
                  </span>
                )}
                {hasMeta && (
                  <span
                    className="text-[var(--text-2xs)]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {timeAgo(task.archivedAt || task.createdAt)}
                    {task.archivedBy && <> · {getUserName(task.archivedBy)}</>}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center self-center gap-0.5 flex-shrink-0 pr-3">
            {canEdit && (
              <button
                onClick={handleRestore}
                className="p-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#2563eb";
                  e.currentTarget.style.backgroundColor =
                    "rgba(37,99,235,0.08)";
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
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.backgroundColor =
                    "rgba(239,68,68,0.08)";
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
