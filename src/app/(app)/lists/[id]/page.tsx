"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import Header from "@/components/layout/Header";
import TaskItem from "@/components/tasks/TaskItem";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import PremiumMembersPanel from "@/components/members/PremiumMembersPanel";
import {
  Plus,
  Users,
  Share2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MemberRole } from "@/types";

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const { user } = useAuthStore();
  const { getList, deleteList, getDisplayName } = useListStore();
  const { getTasksByList, subscribeToList, unsubscribeFromList, createTask } =
    useTaskStore();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const list = getList(listId);
  const tasks = getTasksByList(listId);

  // Subscribe to tasks for this list
  useEffect(() => {
    if (listId) {
      subscribeToList(listId);
      return () => {
        unsubscribeFromList(listId);
      };
    }
  }, [listId, subscribeToList, unsubscribeFromList]);

  if (!user || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const userMember = list.members.find((m) => m.userId === user.id);
  const isOwner = userMember?.role === "owner";
  const canEdit = isOwner || userMember?.role === "editor";

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case "pending":
        return tasks.filter((t) => t.status === "pending");
      case "completed":
        return tasks.filter((t) => t.status === "completed");
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const handleDeleteList = async () => {
    await deleteList(listId);
    router.push("/dashboard");
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !user) return;
    await createTask({
      listId,
      title: newTaskTitle.trim(),
      createdBy: user.id,
    });
    setNewTaskTitle("");
    setShowAddTask(false);
  };

  return (
    <>
      <Header
        title={list.name}
        description={
          list.description ||
          `${list.members.length} miembro${list.members.length !== 1 ? "s" : ""}`
        }
        showMenuButton={true}
        actions={
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setShowMembersPanel(true)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center sm:hidden"
              title="Miembros"
            >
              <Users size={20} />
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowMembersPanel(true)}
              icon={<Users size={16} />}
              className="hidden sm:flex"
            >
              Miembros
            </Button>
            {canEdit && (
              <>
                <button
                  onClick={() => setShowMembersPanel(true)}
                  className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center sm:hidden"
                  title="Invitar"
                >
                  <Share2 size={18} />
                </button>
                <Button
                  size="sm"
                  onClick={() => setShowMembersPanel(true)}
                  icon={<Share2 size={16} />}
                  className="hidden sm:flex"
                >
                  Invitar
                </Button>
              </>
            )}
            {isOwner && (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center sm:hidden"
                  title="Eliminar lista"
                >
                  <Trash2 size={18} />
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  icon={<Trash2 size={16} />}
                  className="hidden sm:flex text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Eliminar
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto pb-6">
        {/* Filtros */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
              filter === "all"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Todas <Badge variant="default">{tasks.length}</Badge>
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
              filter === "pending"
                ? "bg-gray-100 text-gray-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Clock size={14} /> Pendientes{" "}
            <Badge variant="default">{pendingCount}</Badge>
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
              filter === "completed"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <CheckCircle2 size={14} /> Completadas{" "}
            <Badge variant="default">{completedCount}</Badge>
          </button>
        </div>

        {/* Botón añadir tarea */}
        {canEdit && (
          <div className="mb-6">
            <Button
              onClick={() => setShowAddTask(true)}
              icon={<Plus size={16} />}
              className="w-full sm:w-auto"
            >
              Añadir tarea
            </Button>
          </div>
        )}

        {/* Tareas */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                role={userMember?.role || null}
                memberNames={list.members.reduce(
                  (acc, m) => {
                    acc[m.userId] = getDisplayName(
                      listId,
                      m.userId,
                      m.userId === user.id ? "Tú" : m.userId.slice(0, 8),
                    );
                    return acc;
                  },
                  {} as Record<string, string>,
                )}
              />
            ))}
          </AnimatePresence>

          {filteredTasks.length === 0 && (
            <EmptyState
              icon={<CheckCircle2 size={32} />}
              title={
                filter === "completed"
                  ? "No hay tareas completadas"
                  : "Aún no hay tareas"
              }
              description={
                filter === "completed"
                  ? "Las tareas que completes aparecerán aquí."
                  : "Crea tu primera tarea para empezar."
              }
              action={
                canEdit && (
                  <Button
                    size="sm"
                    onClick={() => setShowAddTask(true)}
                    icon={<Plus size={14} />}
                  >
                    Añadir tarea
                  </Button>
                )
              }
            />
          )}
        </div>
      </div>

      {/* Modal Añadir Tarea */}
      <Modal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="Añadir nueva tarea"
      >
        <div className="space-y-4">
          <Input
            label="Título de la tarea"
            placeholder="¿Qué necesitas hacer?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddTask();
              }
            }}
            autoFocus
          />
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowAddTask(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
              className="flex-1"
              icon={<Plus size={16} />}
            >
              Añadir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Panel de miembros e invitaciones */}
      <PremiumMembersPanel
        list={list}
        memberNames={list.members.reduce(
          (acc, m) => {
            acc[m.userId] = getDisplayName(
              listId,
              m.userId,
              m.userId === user.id ? "Tú" : m.userId.slice(0, 8),
            );
            return acc;
          },
          {} as Record<string, string>,
        )}
        originalNames={list.members.reduce(
          (acc, m) => {
            acc[m.userId] = m.userId === user.id ? "Tú" : m.userId.slice(0, 8);
            return acc;
          },
          {} as Record<string, string>,
        )}
        isOpen={showMembersPanel}
        onClose={() => setShowMembersPanel(false)}
      />

      {/* Confirmar Eliminación */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="¿Eliminar lista?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p>
              Esto eliminará permanentemente &quot;{list.name}&quot; y todas sus
              tareas. Esta acción no se puede deshacer.
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
              onClick={handleDeleteList}
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
