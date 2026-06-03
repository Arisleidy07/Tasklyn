"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Activity,
  Users,
  BarChart3,
  Trophy,
  Calendar,
  History,
  Bell,
  FolderOpen,
  Plus,
  User,
  Settings,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

/* ── Sidebar navigation items (matching real Tasklyn structure) ── */
const mainNav = [
  { name: "Panel de control", icon: LayoutDashboard, active: true },
  { name: "Actividad", icon: Activity, active: false },
  { name: "Equipos", icon: Users, active: false },
  { name: "Panel de Equipo", icon: BarChart3, active: false },
  { name: "Ranking", icon: Trophy, active: false },
  { name: "Calendario", icon: Calendar, active: false },
  { name: "Historial", icon: History, active: false },
  { name: "Notificaciones", icon: Bell, active: false, badge: 3 },
];

const recentLists = [
  { name: "Operaciones Junio", type: "shared" },
  { name: "Ventas Q2", type: "personal" },
  { name: "Logística", type: "shared" },
  { name: "Finanzas", type: "personal" },
];

/* ── Animated bar chart data ── */
const bars = [
  { h: 45, color: "bg-blue-500/60" },
  { h: 65, color: "bg-blue-500/70" },
  { h: 55, color: "bg-blue-500/60" },
  { h: 80, color: "bg-blue-500" },
  { h: 60, color: "bg-blue-500/70" },
  { h: 90, color: "bg-blue-400" },
  { h: 70, color: "bg-blue-500/80", today: true },
];

