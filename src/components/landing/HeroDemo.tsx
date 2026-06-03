"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  ListTodo,
  Users,
  FolderKanban,
  TrendingUp,
  Activity,
  PieChart,
  Bell,
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  LayoutGrid,
  MessageSquare,
  Paperclip,
  Flag,
  Calendar,
  Clock,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

const priorityColors = {
  high: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const tagColors: Record<string, string> = {
  Logística: "bg-blue-500/15 text-blue-400",
  Ventas: "bg-emerald-500/15 text-emerald-400",
  Finanzas: "bg-amber-500/15 text-amber-400",
  Operaciones: "bg-purple-500/15 text-purple-400",
  Compras: "bg-cyan-500/15 text-cyan-400",
  IT: "bg-slate-500/15 text-slate-400",
  Urgente: "bg-rose-500/15 text-rose-400",
  Meeting: "bg-indigo-500/15 text-indigo-400",
  Reporte: "bg-teal-500/15 text-teal-400",
};

export default function HeroDemo() {
  const columns = [
    {
      title: "Por hacer",
      count: 5,
      color: "bg-slate-400",
      tasks: [
        {
          title: "Inventario sucursal Norte",
          priority: "high" as const,
          tags: ["Logística", "Urgente"],
          assignees: ["MR"],
          dueDate: "Hoy",
          comments: 3,
          attachments: 1,
        },
        {
          title: "Facturas pendientes por pagar",
          priority: "high" as const,
          tags: ["Finanzas"],
          assignees: ["AR"],
          dueDate: "Mañana",
          comments: 1,
          attachments: 2,
        },
        {
          title: "Seguimiento proveedores",
          priority: "medium" as const,
          tags: ["Compras"],
          assignees: ["CP", "JL"],
          dueDate: "Vie",
          comments: 0,
          attachments: 0,
        },
      ],
    },
    {
      title: "En progreso",
      count: 2,
      color: "bg-blue-500",
      tasks: [
        {
          title: "Reunión con cliente Corporativo",
          priority: "high" as const,
          tags: ["Ventas", "Meeting"],
          assignees: ["JL", "AR", "CP"],
          dueDate: "Hoy, 11:00",
          comments: 5,
          attachments: 1,
          progress: 60,
        },
        {
          title: "Comprar suministros oficina",
          priority: "medium" as const,
          tags: ["Operaciones"],
          assignees: ["AR"],
          dueDate: "Hoy, 09:30",
          comments: 2,
          attachments: 0,
          progress: 80,
        },
      ],
    },
    {
      title: "Completadas",
      count: 8,
      color: "bg-emerald-500",
      tasks: [
        {
          title: "Reporte mensual ventas",
          priority: "medium" as const,
          tags: ["Ventas", "Reporte"],
          assignees: ["JL"],
          completedDate: "Ayer",
          comments: 4,
          attachments: 3,
        },
        {
          title: "Actualizar inventario software",
          priority: "low" as const,
          tags: ["IT"],
          assignees: ["MR"],
          completedDate: "Ayer",
          comments: 1,
          attachments: 0,
        },
      ],
    },
  ];

  const sidebarLists = [
    { name: "Operaciones", count: 12, color: "bg-blue-500" },
    { name: "Ventas", count: 8, color: "bg-emerald-500" },
    { name: "Logística", count: 5, color: "bg-amber-500" },
    { name: "Finanzas", count: 3, color: "bg-rose-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.6 }}
      className="relative"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.95)]">
        {/* Top Bar */}
        <div className="h-14 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Logo size="sm" className="w-7 h-7" />
              <span className="font-semibold text-slate-100 text-sm">Tasklyn</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-[10px] text-blue-400 border border-blue-500/20">PRO</span>
            </div>
            <nav className="hidden sm:flex items-center gap-1">
              {["Dashboard", "Listas", "Equipos", "Calendario"].map((item) => (
                <button
                  key={item}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    item === "Dashboard"
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
              <Search size={14} className="text-slate-500" />
              <span className="text-[11px] text-slate-500">Buscar tareas...</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-700 text-[9px] text-slate-400">⌘K</span>
            </div>
            <button className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 relative">
              <Bell size={14} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-slate-900" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[10px] text-white font-medium">
              AR
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[480px]">
          {/* Sidebar */}
          <div className="w-14 sm:w-52 border-r border-slate-800 bg-slate-900/50 py-4 flex flex-col gap-1">
            <div className="px-3 mb-3">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 hover:bg-blue-500/25 transition-colors">
                <Plus size={14} />
                <span className="hidden sm:block text-[11px] font-medium">Nueva tarea</span>
              </button>
            </div>

            <div className="px-2 space-y-0.5">
              <div className="px-2 py-1.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider hidden sm:block">
                Listas
              </div>
              {sidebarLists.map((list) => (
                <button
                  key={list.name}
                  className={`w-full flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                    list.name === "Operaciones"
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${list.color}`} />
                  <span className="hidden sm:block text-[11px] flex-1 text-left">{list.name}</span>
                  <span className="hidden sm:block text-[10px] text-slate-500">{list.count}</span>
                </button>
              ))}
            </div>

            <div className="mt-auto px-3 pt-4 border-t border-slate-800/50">
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:block text-[10px] text-slate-400">Sistema activo</span>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="flex-1 p-4 overflow-x-auto">
            {/* Board Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-100">Operaciones Junio</h2>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/70">
                  <Users size={12} className="text-slate-400" />
                  <span className="text-[11px] text-slate-400">6 miembros</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:text-slate-100 transition-colors">
                  <Filter size={12} />
                  <span className="hidden sm:inline">Filtrar</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:text-slate-100 transition-colors">
                  <LayoutGrid size={12} />
                  <span className="hidden sm:inline">Vista</span>
                </button>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-4 min-w-[700px]">
              {columns.map((column, colIndex) => (
                <div key={column.title} className="flex-1 min-w-[220px]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${column.color}`} />
                      <span className="text-[12px] font-medium text-slate-200">{column.title}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">
                        {column.count}
                      </span>
                    </div>
                    <button className="p-1 rounded hover:bg-slate-800 text-slate-500 transition-colors">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    {column.tasks.map((task, taskIndex) => (
                      <motion.div
                        key={task.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + colIndex * 0.1 + taskIndex * 0.05 }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all hover:translate-y-[-2px] ${
                          column.title === "Completadas"
                            ? "bg-slate-900/50 border-slate-800 opacity-70"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                        }`}
                      >
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${tagColors[tag] || "bg-slate-500/15 text-slate-400"}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Title */}
                        <h4 className={`text-[12px] font-medium mb-2 ${column.title === "Completadas" ? "text-slate-500 line-through" : "text-slate-200"}`}>
                          {task.title}
                        </h4>

                        {/* Priority Indicator */}
                        {column.title !== "Completadas" && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${priorityColors[task.priority]}`}>
                              {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                            </div>
                          </div>
                        )}

                        {/* Progress Bar for In Progress */}
                        {"progress" in task && task.progress && (
                          <div className="mb-2">
                            <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Footer: Due Date, Assignees, Meta */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                          <div className="flex items-center gap-2">
                            {/* Due Date */}
                            <div className={`flex items-center gap-1 text-[10px] ${"completedDate" in task ? "text-emerald-400" : "dueDate" in task && task.dueDate === "Hoy" ? "text-rose-400" : "text-slate-500"}`}>
                              <Clock size={10} />
                              <span>{"completedDate" in task ? task.completedDate : task.dueDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Comments & Attachments */}
                            {(task.comments > 0 || task.attachments > 0) && (
                              <div className="flex items-center gap-2">
                                {task.comments > 0 && (
                                  <div className="flex items-center gap-0.5 text-[9px] text-slate-500">
                                    <MessageSquare size={10} />
                                    <span>{task.comments}</span>
                                  </div>
                                )}
                                {task.attachments > 0 && (
                                  <div className="flex items-center gap-0.5 text-[9px] text-slate-500">
                                    <Paperclip size={10} />
                                    <span>{task.attachments}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Assignees */}
                            <div className="flex -space-x-1">
                              {task.assignees.map((assignee, i) => (
                                <div
                                  key={i}
                                  className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[8px] text-slate-200 border border-slate-800"
                                >
                                  {assignee}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Add Task Button */}
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors">
                      <Plus size={14} />
                      <span className="text-[11px]">Agregar tarea</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
