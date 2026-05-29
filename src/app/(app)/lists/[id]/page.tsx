"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useMemberProfiles } from "@/lib/useMemberProfiles";
import Header from "@/components/layout/Header";
import TaskItem from "@/components/tasks/TaskItem";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import PremiumMembersPanel from "@/components/members/PremiumMembersPanel";
import EditListModal from "@/components/members/EditListModal";
import {
  Plus,
  Share2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings2,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { canInviteMembers, canShareList } from "@/lib/permissions";

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
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalTab, setEditModalTab] = useState<"details" | "members">(
    "details",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const list = getList(listId);
  const tasks = getTasksByList(listId);

  // Subscribe to real-time tasks for this list
  useEffect(() => {
    if (listId) {
      subscribeToList(listId);
      return () => {
        unsubscribeFromList(listId);
      };
    }
  }, [listId, subscribeToList, unsubscribeFromList]);

  // Collect ALL user IDs referenced in this list context:
  // current members + anyone who created/completed a task or appears in history.
  // This ensures "Completado por" shows the real name even for removed members.
  const allProfileIds = useMemo(() => {
    const ids = new Set<string>(list?.members.map((m) => m.userId) ?? []);
    tasks.forEach((t) => {
      if (t.createdBy) ids.add(t.createdBy);
      if (t.completedBy) ids.add(t.completedBy);
      (t.history ?? []).forEach((h) => {
        if (h.performedBy) ids.add(h.performedBy);
      });
    });
    return Array.from(ids);
  }, [list?.members, tasks]);

  // Subscribe to real-time Firestore profiles for all referenced users
  const memberProfiles = useMemberProfiles(allProfileIds);

  // All useMemo hooks must be before any conditional returns
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    switch (filter) {
      case "pending":
        return tasks.filter((t) => t.status === "pending");
      case "completed":
        return tasks.filter((t) => t.status === "completed");
      default:
        return tasks;
    }
  }, [tasks, filter]);

  // Build memberNames using real Firestore profiles (with custom name fallback)
  const memberNames = useMemo(() => {
    if (!list) return {} as Record<string, string>;
    return list.members.reduce(
      (acc, m) => {
        const profile = memberProfiles[m.userId];
        const realName =
          profile?.name ||
          (m.userId === user?.id ? user?.name : undefined) ||
          `Miembro`;
        acc[m.userId] = getDisplayName(listId, m.userId, realName);
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [list, memberProfiles, user, listId, getDisplayName]);

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
  const canInvite = canInviteMembers(userMember?.role ?? null);
  const canShare = canShareList(userMember?.role ?? null);

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
          <div className="flex items-center gap-1.5">
            {/* Miembros — visible to ALL users */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditModalTab("members");
                setShowEditModal(true);
              }}
              icon={<Users size={15} />}
            >
              <span className="hidden sm:inline">Miembros</span>
            </Button>
            {/* Editar — owner + editor */}
            {canEdit && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setEditModalTab("details");
                  setShowEditModal(true);
                }}
                icon={<Settings2 size={15} />}
              >
                <span className="hidden sm:inline">Editar</span>
              </Button>
            )}
            {/* Compartir — owner + editor */}
            {canShare && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSharePanel(true)}
                icon={<Share2 size={15} />}
              >
                <span className="hidden sm:inline">Compartir</span>
              </Button>
            )}
            {isOwner && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                icon={<Trash2 size={15} />}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto pb-6">
        {/* Filtros - Segmented Control */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6 gap-0.5">
          {[
            {
              key: "all" as const,
              label: "Todas",
              count: tasks.length,
              Icon: null,
            },
            {
              key: "pending" as const,
              label: "Pendientes",
              count: pendingCount,
              Icon: Clock,
            },
            {
              key: "completed" as const,
              label: "Completadas",
              count: completedCount,
              Icon: CheckCircle2,
            },
          ].map(({ key, label, count, Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 min-h-[40px]",
                filter === key
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {Icon && (
                <Icon size={13} className="hidden sm:block flex-shrink-0" />
              )}
              <span>{label}</span>
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-md leading-none",
                  filter === key
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-200 text-gray-400",
                )}
              >
                {count}
              </span>
            </button>
          ))}
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
                memberNames={memberNames}
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

      {/* Share panel — invite only */}
      <PremiumMembersPanel
        list={list}
        isOpen={showSharePanel}
        onClose={() => setShowSharePanel(false)}
      />

      {/* Edit list + members management */}
      <EditListModal
        list={list}
        memberProfiles={memberProfiles}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        defaultTab={editModalTab}
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
