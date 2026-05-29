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
import {
  cn,
  timeAgo,
  linkifyPhoneNumbers,
  linkifyLocation,
} from "@/lib/utils";

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

  const getUserName = (userId: string) =>
    memberNames[userId] || "Usuario desconocido";

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
        className="rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden opacity-70 hover:opacity-100 transition-opacity"
      >
        <div className="flex items-start gap-3 p-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Tarea */}
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5">
                Tarea
              </span>
              <p className="text-sm font-medium text-gray-700 flex-1 leading-relaxed line-through">
                {task.title}
              </p>
            </div>

            {/* Teléfonos */}
            {task.phoneNumbers && task.phoneNumbers.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                  <Phone size={10} className="text-blue-500" />
                  Teléfonos
                </span>
                <span
                  className="text-sm flex-1 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: task.phoneNumbers
                      .map((phone) => linkifyPhoneNumbers(phone))
                      .join(' <span class="text-gray-300 mx-1">•</span> '),
                  }}
                />
              </div>
            )}

            {/* Ubicación */}
            {task.location && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                  <MapPin size={10} className="text-blue-500" />
                  Ubicación
                </span>
                <span
                  className="text-sm flex-1 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: linkifyLocation(task.location),
                  }}
                />
              </div>
            )}

            {/* Descripción */}
            {task.description && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex-shrink-0 mt-0.5 flex items-center gap-1">
                  <FileText size={10} className="text-gray-400" />
                  Descripción
                </span>
                <p className="text-sm text-gray-700 flex-1 leading-relaxed">
                  {task.description}
                </p>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
              <Clock size={10} />
              Archivada {timeAgo(task.archivedAt || task.createdAt)}
              {task.archivedBy && (
                <span>· por {getUserName(task.archivedBy)}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {canEdit && (
              <button
                onClick={handleRestore}
                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-90"
                title="Restaurar tarea"
              >
                <RotateCcw size={14} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-90"
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
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle
              size={18}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Esta acción es permanente
              </p>
              <p className="text-sm text-red-600 mt-0.5 leading-relaxed">
                ¿Deseas eliminar esta nota permanentemente? No podrás
                recuperarla.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-medium line-clamp-2 px-1">
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