/* ── Progress ring SVG helper ── */
function Ring({
  pct,
  color,
  size = 44,
  stroke = 4,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function HeroDemo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.55 }}
      className="relative"
    >
      {/* Ambient glow */}
      <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-500/8 blur-3xl pointer-events-none" />

      {/* Demo shell */}
      <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-700/60 bg-slate-900 shadow-[0_24px_80px_rgba(5,10,30,0.85)] w-full max-w-[580px] mx-auto">
        <div className="flex h-[420px]">
          {/* ── Authentic Tasklyn Sidebar ── */}
          <div className="w-[220px] flex-shrink-0 flex flex-col bg-slate-950/70 border-r border-slate-800/60">
            {/* Logo */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800/60 flex-shrink-0">
              <Logo size="md" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-4 overflow-hidden">
              {/* General */}
              <div className="space-y-1">
                <p className="px-3 mb-2 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                  General
                </p>
                {mainNav.map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-medium transition-all ${
                      item.active
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Workspace */}
              <div className="space-y-1">
                <p className="px-3 mb-2 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                  Workspace
                </p>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-medium bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                  <FolderOpen size={16} className="flex-shrink-0" />
                  <span className="flex-1">Listas</span>
                  <span className="text-[10px] font-semibold min-w-[16px] h-4 flex items-center justify-center rounded-md px-1.5 bg-white/20">
                    12
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-medium text-blue-400 hover:bg-blue-950/30 cursor-pointer">
                  <Plus size={16} className="flex-shrink-0" />
                  <span>Nueva lista</span>
                </div>
              </div>

              {/* Recientes */}
              <div className="space-y-1">
                <p className="px-3 mb-2 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                  Recientes
                </p>
                {recentLists.map((list) => (
                  <div
                    key={list.name}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        list.type === "shared" ? "bg-blue-400" : "bg-slate-500"
                      }`}
                    />
                    <span className="truncate flex-1">{list.name}</span>
                  </div>
                ))}
              </div>

              {/* Cuenta */}
              <div className="space-y-1">
                <p className="px-3 mb-2 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                  Cuenta
                </p>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
                  <User size={16} className="flex-shrink-0" />
                  <span className="flex-1">Perfil</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
                  <Settings size={16} className="flex-shrink-0" />
                  <span className="flex-1">Configuración</span>
                </div>
              </div>
            </nav>

            {/* User section */}
            <div className="px-3 py-3 border-t border-slate-800/60 flex-shrink-0">
              <div className="flex items-center gap-3 p-2 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] text-white font-bold">
                  AR
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    Arisleidy
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    arisleidy@tasklyn.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Dashboard Area ── */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            {/* Top bar */}
            <div className="h-12 flex items-center justify-between px-5 border-b border-slate-800/60 flex-shrink-0">
              <div>
                <h1 className="text-sm font-semibold text-slate-100">
                  Panel de control
                </h1>
                <p className="text-[10px] text-slate-500">
                  Bienvenido, Arisleidy
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  En vivo
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
              {/* ── Stats Cards Row ── */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    label: "Completadas",
                    value: 78,
                    suffix: "%",
                    color: "#60a5fa",
                    ring: true,
                  },
                  {
                    label: "Equipos",
                    value: 6,
                    suffix: "",
                    color: "#34d399",
                    ring: false,
                  },
                  {
                    label: "Listas",
                    value: 12,
                    suffix: "",
                    color: "#a78bfa",
                    ring: false,
                  },
                  {
                    label: "Compartidas",
                    value: 8,
                    suffix: "",
                    color: "#f472b6",
                    ring: false,
                  },
                ].map(({ label, value, suffix, color, ring }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center border border-slate-700/40"
                  >
                    {ring ? (
                      <div className="relative mb-2">
                        <Ring pct={value} color={color} size={44} stroke={4} />
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                          style={{ color }}
                        >
                          {value}%
                        </span>
                      </div>
                    ) : (
                      <motion.p
                        className="text-2xl font-bold tabular-nums mb-1"
                        style={{ color }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                      >
                        {value}
                        {suffix}
                      </motion.p>
                    )}
                    <p className="text-[9px] text-slate-500 text-center leading-tight">
                      {label}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* ── Main Visual Area: Chart + Progress ── */}
              <div className="grid grid-cols-5 gap-4 flex-1 min-h-0">
                {/* Bar chart */}
                <div className="col-span-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/40 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold text-slate-400">
                      Actividad semanal
                    </span>
                    <TrendingUp size={12} className="text-blue-400" />
                  </div>
                  <div className="flex-1 flex items-end gap-2 pb-2">
                    {bars.map((b, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <motion.div
                          className={`w-full rounded-t ${b.today ? "bg-blue-400" : b.color}`}
                          style={{ minHeight: 4 }}
                          initial={{ height: 0 }}
                          animate={{ height: `${b.h}%` }}
                          transition={{
                            delay: 0.5 + i * 0.05,
                            duration: 0.6,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["L", "M", "X", "J", "V", "S", "H"].map((d, i) => (
                      <span
                        key={i}
                        className={`flex-1 text-center text-[8px] ${i === 6 ? "text-blue-400 font-semibold" : "text-slate-600"}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress metrics */}
                <div className="col-span-2 bg-slate-800/50 rounded-xl p-4 border border-slate-700/40 flex flex-col gap-3">
                  <span className="text-[10px] font-semibold text-slate-400">
                    Progreso
                  </span>
                  {[
                    { label: "Ventas Q2", pct: 72, color: "bg-blue-500" },
                    { label: "Ops. Junio", pct: 58, color: "bg-emerald-500" },
                    { label: "Logística", pct: 40, color: "bg-amber-400" },
                    { label: "Finanzas", pct: 85, color: "bg-purple-500" },
                  ].map(({ label, pct, color }, i) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[9px] text-slate-400 truncate">
                          {label}
                        </span>
                        <span className="text-[9px] text-slate-500 tabular-nums">
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            delay: 0.6 + i * 0.1,
                            duration: 0.8,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Bottom Quick Stats ── */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    icon: CheckCircle2,
                    label: "Tareas hoy",
                    value: "7/10",
                    color: "text-emerald-400",
                  },
                  {
                    icon: Users,
                    label: "Miembros",
                    value: "24",
                    color: "text-blue-400",
                  },
                  {
                    icon: Zap,
                    label: "Productividad",
                    value: "91%",
                    color: "text-amber-400",
                  },
                  {
                    icon: TrendingUp,
                    label: "Mejora",
                    value: "+12%",
                    color: "text-purple-400",
                  },
                ].map(({ icon: Icon, label, value, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="flex items-center gap-2 bg-slate-800/40 rounded-xl px-3 py-2 border border-slate-700/30"
                  >
                    <Icon size={12} className={color} />
                    <div>
                      <p
                        className={`text-[10px] font-bold tabular-nums ${color}`}
                      >
                        {value}
                      </p>
                      <p className="text-[8px] text-slate-600 leading-none">
                        {label}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
