"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Calendar,
  Bell,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

/* ── Icon-only sidebar nav ── */
const sidebarIcons = [
  { icon: LayoutDashboard, active: true, color: "text-blue-400" },
  { icon: ListTodo, active: false, color: "text-slate-500" },
  { icon: Users, active: false, color: "text-slate-500" },
  { icon: Calendar, active: false, color: "text-slate-500" },
  { icon: Bell, active: false, color: "text-slate-500", badge: true },
  { icon: BarChart3, active: false, color: "text-slate-500" },
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
      <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-700/60 bg-slate-900 shadow-[0_24px_80px_rgba(5,10,30,0.85)] w-full max-w-[420px] mx-auto">
        <div className="flex h-[390px]">
          {/* ── Icon-only sidebar ── */}
          <div className="w-12 flex-shrink-0 flex flex-col items-center py-3 gap-1 bg-slate-950/70 border-r border-slate-800/60">
            {/* Logo */}
            <div className="mb-2 w-8 h-8 flex items-center justify-center overflow-hidden">
              <Logo
                size="sm"
                showText={false}
                className="scale-[0.52] origin-center"
              />
            </div>
            <div className="flex-1 flex flex-col items-center gap-1 pt-1">
              {sidebarIcons.map(({ icon: Icon, active, color, badge }, i) => (
                <div key={i} className="relative">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      active
                        ? "bg-blue-600/30 ring-1 ring-blue-500/40"
                        : "hover:bg-slate-800"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={active ? "text-blue-400" : color}
                    />
                  </div>
                  {badge && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-slate-950" />
                  )}
                </div>
              ))}
            </div>
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[8px] text-white font-bold mt-auto">
              AR
            </div>
          </div>

          {/* ── Main area ── */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            {/* Top bar */}
            <div className="h-9 flex items-center justify-between px-3.5 border-b border-slate-800/60 flex-shrink-0">
              <span className="text-[10px] font-semibold text-slate-300 tracking-wide">
                Panel de control
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-emerald-400 font-medium flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  En vivo
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden">
              {/* ── Row 1: 3 KPI cards ── */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Completadas",
                    value: 78,
                    suffix: "%",
                    color: "#60a5fa",
                    ring: true,
                  },
                  {
                    label: "Equipos activos",
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
                ].map(({ label, value, suffix, color, ring }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="bg-slate-800/50 rounded-xl p-2.5 flex flex-col items-center border border-slate-700/40"
                  >
                    {ring ? (
                      <div className="relative mb-1">
                        <Ring pct={value} color={color} size={40} stroke={4} />
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                          style={{ color }}
                        >
                          {value}%
                        </span>
                      </div>
                    ) : (
                      <motion.p
                        className="text-xl font-bold tabular-nums mb-1"
                        style={{ color }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        {value}
                        {suffix}
                      </motion.p>
                    )}
                    <p className="text-[8px] text-slate-500 text-center leading-tight">
                      {label}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* ── Row 2: Bar chart + progress list ── */}
              <div className="grid grid-cols-5 gap-2 flex-1 min-h-0">
                {/* Bar chart */}
                <div className="col-span-3 bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/40 flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-semibold text-slate-400">
                      Actividad semanal
                    </span>
                    <TrendingUp size={10} className="text-blue-400" />
                  </div>
                  <div className="flex-1 flex items-end gap-1 pb-1">
                    {bars.map((b, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-0.5"
                      >
                        <motion.div
                          className={`w-full rounded-t ${b.today ? "bg-blue-400" : b.color}`}
                          style={{ minHeight: 2 }}
                          initial={{ height: 0 }}
                          animate={{ height: `${b.h}%` }}
                          transition={{
                            delay: 0.5 + i * 0.06,
                            duration: 0.6,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-0.5">
                    {["L", "M", "X", "J", "V", "S", "H"].map((d, i) => (
                      <span
                        key={i}
                        className={`flex-1 text-center text-[7px] ${i === 6 ? "text-blue-400 font-semibold" : "text-slate-600"}`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress list */}
                <div className="col-span-2 bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/40 flex flex-col gap-1.5">
                  <span className="text-[9px] font-semibold text-slate-400 mb-0.5">
                    Progreso
                  </span>
                  {[
                    { label: "Ventas Q2", pct: 72, color: "bg-blue-500" },
                    { label: "Ops. Junio", pct: 58, color: "bg-emerald-500" },
                    { label: "Logística", pct: 40, color: "bg-amber-400" },
                  ].map(({ label, pct, color }, i) => (
                    <div key={label}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[8px] text-slate-400 truncate">
                          {label}
                        </span>
                        <span className="text-[8px] text-slate-500 tabular-nums">
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-slate-700/60 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            delay: 0.6 + i * 0.12,
                            duration: 0.8,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Row 3: bottom mini stats ── */}
              <div className="grid grid-cols-3 gap-2">
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
                ].map(({ icon: Icon, label, value, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.07 }}
                    className="flex items-center gap-1.5 bg-slate-800/40 rounded-xl px-2 py-1.5 border border-slate-700/30"
                  >
                    <Icon size={11} className={color} />
                    <div>
                      <p
                        className={`text-[9px] font-bold tabular-nums ${color}`}
                      >
                        {value}
                      </p>
                      <p className="text-[7px] text-slate-600 leading-none">
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
