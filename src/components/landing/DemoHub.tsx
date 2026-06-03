"use client";

import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Bell,
  Clock,
  Sparkles,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

const colorClasses: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
};

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
              <span className="text-xs font-medium text-blue-400">
                Todo conectado
              </span>
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

        {/* Hub visual */}
        <div className="relative max-w-2xl mx-auto">
          {/* SVG fiber-optic connection lines — drawn behind everything */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 560 440"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="fiberGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Base line color */}
              <style>{`
                .fiber-base { stroke: rgba(59,130,246,0.12); }
                .fiber-pulse { stroke: rgba(99,179,255,0); }
              `}</style>
            </defs>

            {/* Center = 280, 220 */}

            {/* Line to TOP node (280, 30) */}
            <line
              x1="280"
              y1="220"
              x2="280"
              y2="60"
              strokeWidth="1.5"
              className="fiber-base"
            />
            <line
              x1="280"
              y1="220"
              x2="280"
              y2="60"
              strokeWidth="1.5"
              stroke="rgba(99,179,255,0.9)"
              strokeLinecap="round"
              filter="url(#fiberGlow)"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,160;80,80;160,0"
                dur="2.4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-dashoffset"
                values="160;80;0"
                dur="2.4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                values="0;1;0"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </line>

            {/* Line to LEFT node (50, 220) */}
            <line
              x1="280"
              y1="220"
              x2="80"
              y2="220"
              strokeWidth="1.5"
              className="fiber-base"
            />
            <line
              x1="280"
              y1="220"
              x2="80"
              y2="220"
              strokeWidth="1.5"
              stroke="rgba(52,211,153,0.9)"
              strokeLinecap="round"
              filter="url(#fiberGlow)"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,200;100,100;200,0"
                dur="2.8s"
                repeatCount="indefinite"
                begin="0.5s"
              />
              <animate
                attributeName="stroke-dashoffset"
                values="200;100;0"
                dur="2.8s"
                repeatCount="indefinite"
                begin="0.5s"
              />
              <animate
                attributeName="stroke-opacity"
                values="0;1;0"
                dur="2.8s"
                repeatCount="indefinite"
                begin="0.5s"
              />
            </line>

            {/* Line to RIGHT node (510, 220) */}
            <line
              x1="280"
              y1="220"
              x2="480"
              y2="220"
              strokeWidth="1.5"
              className="fiber-base"
            />
            <line
              x1="280"
              y1="220"
              x2="480"
              y2="220"
              strokeWidth="1.5"
              stroke="rgba(34,211,238,0.9)"
              strokeLinecap="round"
              filter="url(#fiberGlow)"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,200;100,100;200,0"
                dur="3s"
                repeatCount="indefinite"
                begin="1s"
              />
              <animate
                attributeName="stroke-dashoffset"
                values="200;100;0"
                dur="3s"
                repeatCount="indefinite"
                begin="1s"
              />
              <animate
                attributeName="stroke-opacity"
                values="0;1;0"
                dur="3s"
                repeatCount="indefinite"
                begin="1s"
              />
            </line>

            {/* Line to BOTTOM-LEFT node (110, 390) */}
            <line
              x1="280"
              y1="220"
              x2="120"
              y2="390"
              strokeWidth="1.5"
              className="fiber-base"
            />
            <line
              x1="280"
              y1="220"
              x2="120"
              y2="390"
              strokeWidth="1.5"
              stroke="rgba(251,191,36,0.9)"
              strokeLinecap="round"
              filter="url(#fiberGlow)"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,240;120,120;240,0"
                dur="3.2s"
                repeatCount="indefinite"
                begin="0.8s"
              />
              <animate
                attributeName="stroke-dashoffset"
                values="240;120;0"
                dur="3.2s"
                repeatCount="indefinite"
                begin="0.8s"
              />
              <animate
                attributeName="stroke-opacity"
                values="0;1;0"
                dur="3.2s"
                repeatCount="indefinite"
                begin="0.8s"
              />
            </line>

            {/* Line to BOTTOM-RIGHT node (440, 390) */}
            <line
              x1="280"
              y1="220"
              x2="440"
              y2="390"
              strokeWidth="1.5"
              className="fiber-base"
            />
            <line
              x1="280"
              y1="220"
              x2="440"
              y2="390"
              strokeWidth="1.5"
              stroke="rgba(251,113,133,0.9)"
              strokeLinecap="round"
              filter="url(#fiberGlow)"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,240;120,120;240,0"
                dur="2.6s"
                repeatCount="indefinite"
                begin="1.4s"
              />
              <animate
                attributeName="stroke-dashoffset"
                values="240;120;0"
                dur="2.6s"
                repeatCount="indefinite"
                begin="1.4s"
              />
              <animate
                attributeName="stroke-opacity"
                values="0;1;0"
                dur="2.6s"
                repeatCount="indefinite"
                begin="1.4s"
              />
            </line>
          </svg>

          {/* Hub container */}
          <div className="relative h-[440px]">
            {/* ── Center logo ── */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 140 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="relative">
                {/* Subtle pulsing rings */}
                <motion.div
                  animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.45, 0.25] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 -m-6 rounded-[2rem] border border-blue-500/25"
                />
                <motion.div
                  animate={{ scale: [1, 1.32, 1], opacity: [0.12, 0.25, 0.12] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute inset-0 -m-12 rounded-[2.5rem] border border-blue-500/15"
                />

                {/* Logo card — clean, no blue circle background */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.3)]"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/8 via-transparent to-transparent" />
                  <Logo size="md" showText={false} className="relative z-10" />
                </motion.div>
              </div>
            </motion.div>

            {/* ── Top node: Equipo ── */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="absolute left-1/2 -translate-x-1/2 top-0"
            >
              <motion.div
                whileHover={{ scale: 1.07 }}
                className={`flex flex-col items-center p-4 rounded-2xl bg-slate-900 border ${colorClasses.blue.border} shadow-lg backdrop-blur-sm`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${colorClasses.blue.bg} flex items-center justify-center mb-2`}
                >
                  <Users size={22} className={colorClasses.blue.text} />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Equipo
                </span>
                <span className="text-[10px] text-slate-500">24 miembros</span>
              </motion.div>
            </motion.div>

            {/* ── Left node: Listas ── */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="absolute left-0 top-1/2 -translate-y-1/2"
            >
              <motion.div
                whileHover={{ scale: 1.07 }}
                className={`flex flex-col items-center p-4 rounded-2xl bg-slate-900 border ${colorClasses.emerald.border} shadow-lg backdrop-blur-sm`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${colorClasses.emerald.bg} flex items-center justify-center mb-2`}
                >
                  <FolderKanban
                    size={22}
                    className={colorClasses.emerald.text}
                  />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Listas
                </span>
                <span className="text-[10px] text-slate-500">12 activas</span>
              </motion.div>
            </motion.div>

            {/* ── Right node: Tareas ── */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className="absolute right-0 top-1/2 -translate-y-1/2"
            >
              <motion.div
                whileHover={{ scale: 1.07 }}
                className={`flex flex-col items-center p-4 rounded-2xl bg-slate-900 border ${colorClasses.cyan.border} shadow-lg backdrop-blur-sm`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${colorClasses.cyan.bg} flex items-center justify-center mb-2`}
                >
                  <CheckCircle2 size={22} className={colorClasses.cyan.text} />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Tareas
                </span>
                <span className="text-[10px] text-slate-500">156 total</span>
              </motion.div>
            </motion.div>

            {/* ── Bottom-left node: Recordatorios ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              className="absolute left-[5%] bottom-0"
            >
              <motion.div
                whileHover={{ scale: 1.07 }}
                className={`flex flex-col items-center p-4 rounded-2xl bg-slate-900 border ${colorClasses.amber.border} shadow-lg backdrop-blur-sm`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${colorClasses.amber.bg} flex items-center justify-center mb-2`}
                >
                  <Bell size={22} className={colorClasses.amber.text} />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Recordatorios
                </span>
                <span className="text-[10px] text-slate-500">8 activos</span>
              </motion.div>
            </motion.div>

            {/* ── Bottom-right node: Vencimientos ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              className="absolute right-[5%] bottom-0"
            >
              <motion.div
                whileHover={{ scale: 1.07 }}
                className={`flex flex-col items-center p-4 rounded-2xl bg-slate-900 border ${colorClasses.rose.border} shadow-lg backdrop-blur-sm`}
              >
                <div
                  className={`w-11 h-11 rounded-xl ${colorClasses.rose.bg} flex items-center justify-center mb-2`}
                >
                  <Clock size={22} className={colorClasses.rose.text} />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Vencimientos
                </span>
                <span className="text-[10px] text-rose-400 font-medium">
                  3 urgentes
                </span>
              </motion.div>
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
              <div
                key={i}
                className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800"
              >
                <p className="text-lg font-semibold text-slate-100">
                  {stat.value}
                </p>
                <p className="text-[10px] text-slate-500 mb-1">{stat.label}</p>
                <span className="text-[10px] text-emerald-400">
                  {stat.trend}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
