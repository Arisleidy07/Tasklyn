"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  FolderOpen,
  Users,
  Bell,
  Plus,
  LayoutDashboard,
  Activity,
  Trophy,
  Calendar,
  BarChart3,
  Clock,
  Zap,
  Flag,
  LogOut,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

const sidebarNav = [
  { name: "Panel de control", icon: LayoutDashboard, active: true },
  { name: "Actividad", icon: Activity },
  { name: "Equipos", icon: Users },
  { name: "Panel de Equipo", icon: BarChart3 },
  { name: "Ranking", icon: Trophy },
  { name: "Calendario", icon: Calendar },
  { name: "Notificaciones", icon: Bell, badge: 3 },
];

const recentLists = [
  { name: "Operaciones", color: "bg-blue-500", tasks: 12, shared: true },
  { name: "Ventas Q2", color: "bg-emerald-500", tasks: 8, shared: true },
  { name: "Logística", color: "bg-amber-500", tasks: 5, shared: false },
];

const stats = [
  {
    label: "Listas totales",
    value: "8",
    icon: FolderOpen,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    label: "Compartidas",
    value: "3",
    icon: Users,
    gradient: "from-purple-500 to-pink-600",
  },
  {
    label: "Tasa de éxito",
    value: "78%",
    icon: CheckCircle2,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    label: "Pendientes",
    value: "14",
    icon: Clock,
    gradient: "from-yellow-500 to-orange-600",
  },
];

const weekBars = [
  { label: "Lun", created: 3, done: 2 },
  { label: "Mar", created: 5, done: 4 },
  { label: "Mié", created: 4, done: 5 },
  { label: "Jue", created: 6, done: 3 },
  { label: "Vie", created: 7, done: 6 },
  { label: "Sáb", created: 2, done: 2 },
  { label: "Hoy", created: 4, done: 3, today: true },
];
const maxBar = 7;

const listCards = [
  {
    name: "Operaciones Junio",
    tasks: 12,
    pending: 5,
    shared: true,
    color: "bg-blue-500",
    members: ["AR", "JL", "CP"],
  },
  {
    name: "Ventas Q2",
    tasks: 8,
    pending: 3,
    shared: true,
    color: "bg-emerald-500",
    members: ["MR", "AR"],
  },
  {
    name: "Logística diaria",
    tasks: 5,
    pending: 2,
    shared: false,
    color: "bg-amber-500",
    members: ["JL"],
  },
];

