"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import { useMemberProfiles } from "@/lib/useMemberProfiles";
import ListHeader from "@/components/lists/ListHeader";
import TaskItem from "@/components/tasks/TaskItem";
import ArchivedTaskItem from "@/components/tasks/ArchivedTaskItem";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import PremiumMembersPanel from "@/components/members/PremiumMembersPanel";
import MembersPanel from "@/components/members/MembersPanel";
import EditListModal from "@/components/members/EditListModal";
import { SortableTaskContainer } from "@/components/tasks/SortableTaskContainer";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MapPin,
  X,
  Archive,
  ChevronDown,
  Calendar,
  Bell,
  UserPlus,
  Flag,
  ListChecks,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { canShareList } from "@/lib/permissions";
import { usePlanLimits } from "@/hooks/usePlanLimits";

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const { user } = useAuthStore();
  const { getList, deleteList, getDisplayName } = useListStore();
  const { getTasksByList, subscribeToList, createTask, reorderTasks } =
    useTaskStore();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskLocation, setNewTaskLocation] = useState("");
  const [newTaskPhones, setNewTaskPhones] = useState<string[]>([""]);
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskDueTime, setNewTaskDueTime] = useState("");
  const [newTaskReminder, setNewTaskReminder] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [showMoreFields, setShowMoreFields] = useState(false);
  const limits = usePlanLimits();
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const list = getList(listId);
  const tasks = getTasksByList(listId);

  // Subscribe to real-time tasks for this list
  useEffect(() => {
    if (listId) subscribeToList(listId);
  }, [listId, subscribeToList]);

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
    () =>
      activeTasks
        .filter((t) => t.status === "completed")
        .sort((a, b) => {
          // Sort by completedAt timestamp, newest first
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bTime - aTime;
        }),
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

  const resetTaskForm = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskLocation("");
    setNewTaskPhones([""]);
    setNewTaskPriority("medium");
    setNewTaskDueDate("");
    setNewTaskDueTime("");
    setNewTaskReminder("");
    setNewTaskAssignee("");
    setShowMoreFields(false);
    setCreateTaskError(null);
  };

  const closeTaskModal = () => {
    setShowAddTask(false);
    resetTaskForm();
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !user || isCreatingTask) return;

    setIsCreatingTask(true);
    setCreateTaskError(null);

    try {
      // Filter out empty phone numbers
      const validPhones = newTaskPhones.filter((p) => p.trim());

      await createTask({
        listId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || "",
        location: newTaskLocation.trim() || undefined,
        phoneNumbers: validPhones.length > 0 ? validPhones : undefined,
        priority: newTaskPriority,
        createdBy: user.id,
        dueDate: newTaskDueDate || undefined,
        dueTime: newTaskDueDate && newTaskDueTime ? newTaskDueTime : undefined,
        reminders: newTaskReminder
          ? [
              {
                id: `rem_${Date.now().toString(36)}`,
                at: new Date(newTaskReminder).toISOString(),
                sent: false,
                recipientType: "me",
              },
            ]
          : undefined,
        assignedTo:
          limits.features.canAssign && newTaskAssignee
            ? newTaskAssignee
            : undefined,
      });

      closeTaskModal();
    } catch (err) {
      console.error("Error creating task:", err);
      setCreateTaskError(
        err instanceof Error
          ? err.message
          : "No se pudo crear la tarea. Intenta de nuevo.",
      );
    } finally {
      setIsCreatingTask(false);
    }
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
            setShowEditModal(true);
          }}
          onShare={() => setShowSharePanel(true)}
          onMembers={() => setShowMembersPanel(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          onBack={handleBackClick}
        />

        <div
          ref={scrollContainerRef}
          className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto pb-6"
        >
          {/* Filtros + acción principal */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div
              role="tablist"
              aria-label="Filtrar tareas"
              className="grid grid-cols-3 gap-1 p-1 rounded-xl flex-1 min-w-0"
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
                  Icon: ListChecks,
                },
              ].map(({ key, label, count, Icon }) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(key)}
                    className={cn(
                      "relative flex items-center justify-center gap-1.5 min-w-0 h-10 px-1.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 select-none",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 active:scale-[0.98]",
                      active
                        ? "shadow-sm"
                        : "hover:bg-[var(--bg-hover)]",
                    )}
                    style={{
                      backgroundColor: active ? "var(--bg-card)" : "transparent",
                      color: active
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                      border: active
                        ? "1px solid var(--border-color)"
                        : "1px solid transparent",
                    }}
                  >
                    <Icon
                      size={14}
                      className="hidden sm:block flex-shrink-0"
                      style={{
                        color: active
                          ? key === "completed"
                            ? "var(--text-success)"
                            : "var(--text-link)"
                          : "var(--text-tertiary)",
                      }}
                    />
                    <span className="truncate">{label}</span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold min-w-[20px] h-5 px-1.5 rounded-full leading-none flex items-center justify-center flex-shrink-0 tabular-nums",
                      )}
                      style={{
                        backgroundColor: active
                          ? "var(--bg-info)"
                          : "var(--bg-tertiary)",
                        color: active
                          ? "var(--text-link)"
                          : "var(--text-tertiary)",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {canEdit && (
              <Button
                onClick={() => setShowAddTask(true)}
                icon={<Plus size={16} />}
                className="w-full sm:w-auto h-10 flex-shrink-0"
              >
                Añadir tarea
              </Button>
            )}
          </div>

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
                  <section className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                      >
                        <Clock
                          size={16}
                          style={{ color: "var(--text-link)" }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <h2
                          className="text-lg font-bold tracking-tight"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Pendientes
                        </h2>
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {pendingTasks.length}
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-px mb-4"
                      style={{
                        background:
                          "linear-gradient(90deg, var(--border-color) 0%, transparent 100%)",
                      }}
                    />
                    {pendingTasks.length > 0 ? (
                      <div className="space-y-0">
                        <SortableTaskContainer
                          tasks={pendingTasks}
                          onReorder={(newOrder) =>
                            reorderTasks(newOrder.map((t) => t.id))
                          }
                          scrollContainerRef={scrollContainerRef}
                        >
                          {(
                            task,
                            dragHandleProps,
                            isDragging,
                            justDraggedRef,
                          ) => (
                            <TaskItem
                              task={task}
                              role={userMember?.role || null}
                              memberNames={memberNames}
                              listMembers={list?.members}
                              dragHandleProps={dragHandleProps}
                              isDragging={isDragging}
                              justDraggedRef={justDraggedRef}
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
                    <section className="pt-2">
                      <button
                        onClick={() => setShowCompleted((v) => !v)}
                        className="flex items-center justify-between w-full group mb-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-lg"
                            style={{ backgroundColor: "var(--bg-secondary)" }}
                          >
                            <CheckCircle2
                              size={16}
                              style={{ color: "var(--text-success)" }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <h2
                              className="text-lg font-bold tracking-tight"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Completadas
                            </h2>
                            <span
                              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: "var(--bg-secondary)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {completedTasks.length}
                            </span>
                          </div>
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
                      <div
                        className="h-px mb-4"
                        style={{
                          background:
                            "linear-gradient(90deg, var(--border-color) 0%, transparent 100%)",
                        }}
                      />
                      <AnimatePresence initial={false}>
                        {showCompleted && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-0 pt-0.5">
                              <SortableTaskContainer
                                tasks={completedTasks}
                                onReorder={(newOrder) =>
                                  reorderTasks(newOrder.map((t) => t.id))
                                }
                                scrollContainerRef={scrollContainerRef}
                              >
                                {(
                                  task,
                                  dragHandleProps,
                                  isDragging,
                                  justDraggedRef,
                                ) => (
                                  <TaskItem
                                    task={task}
                                    role={userMember?.role || null}
                                    memberNames={memberNames}
                                    listMembers={list?.members}
                                    dragHandleProps={dragHandleProps}
                                    isDragging={isDragging}
                                    justDraggedRef={justDraggedRef}
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
                  scrollContainerRef={scrollContainerRef}
                >
                  {(task, dragHandleProps, isDragging, justDraggedRef) => (
                    <TaskItem
                      task={task}
                      role={userMember?.role || null}
                      memberNames={memberNames}
                      listMembers={list?.members}
                      dragHandleProps={dragHandleProps}
                      isDragging={isDragging}
                      justDraggedRef={justDraggedRef}
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
                    <div className="space-y-0 pt-2">
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

        {/* Modal Crear tarea */}
        <Modal
          isOpen={showAddTask}
          onClose={closeTaskModal}
          title="Nueva tarea"
          description={`Se añadirá a “${list.name}”`}
          icon={<Plus size={18} />}
          size="task"
          disableClose={isCreatingTask}
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={closeTaskModal}
                className="min-w-[96px] h-10"
                disabled={isCreatingTask}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || isCreatingTask}
                isLoading={isCreatingTask}
                className="min-w-[128px] h-10"
              >
                Crear tarea
              </Button>
            </div>
          }
        >
          <form
            className="px-5 sm:px-6 py-5 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTask();
            }}
          >
            {createTaskError && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl text-sm"
                style={{
                  backgroundColor: "rgba(239,68,68,0.08)",
                  color: "var(--text-error)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
                role="alert"
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{createTaskError}</span>
              </div>
            )}

            {/* Título — campo principal */}
            <div>
              <label
                htmlFor="new-task-title"
                className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Título
              </label>
              <AutoResizeTextarea
                id="new-task-title"
                placeholder="¿Qué hay que hacer?"
                value={newTaskTitle}
                onChange={setNewTaskTitle}
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-base font-medium leading-snug focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
                minRows={1}
                maxRows={4}
              />
            </div>

            {/* Descripción */}
            <div>
              <label
                htmlFor="new-task-description"
                className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Descripción{" "}
                <span className="font-normal normal-case tracking-normal opacity-80">
                  (opcional)
                </span>
              </label>
              <AutoResizeTextarea
                id="new-task-description"
                placeholder="Detalles, contexto o pasos..."
                value={newTaskDescription}
                onChange={setNewTaskDescription}
                className="w-full px-4 py-2.5 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
                minRows={2}
                maxRows={6}
              />
            </div>

            {/* Prioridad */}
            <div>
              <label
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Flag size={12} />
                Prioridad
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "low" as const, label: "Baja", color: "#16a34a" },
                  { value: "medium" as const, label: "Media", color: "#d97706" },
                  { value: "high" as const, label: "Alta", color: "#ea580c" },
                  { value: "urgent" as const, label: "Urgente", color: "#dc2626" },
                ].map((p) => {
                  const selected = newTaskPriority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setNewTaskPriority(p.value)}
                      className="h-10 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                      style={{
                        backgroundColor: selected
                          ? `${p.color}1a`
                          : "var(--bg-secondary)",
                        color: selected ? p.color : "var(--text-secondary)",
                        border: selected
                          ? `1px solid ${p.color}`
                          : "1px solid var(--border-color)",
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fecha y hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="new-task-date"
                  className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Calendar size={12} />
                  Fecha límite
                </label>
                <input
                  id="new-task-date"
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full min-w-0 h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                    colorScheme: "inherit",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="new-task-time"
                  className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Clock size={12} />
                  Hora{" "}
                  <span className="font-normal normal-case tracking-normal opacity-80">
                    (opcional)
                  </span>
                </label>
                <input
                  id="new-task-time"
                  type="time"
                  value={newTaskDueTime}
                  onChange={(e) => setNewTaskDueTime(e.target.value)}
                  disabled={!newTaskDueDate}
                  className="w-full min-w-0 h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all disabled:opacity-50"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                    colorScheme: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Más opciones */}
            <button
              type="button"
              onClick={() => setShowMoreFields((v) => !v)}
              aria-expanded={showMoreFields}
              className="flex items-center gap-1.5 text-sm font-medium h-9 -ml-1 px-1 rounded-md transition-colors hover:opacity-80"
              style={{ color: "var(--text-link)" }}
            >
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform duration-200",
                  showMoreFields && "rotate-180",
                )}
              />
              {showMoreFields ? "Menos opciones" : "Más opciones"}
              {!showMoreFields && (
                <span
                  className="font-normal hidden sm:inline"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  · recordatorio, responsable, teléfono, ubicación
                </span>
              )}
            </button>

            <AnimatePresence initial={false}>
              {showMoreFields && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Recordatorio */}
                      <div>
                        <label
                          htmlFor="new-task-reminder"
                          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Bell size={12} />
                          Recordatorio
                        </label>
                        <input
                          id="new-task-reminder"
                          type="datetime-local"
                          value={newTaskReminder}
                          onChange={(e) => setNewTaskReminder(e.target.value)}
                          className="w-full min-w-0 h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                          style={{
                            border: "1px solid var(--border-input)",
                            backgroundColor: "var(--bg-input)",
                            color: "var(--text-primary)",
                            colorScheme: "inherit",
                          }}
                        />
                      </div>

                      {/* Responsable */}
                      <div>
                        <label
                          htmlFor="new-task-assignee"
                          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <UserPlus size={12} />
                          Responsable
                        </label>
                        <div className="relative">
                          <select
                            id="new-task-assignee"
                            value={newTaskAssignee}
                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                            disabled={!limits.features.canAssign}
                            className="w-full h-11 px-4 pr-10 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                              border: "1px solid var(--border-input)",
                              backgroundColor: "var(--bg-input)",
                              color: "var(--text-primary)",
                            }}
                          >
                            <option value="">Sin asignar</option>
                            {list.members.map((m) => (
                              <option key={m.userId} value={m.userId}>
                                {memberNames[m.userId] ||
                                  (m.userId === user.id ? "Tú" : "Miembro")}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: "var(--text-tertiary)" }}
                          />
                        </div>
                        {!limits.features.canAssign && (
                          <p
                            className="text-[11px] mt-1.5"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            Asignar responsables está disponible en Pro.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Teléfonos */}
                    <div>
                      <label
                        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Phone size={12} />
                        Teléfonos de contacto
                      </label>
                      <div className="space-y-2">
                        {newTaskPhones.map((phone, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="tel"
                              inputMode="tel"
                              placeholder={`Teléfono ${index + 1}`}
                              value={phone}
                              onChange={(e) =>
                                handlePhoneChange(index, e.target.value)
                              }
                              className="flex-1 min-w-0 h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                              style={{
                                border: "1px solid var(--border-input)",
                                backgroundColor: "var(--bg-input)",
                                color: "var(--text-primary)",
                              }}
                            />
                            {newTaskPhones.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePhone(index)}
                                aria-label="Quitar teléfono"
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[var(--bg-hover)]"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddPhone}
                          className="flex items-center gap-1.5 text-sm font-medium h-9 px-1 -ml-1 rounded-md hover:opacity-80 transition-colors"
                          style={{ color: "var(--text-link)" }}
                        >
                          <Plus size={14} />
                          Agregar otro teléfono
                        </button>
                      </div>
                    </div>

                    {/* Ubicación */}
                    <div>
                      <label
                        htmlFor="new-task-location"
                        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <MapPin size={12} />
                        Ubicación
                      </label>
                      <input
                        id="new-task-location"
                        placeholder="Dirección o enlace de Google Maps"
                        value={newTaskLocation}
                        onChange={(e) => setNewTaskLocation(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                        style={{
                          border: "1px solid var(--border-input)",
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
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
        />

        {/* Confirmar Eliminación */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="¿Eliminar lista?"
          description="Esta acción no se puede deshacer."
          size="sm"
          icon={<Trash2 size={18} />}
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="min-w-[96px] h-10"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteList}
                className="min-w-[110px] h-10"
              >
                Eliminar
              </Button>
            </div>
          }
        >
          <div className="px-5 sm:px-6 py-5">
            <div
              className="flex items-start gap-3 p-3 rounded-xl text-sm"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                color: "var(--text-error)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p className="break-words min-w-0">
                Se eliminará permanentemente &quot;{list.name}&quot; y todas sus
                tareas.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
