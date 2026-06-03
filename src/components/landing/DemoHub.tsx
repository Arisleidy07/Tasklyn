"use client";

import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Bell,
  Clock,
  Zap,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

const nodes = [
  {
    id: "equipo",
    label: "Equipo",
    icon: Users,
    color: "blue",
    position: "top",
    delay: 0.1,
  },
  {
    id: "listas",
    label: "Listas",
    icon: FolderKanban,
    color: "emerald",
    position: "left",
    delay: 0.2,
  },
  {
    id: "tareas",
    label: "Tareas",
    icon: CheckCircle2,
    color: "cyan",
    position: "right",
    delay: 0.3,
  },
  {
    id: "recordatorios",
    label: "Recordatorios",
    icon: Bell,
    color: "amber",
    position: "bottom-left",
    delay: 0.4,
  },
  {
    id: "vencimientos",
    label: "Vencimientos",
    icon: Clock,
    color: "rose",
    position: "bottom-right",
    delay: 0.5,
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    glow: "shadow-rose-500/20",
  },
};

// Animated arrow component
function AnimatedArrow({ direction, className }: { direction: "up" | "down" | "left" | "right"; className?: string }) {
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : direction === "left" ? ArrowLeft : ArrowRight;
  
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <motion.div
        animate={{
          x: direction === "right" ? [0, 8, 0] : direction === "left" ? [0, -8, 0] : 0,
          y: direction === "down" ? [0, 8, 0] : direction === "up" ? [0, -8, 0] : 0,
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Icon size={16} className="text-blue-400" />
      </motion.div>
      {/* Trail effect */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.5, 0, 0.5],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Icon size={16} className="text-blue-400/30" />
      </motion.div>
    </motion.div>
  );
}

export default function DemoHub() {
  return (
    <section className="py-20 sm:py-24 bg-slate-950 border-t border-slate-800/70 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
              <Sparkles size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Todo conectado</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-50 mb-3 tracking-tight">
              Seguimiento de tareas en tiempo real
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
              Tasklyn conecta todas las operaciones de tu empresa con gestión
              colaborativa, calendario inteligente y recordatorios automáticos.
            </p>
          </motion.div>
        </div>

        {/* Hub visual central */}
        <div className="relative">
          {/* Connection lines with animated flow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-full h-full absolute" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
              <defs>
                {/* Gradient for flowing effect */}
                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(59,130,246,0)">
                    <animate attributeName="offset" values="-0.5;1.5" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" stopColor="rgba(59,130,246,0.8)">
                    <animate attributeName="offset" values="-0.5;1.5" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="rgba(59,130,246,0)">
                    <animate attributeName="offset" values="-0.5;1.5" dur="2s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal lines with flow */}
              <line x1="120" y1="200" x2="320" y2="200" stroke="url(#flowGradient)" strokeWidth="2" filter="url(#glow)" opacity="0.8" />
              <line x1="480" y1="200" x2="680" y2="200" stroke="url(#flowGradient)" strokeWidth="2" filter="url(#glow)" opacity="0.8" />
              
              {/* Vertical lines */}
              <line x1="400" y1="60" x2="400" y2="140" stroke="url(#flowGradient)" strokeWidth="2" filter="url(#glow)" opacity="0.8" />
              <line x1="400" y1="260" x2="400" y2="340" stroke="url(#flowGradient)" strokeWidth="2" filter="url(#glow)" opacity="0.8" />
              
              {/* Diagonal lines to bottom nodes */}
              <line x1="220" y1="280" x2="320" y2="240" stroke="rgba(59,130,246,0.2)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="580" y1="280" x2="480" y2="240" stroke="rgba(59,130,246,0.2)" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>

          {/* Hub container */}
          <div className="relative h-[420px] sm:h-[400px]">
            {/* Animated arrows showing workflow */}
            <AnimatedArrow direction="right" className="left-[330px] top-[192px]" />
            <AnimatedArrow direction="left" className="right-[330px] top-[192px]" />
            <AnimatedArrow direction="down" className="left-[392px] top-[145px]" />
            <AnimatedArrow direction="up" className="left-[392px] bottom-[145px]" />

            {/* Top node - Equipo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="absolute left-1/2 -translate-x-1/2 top-0"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={`flex flex-col items-center p-4 rounded-2xl bg-slate-900 border ${colorClasses.blue.border} shadow-lg ${colorClasses.blue.glow} backdrop-blur-sm transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl ${colorClasses.blue.bg} flex items-center justify-center mb-2`}>
                  <Users size={24} className={colorClasses.blue.text} />
                </div>
                <span className="text-xs font-medium text-slate-300">Equipo</span>
                <span className="text-[10px] text-slate-500">24 miembros</span>
              </motion.div>
            </motion.div>

            {/* Left node - Listas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="absolute left-0 sm:left-12 top-1/2 -translate-y-1/2"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={`flex flex-col items-center p-4 rounded-2xl bg-slate-900 border ${colorClasses.emerald.border} shadow-lg ${colorClasses.emerald.glow} backdrop-blur-sm transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl ${colorClasses.emerald.bg} flex items-center justify-center mb-2`}>
                  <FolderKanban size={24} className={colorClasses.emerald.text} />
                </div>
                <span className="text-xs font-medium text-slate-300">Listas</span>
                <span className="text-[10px] text-slate-500">12 activas</span>
              </motion.div>
            </motion.div>

            {/* Right node - Tareas */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className="absolute right-0 sm:right-12 top-1/2 -translate-y-1/2"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={`flex flex-col items-center p-4 rounded-2xl bg-slate-900 border ${colorClasses.cyan.border} shadow-lg ${colorClasses.cyan.glow} backdrop-blur-sm transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl ${colorClasses.cyan.bg} flex items-center justify-center mb-2`}>
                  <CheckCircle2 size={24} className={colorClasses.cyan.text} />
                </div>
                <span className="text-xs font-medium text-slate-300">Tareas</span>
                <span className="text-[10px] text-slate-500">156 total</span>
              </motion.div>
            </motion.div>

            {/* Bottom left - Recordatorios */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              className="absolute left-[12%] sm:left-[18%] bottom-0"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={`flex flex-col items-center p-4 rounded-2xl bg-slate-900 border ${colorClasses.amber.border} shadow-lg ${colorClasses.amber.glow} backdrop-blur-sm transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl ${colorClasses.amber.bg} flex items-center justify-center mb-2`}>
                  <Bell size={24} className={colorClasses.amber.text} />
                </div>
                <span className="text-xs font-medium text-slate-300">Recordatorios</span>
                <span className="text-[10px] text-slate-500">8 activos</span>
              </motion.div>
            </motion.div>

            {/* Bottom right - Vencimientos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              className="absolute right-[12%] sm:right-[18%] bottom-0"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                className={`flex flex-col items-center p-3 rounded-2xl bg-slate-900 border ${colorClasses.rose.border} shadow-lg ${colorClasses.rose.glow} backdrop-blur-sm transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl ${colorClasses.rose.bg} flex items-center justify-center mb-2`}>
                  <Clock size={24} className={colorClasses.rose.text} />
                </div>
                <span className="text-xs font-medium text-slate-300">Vencimientos</span>
                <span className="text-[10px] text-rose-400 font-medium">3 urgentes</span>
              </motion.div>
            </motion.div>

            {/* Center - Tasklyn Logo Hub */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="relative">
                {/* Pulsing rings */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 -m-8 rounded-3xl border-2 border-blue-500/30"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  className="absolute inset-0 -m-12 rounded-[2rem] border border-blue-500/20"
                />
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.3, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  className="absolute inset-0 -m-16 rounded-[2.5rem] border border-blue-500/10"
                />

                {/* Central hub card */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.5)] border border-blue-400/50"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                  
                  {/* Logo */}
                  <Logo size="lg" className="w-12 h-12 sm:w-14 sm:h-14 relative z-10" />
                  
                  {/* Zap icon indicator */}
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-lg"
                  >
                    <Zap size={12} className="text-amber-900" fill="currentColor" />
                  </motion.div>
                </motion.div>

                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center"
                >
                  <p className="text-lg font-bold text-slate-100 drop-shadow-lg">Tasklyn</p>
                  <p className="text-[10px] text-blue-400 font-medium">Hub Central</p>
                </motion.div>

                {/* Floating stats */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="absolute -left-24 top-1/2 -translate-y-1/2 hidden sm:block"
                >
                  <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-medium">●</span> Online
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Bottom stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {[
              { label: "Tareas completadas", value: "1,247", trend: "+12%" },
              { label: "Tiempo ahorrado", value: "48h", trend: "+8%" },
              { label: "Listas activas", value: "12", trend: "+3" },
              { label: "Colaboración", value: "98%", trend: "↑" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-lg font-semibold text-slate-100">{stat.value}</p>
                <p className="text-[10px] text-slate-500 mb-1">{stat.label}</p>
                <span className="text-[10px] text-emerald-400">{stat.trend}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