export default function HeroDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.6 }}
      className="relative"
    >
      <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.9)]">
        {/* App shell: sidebar + main */}
        <div className="flex h-[500px]">
          {/* ── Sidebar ── */}
          <div className="w-[200px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-gray-50/80">
            {/* Logo area */}
            <div className="h-14 flex items-center px-4 border-b border-gray-200 bg-white/90">
              <Logo
                size="sm"
                showText={true}
                textClassName="text-gray-900 text-sm font-bold"
              />
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-hidden">
              <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
                General
              </p>
              {sidebarNav.map((item) => (
                <div
                  key={item.name}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-medium transition-colors ${
                    item.active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 hover:bg-white hover:text-gray-800"
                  }`}
                >
                  <item.icon size={13} className="flex-shrink-0" />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white px-1">
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}

              <div className="pt-3">
                <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
                  Workspace
                </p>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-medium text-gray-500 hover:bg-white hover:text-gray-800">
                  <FolderOpen size={13} className="flex-shrink-0" />
                  <span className="flex-1">Listas</span>
                  <span className="text-[9px] font-semibold min-w-[16px] h-4 flex items-center justify-center rounded bg-gray-100 text-gray-500 px-1">
                    8
                  </span>
                </div>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-medium text-blue-600 hover:bg-blue-50">
                  <Plus size={13} className="flex-shrink-0" />
                  <span>Nueva lista</span>
                </button>
              </div>

              <div className="pt-3">
                <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
                  Recientes
                </p>
                {recentLists.map((list) => (
                  <div
                    key={list.name}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[11px] text-gray-500 hover:bg-white hover:text-gray-700"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${list.color}`}
                    />
                    <span className="flex-1 truncate">{list.name}</span>
                  </div>
                ))}
              </div>
            </nav>

            {/* User */}
            <div className="px-3 py-3 border-t border-gray-200 bg-white/90 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0">
                AR
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-800 truncate">
                  Ana Rodríguez
                </p>
                <p className="text-[9px] text-gray-400 truncate">Plan PRO</p>
              </div>
              <LogOut size={11} className="text-gray-400 flex-shrink-0" />
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-gray-200 bg-white flex-shrink-0">
              <div>
                <h1 className="text-sm font-semibold text-gray-900">
                  Panel de control
                </h1>
                <p className="text-[10px] text-gray-400">Bienvenida, Ana</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell size={15} className="text-gray-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-medium">
                  <Plus size={11} />
                  Nueva lista
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2.5">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="p-3 rounded-2xl border border-gray-200/80 bg-white hover:border-blue-200 transition-colors"
                  >
                    <div
                      className={`w-7 h-7 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-2 shadow-sm`}
                    >
                      <stat.icon size={13} className="text-white" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 tabular-nums">
                      {stat.value}
                    </p>
                    <p className="text-[9px] text-gray-400 font-medium">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Widgets row */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Weekly activity */}
                <div className="col-span-2 p-3.5 rounded-2xl border border-gray-200/80 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-800">
                        Actividad semanal
                      </p>
                      <p className="text-[9px] text-gray-400">Últimos 7 días</p>
                    </div>
                    <div className="flex items-center gap-2 text-[9px]">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" />
                        Creadas
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                        Completadas
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-20">
                    {weekBars.map((d, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-0.5"
                      >
                        <div className="w-full flex gap-0.5 items-end h-16">
                          <div
                            className="flex-1 rounded-t bg-blue-200 transition-all"
                            style={{
                              height: `${Math.round((d.created / maxBar) * 64)}px`,
                              minHeight: "2px",
                            }}
                          />
                          <div
                            className="flex-1 rounded-t bg-green-400 transition-all"
                            style={{
                              height: `${Math.round((d.done / maxBar) * 64)}px`,
                              minHeight: "2px",
                            }}
                          />
                        </div>
                        <span
                          className={`text-[8px] font-medium capitalize ${d.today ? "text-blue-600" : "text-gray-400"}`}
                        >
                          {d.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
                        <Zap size={10} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-800">4</p>
                        <p className="text-[8px] text-gray-400">creadas hoy</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-800">3</p>
                        <p className="text-[8px] text-gray-400">
                          completadas hoy
                        </p>
                      </div>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm font-bold text-gray-900">78%</p>
                      <p className="text-[8px] text-gray-400">productividad</p>
                    </div>
                  </div>
                </div>

                {/* Priority breakdown */}
                <div className="p-3.5 rounded-2xl border border-gray-200/80 bg-white">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Flag size={11} className="text-gray-400" />
                    <p className="text-[11px] font-semibold text-gray-800">
                      Prioridades
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      {
                        label: "Crítica",
                        color: "bg-red-500",
                        bg: "bg-red-50",
                        text: "text-red-600",
                        count: 2,
                      },
                      {
                        label: "Alta",
                        color: "bg-orange-500",
                        bg: "bg-orange-50",
                        text: "text-orange-600",
                        count: 5,
                      },
                      {
                        label: "Media",
                        color: "bg-yellow-400",
                        bg: "bg-yellow-50",
                        text: "text-yellow-600",
                        count: 7,
                      },
                      {
                        label: "Baja",
                        color: "bg-green-400",
                        bg: "bg-green-50",
                        text: "text-green-600",
                        count: 4,
                      },
                    ].map((p) => (
                      <div
                        key={p.label}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${p.bg}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${p.color}`}
                          />
                          <span className="text-[10px] font-medium text-gray-700">
                            {p.label}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold tabular-nums ${p.text}`}
                        >
                          {p.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* List cards */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FolderOpen size={12} className="text-blue-600" />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-800">
                    Mis listas
                  </p>
                  <span className="text-[9px] text-gray-400">3 listas</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {listCards.map((list, i) => (
                    <motion.div
                      key={list.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.07 }}
                      className="p-3 rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${list.color}`} />
                        <span className="text-[10px] font-semibold text-gray-800 truncate flex-1">
                          {list.name}
                        </span>
                        {list.shared && (
                          <div className="w-4 h-4 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Users size={9} className="text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] text-gray-400">
                          {list.tasks} tareas
                        </span>
                        <span className="text-[9px] text-orange-500 font-medium">
                          {list.pending} pend.
                        </span>
                      </div>
                      <div className="h-0.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${list.color}`}
                          style={{
                            width: `${Math.round(((list.tasks - list.pending) / list.tasks) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex -space-x-1 mt-2">
                        {list.members.map((m, mi) => (
                          <div
                            key={mi}
                            className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-[7px] text-white border border-white"
                          >
                            {m[0]}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
