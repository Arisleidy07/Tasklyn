"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useInvitationStore } from "@/stores/invitationStore";
import Header from "@/components/layout/Header";
import TaskItem from "@/components/tasks/TaskItem";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import {
  Plus,
  ArrowLeft,
  Users,
  Share2,
  Trash2,
  Settings,
  CheckCircle2,
  Clock,
  X,
  Copy,
  Check,
  UserCog,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TaskList, MemberRole } from "@/types";

const ROLES: { value: MemberRole; label: string; desc: string }[] = [
  {
    value: "editor",
    label: "Editor",
    desc: "Puede añadir, editar y completar tareas",
  },
  {
    value: "viewer",
    label: "Lector",
    desc: "Solo puede ver tareas y marcar sus propias completadas",
  },
];

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const { user } = useAuthStore();
  const {
    getList,
    deleteList,
    addMember,
    removeMember,
    updateMemberRole,
    setCustomName,
    getDisplayName,
  } = useListStore();
  const { getTasksByList, subscribeToList, unsubscribeFromList, createTask } =
    useTaskStore();
  const { createInvitation, deleteInvitation, getInvitationsByList } =
    useInvitationStore();

  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [invitations, setInvitations] = useState<
    Awaited<ReturnType<typeof getInvitationsByList>>
  >([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [customNameEdit, setCustomNameEdit] = useState<Record<string, string>>(
    {},
  );

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

  // Load invitations
  useEffect(() => {
    if (listId) {
      getInvitationsByList(listId).then(setInvitations);
    }
  }, [listId, getInvitationsByList]);

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

  const handleCreateInvite = async (role: MemberRole) => {
    const invitation = await createInvitation(listId, user.id, role);
    setInvitations((prev) => [...prev, invitation]);
  };

  const handleDeleteInvite = async (id: string) => {
    await deleteInvitation(id);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  };

  const copyInviteLink = (token: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleSaveCustomName = async (userId: string) => {
    const name = customNameEdit[userId];
    if (name !== undefined) {
      await setCustomName(listId, userId, name);
      setCustomNameEdit((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
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
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInvite(true)}
                icon={<Share2 size={16} />}
              >
                Invitar
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowMembers(true)}
              icon={<Users size={16} />}
            >
              Miembros
            </Button>
            {isOwner && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                icon={<Trash2 size={16} />}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Eliminar
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 max-w-4xl">
        {/* Filtros */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Todas <Badge variant="default">{tasks.length}</Badge>
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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

      {/* Modal Invitar */}
      <Modal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invitar miembros"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Crea un enlace de invitación para compartir esta lista con otros.
          </p>
          <div className="space-y-2">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => handleCreateInvite(role.value)}
                className="w-full p-3 rounded-lg border border-gray-200 hover:border-blue-300 text-left transition-colors"
              >
                <p className="font-medium text-sm">{role.label}</p>
                <p className="text-xs text-gray-500">{role.desc}</p>
              </button>
            ))}
          </div>
          {invitations.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
                Invitaciones activas
              </p>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <Badge>{inv.defaultRole}</Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        Expira{" "}
                        {new Date(inv.expiresAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        className="p-2 rounded-lg hover:bg-white transition-colors"
                        title="Copiar enlace"
                      >
                        {copiedToken === inv.token ? (
                          <Check size={16} className="text-blue-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteInvite(inv.id)}
                        className="p-2 rounded-lg hover:bg-white text-red-500 transition-colors"
                        title="Eliminar invitación"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Miembros */}
      <Modal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        title="Miembros de la lista"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {list.members.length} miembro{list.members.length !== 1 ? "s" : ""}{" "}
            en esta lista.
          </p>
          <div className="space-y-2">
            {list.members.map((member) => {
              const displayName = getDisplayName(
                listId,
                member.userId,
                member.userId === user.id ? "Tú" : member.userId.slice(0, 8),
              );
              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={displayName} size="sm" />
                    <div>
                      <p className="font-medium text-sm">{displayName}</p>
                      <Badge
                        variant={member.role === "owner" ? "blue" : "default"}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  {isOwner && member.userId !== user.id && (
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          updateMemberRole(
                            listId,
                            member.userId,
                            e.target.value as MemberRole,
                          )
                        }
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                        <option value="owner">Owner</option>
                      </select>
                      <button
                        onClick={() => removeMember(listId, member.userId)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

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
