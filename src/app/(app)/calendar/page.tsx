"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTaskStore } from "@/stores/taskStore";
import { useTeamStore } from "@/stores/teamStore";
import { useListStore } from "@/stores/listStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { TaskCalendar } from "@/components/calendar/TaskCalendar";
import Modal from "@/components/ui/Modal";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Tag,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isSameDay, isToday, isPast } from "date-fns";
import { es } from "date-fns/locale";
import type { Task } from "@/types";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();
  const { currentTeam } = useTeamStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "completed" | "overdue"
  >("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const router = useRouter();
  const { lists } = useListStore();

  // Get tasks with due dates
  const tasksWithDates = useMemo(
    () => tasks.filter((task) => task.dueDate),
    [tasks],
  );

  // Apply filters
  const filteredTasks = useMemo(() => {
    const now = new Date();
    switch (selectedFilter) {
      case "pending":
        return tasksWithDates.filter((t) => t.status === "pending");
      case "completed":
        return tasksWithDates.filter((t) => t.status === "completed");
      case "overdue":
        return tasksWithDates.filter(
          (t) =>
            t.dueDate && parseISO(t.dueDate) < now && t.status !== "completed",
        );
      default:
        return tasksWithDates;
    }
  }, [tasksWithDates, selectedFilter]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const getListName = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    return list?.name || "Lista";
  };

  if (!user) return null;

  return (
    <>
      <Header
        title="Calendario"
        description={
          currentTeam
            ? `Tareas del equipo ${currentTeam.name}`
            : "Todas tus tareas organizadas por fecha"
        }
        showMenuButton={true}
        actions={<Button icon={<Plus size={16} />}>Nueva tarea</Button>}
      />

      <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/70"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center">
                <CalendarIcon size={18} className="text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">
                  {filteredTasks.length}
                </p>
                <p className="text-sm text-slate-400">Total de tareas</p>
              </div>
            </div>
            {/* Mini sparkline para total */}
            <div className="mt-3 h-8 flex items-end gap-0.5">
              {[45, 52, 48, 65, 72, 58].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{
                    delay: 0.2 + index * 0.05,
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                  className="flex-1 rounded-t-sm bg-blue-500/40"
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/70"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center">
                <Clock size={18} className="text-emerald-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">
                  {filteredTasks.filter((t) => t.status === "pending").length}
                </p>
                <p className="text-sm text-slate-400">Pendientes</p>
              </div>
            </div>
            {/* Mini sparkline para pendientes */}
            <div className="mt-3 h-8 flex items-end gap-0.5">
              {[30, 35, 42, 38, 45, 40].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{
                    delay: 0.3 + index * 0.05,
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                  className="flex-1 rounded-t-sm bg-emerald-500/40"
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/70"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/20 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-cyan-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">
                  {filteredTasks.filter((t) => t.status === "completed").length}
                </p>
                <p className="text-sm text-slate-400">Completadas</p>
              </div>
            </div>
            {/* Mini sparkline para completadas */}
            <div className="mt-3 h-8 flex items-end gap-0.5">
              {[60, 65, 58, 72, 68, 75].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{
                    delay: 0.4 + index * 0.05,
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                  className="flex-1 rounded-t-sm bg-cyan-500/40"
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl border border-slate-700/60 bg-slate-900/70"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-400/20 flex items-center justify-center">
                <AlertTriangle size={18} className="text-rose-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">
                  {
                    filteredTasks.filter(
                      (t) =>
                        t.dueDate &&
                        new Date(t.dueDate) < new Date() &&
                        t.status !== "completed",
                    ).length
                  }
                </p>
                <p className="text-sm text-slate-400">Vencidas</p>
              </div>
            </div>
            {/* Mini sparkline para vencidas */}
            <div className="mt-3 h-8 flex items-end gap-0.5">
              {[15, 12, 18, 10, 8, 5].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{
                    delay: 0.5 + index * 0.05,
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                  className="flex-1 rounded-t-sm bg-rose-500/40"
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/70 rounded-2xl border border-slate-700/60 p-6"
        >
          <TaskCalendar
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            className="bg-transparent shadow-none"
          />
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Completada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Vencida</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Alta prioridad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Normal</span>
          </div>
        </motion.div>
      </div>

      {/* Task Detail Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Detalle de Tarea"
        size="md"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  selectedTask.status === "completed"
                    ? "bg-green-500"
                    : "border-2",
                )}
                style={
                  selectedTask.status !== "completed"
                    ? { borderColor: "var(--border-color)" }
                    : {}
                }
              >
                {selectedTask.status === "completed" && (
                  <CheckCircle2
                    size={14}
                    style={{ color: "var(--text-on-accent)" }}
                  />
                )}
              </div>
              <div>
                <h3
                  className={cn(
                    "font-medium text-lg",
                    selectedTask.status === "completed" ? "line-through" : "",
                  )}
                >
                  {selectedTask.title}
                </h3>
                {selectedTask.description && (
                  <p
                    className="mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {selectedTask.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedTask.dueDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs",
                    isPast(parseISO(selectedTask.dueDate)) &&
                      selectedTask.status !== "completed"
                      ? "text-red-700"
                      : isToday(parseISO(selectedTask.dueDate))
                        ? "text-blue-700"
                        : "",
                  )}
                >
                  <CalendarIcon size={12} />
                  {format(parseISO(selectedTask.dueDate), "d MMMM yyyy", {
                    locale: es,
                  })}
                  {selectedTask.dueTime && ` · ${selectedTask.dueTime}`}
                </span>
              )}

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                <ListTodo size={12} />
                {getListName(selectedTask.listId)}
              </span>

              {selectedTask.priority && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs",
                    selectedTask.priority === "urgent"
                      ? "text-red-700"
                      : selectedTask.priority === "high"
                        ? "text-orange-700"
                        : selectedTask.priority === "medium"
                          ? "text-yellow-700"
                          : "text-green-700",
                  )}
                >
                  <Tag size={12} />
                  {selectedTask.priority === "urgent"
                    ? "Urgente"
                    : selectedTask.priority === "high"
                      ? "Alta"
                      : selectedTask.priority === "medium"
                        ? "Media"
                        : "Baja"}
                </span>
              )}
            </div>

            <div
              className="pt-4 border-t"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Button
                onClick={() => {
                  setIsTaskModalOpen(false);
                  router.push(`/lists/${selectedTask.listId}`);
                }}
                className="w-full"
                icon={<ArrowRight size={16} />}
              >
                Ver en lista
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
