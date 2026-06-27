"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useMemberProfiles } from "@/lib/useMemberProfiles";
import Header from "@/components/layout/Header";
import ListHeader from "@/components/lists/ListHeader";
import TaskItem from "@/components/tasks/TaskItem";
import ArchivedTaskItem from "@/components/tasks/ArchivedTaskItem";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import PremiumMembersPanel from "@/components/members/PremiumMembersPanel";
import MembersPanel from "@/components/members/MembersPanel";
import EditListModal from "@/components/members/EditListModal";
import { SortableTaskContainer } from "@/components/tasks/SortableTaskContainer";
import {
  Plus,
  Share2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Settings2,
  Users,
  Phone,
  MapPin,
  FileText,
  X,
  Archive,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { canShareList } from "@/lib/permissions";

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const { user } = useAuthStore();
  const { getList, deleteList, getDisplayName } = useListStore();
  const {
    getTasksByList,
    subscribeToList,
    unsubscribeFromList,
    createTask,
    reorderTasks,
  } = useTaskStore();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalTab, setEditModalTab] = useState<"details" | "members">(
    "details",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskLocation, setNewTaskLocation] = useState("");
  const [newTaskPhones, setNewTaskPhones] = useState<string[]>([""]);

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

  // Active tasks only (exclude archived)
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "archived");
  }, [tasks]);

  const archivedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "archived");
  }, [tasks]);

  const pendingTasks = useMemo(
    () => activeTasks.filter((t) => t.status === "pending"),
    [activeTasks],
  );

  const completedTasks = useMemo(
    () => activeTasks.filter((t) => t.status === "completed"),
    [activeTasks],
  );

  // All useMemo hooks must be before any conditional returns
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case "pending":
        return pendingTasks;
      case "completed":
        return completedTasks;
      default:
        return activeTasks;
    }
  }, [activeTasks, filter, pendingTasks, completedTasks]);

  // Log for debugging duplicate keys
  useEffect(() => {
    const taskIds = filteredTasks.map((t) => t.id);
    const uniqueIds = new Set(taskIds);
    if (taskIds.length !== uniqueIds.size) {
      console.error("Duplicate task IDs found in filteredTasks:", taskIds);
      console.error("Unique IDs:", Array.from(uniqueIds));
    }
  }, [filteredTasks]);

  // Build memberNames using real Firestore profiles (with custom name fallback)
  // Includes ALL profile IDs, not just current list members, to show names
  // for users who completed tasks but were removed from the list
  const memberNames = useMemo(() => {
    if (!list) return {} as Record<string, string>;
    const names: Record<string, string> = {};

    // Include all loaded profiles (from tasks history, completions, etc.)
    Object.entries(memberProfiles).forEach(([userId, profile]) => {
      const realName =
        profile?.name ||
        (userId === user?.id ? user?.name : undefined) ||
        "...";
      names[userId] = getDisplayName(listId, userId, realName);
    });

    // Ensure current list members are included (even if profiles still loading)
    list.members.forEach((m) => {
      if (!names[m.userId]) {
        const profile = memberProfiles[m.userId];
        const realName =
          profile?.name ||
          (m.userId === user?.id ? user?.name : undefined) ||
          "...";
        names[m.userId] = getDisplayName(listId, m.userId, realName);
      }
    });

    return names;
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
  const canShare = canShareList(userMember?.role ?? null);

  const pendingCount = pendingTasks.length;
  const completedCount = completedTasks.length;
  const archivedCount = archivedTasks.length;

  const handleDeleteList = async () => {
    await deleteList(listId);
    router.push("/dashboard");
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !user) return;

    // Filter out empty phone numbers
    const validPhones = newTaskPhones.filter((p) => p.trim());

    await createTask({
      listId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      location: newTaskLocation.trim() || undefined,
      phoneNumbers: validPhones.length > 0 ? validPhones : undefined,
      createdBy: user.id,
    });

    // Reset form
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskLocation("");
    setNewTaskPhones([""]);
    setShowAddTask(false);
  };

  const handleAddPhone = () => {
    setNewTaskPhones([...newTaskPhones, ""]);
  };

  const handleRemovePhone = (index: number) => {
    setNewTaskPhones(newTaskPhones.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...newTaskPhones];
    newPhones[index] = value;
    setNewTaskPhones(newPhones);
  };

  const handleBackClick = () => {
    router.push("/dashboard?section=lists&view=todas");
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Fixed background — stays still while content scrolls. Works on iOS Safari. */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
        }}
      >
        {list.backgroundImage ? (
          <img
            src={list.backgroundImage}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          />
        )}
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.30)",
          }}
        />
      </div>

      {/* Scrollable content layer */}
      <div className="relative min-h-screen w-full" style={{ zIndex: 1 }}>
        <ListHeader
          list={list}
          totalTasks={activeTasks.length}
          canEdit={canEdit}
          canShare={canShare}
          isOwner={isOwner}
          onEdit={() => {
            setEditModalTab("details");
            setShowEditModal(true);
          }}
          onShare={() => setShowSharePanel(true)}
          onMembers={() => setShowMembersPanel(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onBack={handleBackClick}
        />

        <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto pb-6">
          {/* Filtros - Segmented Control (Pendientes, Completadas, Todas) */}
          <div
            className="flex rounded-[var(--radius-lg)] p-1 mb-5 gap-1"
            style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            {[
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
              {
                key: "all" as const,
                label: "Todas",
                count: activeTasks.length,
                Icon: null,
              },
            ].map(({ key, label, count, Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-[var(--radius-md)] text-[var(--text-xs)] sm:text-[var(--text-sm)] font-semibold tracking-tight transition-all duration-200 min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                  filter === key ? "shadow-sm" : "border border-transparent",
                )}
                style={
                  filter === key
                    ? {
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                      }
                    : { color: "var(--text-secondary)" }
                }
              >
                {Icon && (
                  <Icon size={13} className="hidden sm:block flex-shrink-0" />
                )}
                <span>{label}</span>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none tracking-wide",
                    filter === key ? "bg-blue-600 shadow-sm" : "",
                  )}
                  style={
                    filter !== key
                      ? {
                          backgroundColor: "var(--bg-tertiary)",
                          color: "var(--text-tertiary)",
                        }
                      : { color: "var(--text-on-accent)" }
                  }
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Botón añadir tarea */}
          {canEdit && (
            <div className="mb-5">
              <Button
                onClick={() => setShowAddTask(true)}
                icon={<Plus size={14} />}
                className="w-full sm:w-auto"
              >
                Añadir tarea
              </Button>
            </div>
          )}

          {/* Tareas */}
          <div className="space-y-2">
            {filter === "all" ? (
              activeTasks.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={32} />}
                  title="Aún no hay tareas"
                  description="Crea tu primera tarea para empezar."
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
              ) : (
                <div className="space-y-6">
                  {/* Bloque de pendientes */}
                  <section className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2
                        className="text-[var(--text-md)] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Pendientes
                      </h2>
                      <span
                        className="text-[var(--text-sm)] font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {pendingTasks.length}
                      </span>
                    </div>
                    {pendingTasks.length > 0 ? (
                      <div className="space-y-2">
                        <SortableTaskContainer
                          tasks={pendingTasks}
                          onReorder={(newOrder) =>
                            reorderTasks(newOrder.map((t) => t.id))
                          }
                        >
                          {(task, dragHandleProps, isDragging) => (
                            <TaskItem
                              task={task}
                              role={userMember?.role || null}
                              memberNames={memberNames}
                              listMembers={list?.members}
                              dragHandleProps={dragHandleProps}
                              isDragging={isDragging}
                            />
                          )}
                        </SortableTaskContainer>
                      </div>
                    ) : (
                      <p
                        className="text-[11px] italic"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        No hay tareas pendientes.
                      </p>
                    )}
                  </section>

                  {/* Bloque de completadas — expandido por defecto, colapsable */}
                  {completedTasks.length > 0 && (
                    <section
                      className="pt-4"
                      style={{ borderTop: "1px solid var(--border-color)" }}
                    >
                      <button
                        onClick={() => setShowCompleted((v) => !v)}
                        className="flex items-center justify-between w-full mb-3 group"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            size={16}
                            style={{ color: "var(--text-secondary)" }}
                          />
                          <h2
                            className="text-[var(--text-md)] font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Completadas
                          </h2>
                          <span
                            className="text-[var(--text-sm)] font-semibold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {completedTasks.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {showCompleted ? "Colapsar" : "Expandir"}
                          </span>
                          <ChevronDown
                            size={14}
                            className={cn(
                              "transition-transform duration-200",
                              showCompleted && "rotate-180",
                            )}
                            style={{ color: "var(--text-tertiary)" }}
                          />
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {showCompleted && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 pt-0.5">
                              <SortableTaskContainer
                                tasks={completedTasks}
                                onReorder={(newOrder) =>
                                  reorderTasks(newOrder.map((t) => t.id))
                                }
                              >
                                {(task, dragHandleProps, isDragging) => (
                                  <TaskItem
                                    task={task}
                                    role={userMember?.role || null}
                                    memberNames={memberNames}
                                    listMembers={list?.members}
                                    dragHandleProps={dragHandleProps}
                                    isDragging={isDragging}
                                  />
                                )}
                              </SortableTaskContainer>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  )}
                </div>
              )
            ) : (
              <>
                <SortableTaskContainer
                  tasks={filteredTasks}
                  onReorder={(newOrder) =>
                    reorderTasks(newOrder.map((t) => t.id))
                  }
                >
                  {(task, dragHandleProps, isDragging) => (
                    <TaskItem
                      task={task}
                      role={userMember?.role || null}
                      memberNames={memberNames}
                      listMembers={list?.members}
                      dragHandleProps={dragHandleProps}
                      isDragging={isDragging}
                    />
                  )}
                </SortableTaskContainer>

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
              </>
            )}
          </div>

          {/* Área de archivados dentro de la lista */}
          {archivedCount > 0 && (
            <section
              className="mt-8 pt-4"
              style={{ borderTop: "1px solid var(--border-color)" }}
            >
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center justify-between w-full mb-3 group"
              >
                <div className="flex items-center gap-2">
                  <Archive
                    size={16}
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h2
                    className="text-[var(--text-md)] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Archivados
                  </h2>
                  <span
                    className="text-[var(--text-sm)] font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {archivedCount}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {showArchived ? "Colapsar" : "Expandir"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform duration-200",
                      showArchived && "rotate-180",
                    )}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {showArchived && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-2">
                      <AnimatePresence mode="popLayout">
                        {archivedTasks.map((task) => (
                          <ArchivedTaskItem
                            key={task.id}
                            task={task}
                            role={userMember?.role || null}
                            memberNames={memberNames}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>

        {/* Modal Añadir Tarea - PREMIUM */}
        <Modal
          isOpen={showAddTask}
          onClose={() => {
            setShowAddTask(false);
            // Reset form on close
            setNewTaskTitle("");
            setNewTaskDescription("");
            setNewTaskLocation("");
            setNewTaskPhones([""]);
          }}
          title="Añadir nueva tarea"
          size="task"
        >
          <div className="space-y-5 p-5 sm:p-6">
            {/* Título de la tarea */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="w-4 h-4 rounded flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  1
                </span>
                Título de la tarea
              </label>
              <Input
                placeholder="Ej: Instalar router principal"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoFocus
                className="h-11"
              />
            </div>

            {/* Teléfonos dinámicos */}
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <Phone size={12} style={{ color: "var(--text-tertiary)" }} />
                Teléfonos de contacto
              </label>
              <AnimatePresence mode="popLayout">
                {newTaskPhones.map((phone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      type="tel"
                      placeholder={`Teléfono ${index + 1}`}
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      className="text-sm flex-1"
                    />
                    {newTaskPhones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(index)}
                        className="p-2 rounded-lg transition-colors flex-shrink-0"
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
                      >
                        <X size={16} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <button
                type="button"
                onClick={handleAddPhone}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors mt-1"
              >
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                  <Plus size={12} />
                </div>
                Agregar otro teléfono
              </button>
            </div>

            {/* Ubicación */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <MapPin size={12} style={{ color: "var(--text-tertiary)" }} />
                Ubicación / Dirección
              </label>
              <Input
                placeholder="Dirección o enlace de Google Maps"
                value={newTaskLocation}
                onChange={(e) => setNewTaskLocation(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <FileText size={12} style={{ color: "var(--text-tertiary)" }} />
                Descripción
              </label>
              <textarea
                placeholder="Detalles adicionales de la tarea..."
                value={newTaskDescription}
                onChange={(e) => {
                  setNewTaskDescription(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none overflow-hidden min-h-[44px]"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Actions */}
            <div
              className="flex gap-3 pt-2 border-t"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddTask(false);
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                  setNewTaskLocation("");
                  setNewTaskPhones([""]);
                }}
                className="flex-1 h-11"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="flex-1 h-11"
                icon={<Plus size={16} />}
              >
                Crear tarea
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

        {/* Members panel */}
        <MembersPanel
          list={list}
          memberNames={memberNames}
          originalNames={memberNames}
          isOpen={showMembersPanel}
          onClose={() => setShowMembersPanel(false)}
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
          <div className="space-y-4 p-5">
            <div
              className="flex items-start gap-3 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                color: "var(--text-danger, #dc2626)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p>
                Esto eliminará permanentemente &quot;{list.name}&quot; y todas
                sus tareas. Esta acción no se puede deshacer.
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
      </div>
    </div>
  );
}
