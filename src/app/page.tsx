"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Logo from "@/components/shared/Logo";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  ListTodo,
  Users,
  Shield,
  Zap,
  Clock,
  Bell,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user, login, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated || user) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const scrollToId = (id: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollToId("hero")}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <Logo size="md" showText={false} />
              <span className="text-lg font-semibold tracking-tight text-slate-50 group-hover:text-white">
                Tasklyn
              </span>
            </button>
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
              <button
                type="button"
                onClick={() => scrollToId("hero")}
                className="hover:text-white transition-colors"
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={() => scrollToId("features")}
                className="hover:text-white transition-colors"
              >
                Características
              </button>
              <button
                type="button"
                onClick={() => scrollToId("productivity")}
                className="hover:text-white transition-colors"
              >
                Productividad
              </button>
              <button
                type="button"
                onClick={() => scrollToId("pricing")}
                className="hover:text-white transition-colors"
              >
                Precios
              </button>
              <button
                type="button"
                onClick={() => scrollToId("contact")}
                className="hover:text-white transition-colors"
              >
                Contacto
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={login}
              isLoading={isLoading}
              size="sm"
              icon={<ArrowRight size={16} />}
              className="bg-blue-600 hover:bg-blue-500 text-white border-none"
            >
              Iniciar sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="hero"
        className="relative pt-28 sm:pt-32 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden"
      >
        {/* Premium background — dark mesh gradient for strong contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />

        {/* Floating blue circles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="animate-glow-drift absolute top-[-10%] right-[-10%] w-[520px] h-[520px] rounded-full bg-blue-500/20 blur-[120px]" />
          <div className="animate-glow-drift-2 absolute bottom-[-10%] left-[-10%] w-[480px] h-[480px] rounded-full bg-indigo-500/15 blur-[110px]" />
          {/* Small floating orbs */}
          <div className="animate-float-slow absolute top-[18%] left-[12%] w-4 h-4 rounded-full bg-blue-400/40" />
          <div className="animate-float-slow-reverse absolute top-[40%] right-[18%] w-3 h-3 rounded-full bg-blue-300/40" />
          <div className="animate-float-gentle absolute bottom-[25%] left-[45%] w-2.5 h-2.5 rounded-full bg-indigo-300/50" />
        </div>

        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo grande */}
            <div className="flex items-center gap-3 mb-6">
              <Logo size="lg" textClassName="text-slate-50" />
            </div>

            <h1 className="text-3.5xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-5 leading-tight">
              <span className="text-slate-50">Organiza tu trabajo</span>
              <br className="hidden sm:block" />
              <span className="text-blue-400">y colabora en tiempo real.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 mb-7 max-w-xl">
              Tasklyn centraliza listas, tareas, miembros y notificaciones en un
              panel moderno, para que tu equipo se mantenga alineado desde
              cualquier dispositivo.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-5">
              <Button
                onClick={login}
                isLoading={isLoading}
                size="lg"
                icon={<ArrowRight size={18} />}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_20px_60px_rgba(37,99,235,0.55)] hover:shadow-[0_20px_70px_rgba(37,99,235,0.7)] transition-shadow"
              >
                Comenzar gratis
              </Button>
            </div>
          </motion.div>

          {/* Hero demo — composición premium de productividad */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-slate-900/70 p-4 sm:p-5 shadow-[0_30px_90px_rgba(15,23,42,0.95)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.16),transparent_30%)]" />
              <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(148,163,184,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.25)_1px,transparent_1px)] bg-[size:36px_36px]" />

              <div className="relative grid gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-blue-300 font-semibold">
                      Tasklyn Flow
                    </p>
                    <h3 className="mt-1 text-lg sm:text-xl font-semibold text-slate-50">
                      Listas, tareas y equipo alineados
                    </h3>
                  </div>
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="hidden sm:flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-100"
                  >
                    <Bell size={13} />
                    Recordatorio activo
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_1.2fr] gap-4">
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="rounded-3xl border border-slate-700/70 bg-slate-950/70 p-4"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center text-blue-300">
                          <ListTodo size={17} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-50">
                            Operaciones
                          </p>
                          <p className="text-[11px] text-slate-400">
                            6/10 completadas
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-300">
                        60%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-5">
                      <motion.div
                        initial={{ width: "18%" }}
                        animate={{ width: "60%" }}
                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400"
                      />
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Entrega semanal", done: true },
                        { label: "Seguimiento cliente", done: true },
                        { label: "Revisión interna", done: false },
                      ].map((task, index) => (
                        <motion.div
                          key={task.label}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + index * 0.14 }}
                          className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3"
                        >
                          <motion.span
                            initial={{ scale: 0.8 }}
                            animate={{ scale: task.done ? [0.8, 1.15, 1] : 1 }}
                            transition={{ delay: 0.55 + index * 0.12 }}
                            className={
                              task.done
                                ? "flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white"
                                : "h-5 w-5 rounded-full border-2 border-slate-600"
                            }
                          >
                            {task.done && <CheckCircle2 size={13} />}
                          </motion.span>
                          <span
                            className={
                              task.done
                                ? "text-sm text-slate-400 line-through"
                                : "text-sm text-slate-100"
                            }
                          >
                            {task.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <div className="grid gap-4">
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="rounded-3xl border border-slate-700/70 bg-slate-950/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-50">
                            Tarea próxima
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Vencimiento y aviso sincronizados
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-300/20 flex items-center justify-center text-amber-300">
                          <Clock size={18} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] text-blue-200">
                          Hoy
                        </span>
                        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[11px] text-amber-200">
                          Recordatorio
                        </span>
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-200">
                          Recurrente
                        </span>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -4 }}
                      className="rounded-3xl border border-slate-700/70 bg-slate-950/70 p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-slate-50">
                          Colaboración
                        </p>
                        <Users size={17} className="text-blue-300" />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex -space-x-2">
                          {[0, 1, 2, 3].map((idx) => (
                            <motion.span
                              key={idx}
                              animate={{ y: [0, idx % 2 === 0 ? -4 : 4, 0] }}
                              transition={{
                                duration: 4 + idx,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="w-8 h-8 rounded-full border border-slate-700 bg-gradient-to-br from-slate-700 to-slate-900"
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">
                          roles claros
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Listas", icon: ListTodo },
                    { label: "Avisos", icon: Bell },
                    { label: "Equipo", icon: Users },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        duration: 4.5 + index,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-3 py-3 text-center"
                    >
                      <item.icon
                        size={16}
                        className="mx-auto mb-1 text-blue-300"
                      />
                      <p className="text-[11px] text-slate-300">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features - Grid simple */}
      <section
        id="features"
        className="py-16 sm:py-20 bg-slate-950 border-t border-slate-800/70"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-3">
              Pensado para equipos modernos
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Todo lo que necesitas para coordinar tareas, compartir contexto y
              mantener a tu equipo sincronizado, en una sola plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <ListTodo size={22} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50 mb-1">
                  Listas compartidas
                </h3>
                <p className="text-slate-400 text-sm">
                  Crea listas personales y compartidas para mantener a tu equipo
                  organizado y con las tareas claras.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <Users size={22} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50 mb-1">
                  Trabajo en equipo
                </h3>
                <p className="text-slate-400 text-sm">
                  Invita miembros, define roles de owner, editor o viewer y
                  colabora en tiempo real sin perder contexto ni tareas.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <Clock size={22} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50 mb-1">
                  Recordatorios inteligentes
                </h3>
                <p className="text-slate-400 text-sm">
                  Configura vencimientos y repeticiones para que Tasklyn te
                  avise a tiempo cuando una tarea se aproxima o se retrasa.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <Shield size={22} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50 mb-1">
                  Gestión de miembros
                </h3>
                <p className="text-slate-400 text-sm">
                  Controla quién puede ver, editar, archivar o eliminar tareas y
                  comparte listas de forma segura.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <Zap size={22} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50 mb-1">
                  Notificaciones en tiempo real
                </h3>
                <p className="text-slate-400 text-sm">
                  Avisos dentro de Tasklyn y notificaciones push con sonido
                  cuando se crean, completan o actualizan tareas clave.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo visual — funciones conectadas */}
      <section className="py-16 sm:py-20 bg-slate-950/95 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">
                Todo conectado, sin perder el ritmo
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                Tasklyn une listas, tareas, recordatorios y colaboración en un
                flujo visual claro para que el trabajo avance sin fricción.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/70 p-4 sm:p-6 md:p-8 shadow-[0_22px_60px_rgba(15,23,42,0.85)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_85%_70%,rgba(16,185,129,0.1),transparent_28%)]" />
            <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(148,163,184,0.26)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.26)_1px,transparent_1px)] bg-[size:42px_42px]" />

            <div className="relative min-h-[560px] sm:min-h-[500px] lg:min-h-[460px]">
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute left-1/2 top-1/2 z-10 w-36 sm:w-44 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-blue-400/25 bg-blue-500/15 p-4 text-center shadow-[0_0_70px_rgba(37,99,235,0.35)] backdrop-blur-xl"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/30">
                  <ListTodo size={22} />
                </div>
                <p className="text-sm font-semibold text-slate-50">Tasklyn</p>
                <p className="mt-1 text-[11px] text-blue-100">
                  centro de trabajo
                </p>
              </motion.div>

              <div className="absolute left-1/2 top-1/2 hidden h-px w-[74%] -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent sm:block" />
              <div className="absolute left-1/2 top-1/2 hidden h-[72%] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent sm:block" />
              <div className="absolute left-[18%] top-[24%] hidden h-px w-[64%] -rotate-12 bg-gradient-to-r from-transparent via-slate-500/25 to-transparent sm:block" />
              <div className="absolute left-[18%] bottom-[26%] hidden h-px w-[64%] rotate-12 bg-gradient-to-r from-transparent via-slate-500/25 to-transparent sm:block" />

              {[
                {
                  label: "Listas",
                  detail: "orden por contexto",
                  icon: ListTodo,
                  position: "left-0 top-8 sm:left-4 sm:top-16",
                  color: "blue",
                },
                {
                  label: "Tareas",
                  detail: "avance visible",
                  icon: CheckCircle2,
                  position: "right-0 top-24 sm:right-8 sm:top-12",
                  color: "emerald",
                },
                {
                  label: "Recordatorios",
                  detail: "avisos puntuales",
                  icon: Bell,
                  position: "left-2 bottom-28 sm:left-12 sm:bottom-16",
                  color: "amber",
                },
                {
                  label: "Vencimientos",
                  detail: "fechas claras",
                  icon: Clock,
                  position: "right-4 bottom-20 sm:right-16 sm:bottom-12",
                  color: "indigo",
                },
                {
                  label: "Equipo",
                  detail: "colaboración real",
                  icon: Users,
                  position: "left-1/2 top-0 -translate-x-1/2 sm:top-4",
                  color: "slate",
                },
              ].map((node, index) => (
                <motion.div
                  key={node.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  animate={{ y: [0, index % 2 === 0 ? -8 : 8, 0] }}
                  transition={{
                    opacity: { duration: 0.45, delay: index * 0.08 },
                    y: {
                      duration: 5 + index * 0.45,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                  whileHover={{ scale: 1.04 }}
                  className={`absolute ${node.position} w-[min(82vw,220px)] rounded-3xl border border-slate-700/70 bg-slate-950/80 p-4 shadow-2xl backdrop-blur-xl`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        node.color === "emerald"
                          ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
                          : node.color === "amber"
                            ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-300"
                            : node.color === "indigo"
                              ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-300"
                              : node.color === "slate"
                                ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-500/30 bg-slate-800 text-slate-200"
                                : "flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-500/10 text-blue-300"
                      }
                    >
                      <node.icon size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-50">
                        {node.label}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {node.detail}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div
                animate={{ x: ["-8%", "108%"] }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 top-1/2 hidden h-px w-24 bg-gradient-to-r from-transparent via-blue-300/70 to-transparent sm:block"
              />
              <motion.div
                animate={{ y: ["110%", "-20%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute left-1/2 top-0 hidden h-24 w-px bg-gradient-to-b from-transparent via-emerald-300/60 to-transparent sm:block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sección de productividad */}
      <section
        id="productivity"
        className="py-16 sm:py-20 bg-slate-950 border-t border-slate-800/70"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-4">
              Ahorra tiempo y gana visibilidad real
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mb-6">
              Tasklyn está diseñado para operación diaria: empresas de
              servicios, equipos de campo, agencias y cualquier negocio que viva
              de cumplir tareas a tiempo.
            </p>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-medium">Ahorro de tiempo</p>
                  <p className="text-slate-400 text-sm">
                    Centraliza la comunicación y reduce llamadas y mensajes
                    dispersos. Cada tarea tiene dueño, vencimiento y contexto.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium">Trabajo colaborativo</p>
                  <p className="text-slate-400 text-sm">
                    Equipos completos conectados al mismo tablero, con roles y
                    permisos claros para evitar errores.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <div>
                  <p className="font-medium">Organización empresarial</p>
                  <p className="text-slate-400 text-sm">
                    Gestiona múltiples listas por cliente, proyecto o área y
                    mantén trazabilidad con historial de actividad.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <div>
                  <p className="font-medium">Control de tareas</p>
                  <p className="text-slate-400 text-sm">
                    Vencimientos, archivados visibles y métricas de completado
                    para que nada se pierda.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-3">
                Panel de productividad
              </p>
              <p className="text-sm text-slate-300 mb-4">
                Visualiza cuántas tareas tienes pendientes, cuántas completa tu
                equipo cada día y qué listas concentran más carga.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3">
                <p className="text-xs text-slate-400 mb-1">Tareas de hoy</p>
                <p className="text-2xl font-semibold text-slate-50">14</p>
              </div>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3">
                <p className="text-xs text-slate-400 mb-1">Completadas</p>
                <p className="text-2xl font-semibold text-emerald-400">11</p>
              </div>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3">
                <p className="text-xs text-slate-400 mb-1">Listas activas</p>
                <p className="text-2xl font-semibold text-slate-50">8</p>
              </div>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3">
                <p className="text-xs text-slate-400 mb-1">Miembros</p>
                <p className="text-2xl font-semibold text-slate-50">24</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precios */}
      <section
        id="pricing"
        className="py-16 sm:py-20 bg-slate-950/95 border-t border-slate-800/70"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-3">
            Precios sencillos para empezar rápido
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mb-10 max-w-2xl mx-auto">
            Empieza con el plan gratuito y evoluciona al plan PRO cuando tu
            equipo lo necesite. Sin sorpresas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col items-start">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 mb-3">
                Actual
              </span>
              <h3 className="text-lg font-semibold text-slate-50 mb-1">Free</h3>
              <p className="text-sm text-slate-400 mb-4 text-left">
                Ideal para uso personal o pequeños equipos que quieren probar
                Tasklyn sin fricción.
              </p>
              <p className="text-3xl font-semibold text-slate-50 mb-1">$0</p>
              <p className="text-xs text-slate-500 mb-5">para siempre</p>
              <ul className="text-left space-y-1.5 text-sm text-slate-300 mb-5">
                <li>· Hasta 5 listas activas</li>
                <li>· Hasta 20 tareas por lista</li>
                <li>· Hasta 3 miembros por lista</li>
                <li>· Notificaciones básicas</li>
              </ul>
              <Button
                onClick={login}
                isLoading={isLoading}
                size="sm"
                className="mt-auto bg-blue-600 hover:bg-blue-500 text-white border-none w-full"
              >
                Crear cuenta gratis
              </Button>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col items-start opacity-70">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 mb-3">
                Próximamente
              </span>
              <h3 className="text-lg font-semibold text-slate-200 mb-1">PRO</h3>
              <p className="text-sm text-slate-400 mb-4 text-left">
                Pensado para equipos que necesitan listas, tareas y miembros
                ilimitados con automatizaciones avanzadas.
              </p>
              <p className="text-3xl font-semibold text-slate-200 mb-1">$ —</p>
              <p className="text-xs text-slate-500 mb-5">detalles muy pronto</p>
              <ul className="text-left space-y-1.5 text-sm text-slate-400 mb-5">
                <li>· Listas y tareas ilimitadas</li>
                <li>· Miembros ilimitados por lista</li>
                <li>· Automatizaciones y plantillas</li>
                <li>· Soporte prioritario</li>
              </ul>
              <button
                type="button"
                className="mt-auto w-full h-10 rounded-xl border border-slate-700 text-slate-400 text-sm cursor-default"
              >
                Próximamente
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden border-t border-slate-800/70 bg-slate-950">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="animate-glow-drift absolute top-[10%] right-[15%] w-64 h-64 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="animate-glow-drift-2 absolute bottom-[5%] left-[10%] w-80 h-80 rounded-full bg-blue-400/25 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-slate-50 mb-4">
              Organiza el trabajo de tu equipo en Tasklyn
            </h2>
            <p className="text-slate-300 mb-8 text-sm sm:text-base">
              Crea tu espacio, invita a tu equipo y organiza tu trabajo desde un
              solo lugar.
            </p>
            <Button
              onClick={login}
              isLoading={isLoading}
              size="lg"
              icon={<ArrowRight size={18} />}
              className="bg-blue-600 hover:bg-blue-500 text-white border-none"
            >
              Crear cuenta gratis
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Contacto */}
      <section
        id="contact"
        className="py-12 sm:py-14 bg-slate-950 border-t border-slate-900/80"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-2">
              ¿Quieres usar Tasklyn en tu empresa?
            </h3>
            <p className="text-sm text-slate-400 max-w-xl">
              Escríbenos y te ayudamos a implementar Tasklyn con tu equipo y tus
              procesos actuales.
            </p>
          </div>
          <a
            href="mailto:tasklyn.oficial@gmail.com"
            className="inline-flex items-center justify-center px-5 h-11 rounded-xl border border-slate-700 text-sm font-medium text-slate-100 hover:bg-slate-900/80 hover:text-white transition-colors"
          >
            tasklyn.oficial@gmail.com
          </a>
        </div>
      </section>

      {/* Footer simple */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Logo size="sm" showText={false} />
              <span className="text-slate-200 font-semibold text-sm">
                Tasklyn
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs">
              Plataforma de gestión de tareas colaborativa para equipos que
              quieren tener sus listas, miembros y notificaciones en un solo
              lugar.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Contacto
            </p>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a
                  href="mailto:tasklyn.oficial@gmail.com"
                  className="hover:text-white transition-colors"
                >
                  tasklyn.oficial@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Tasklyn. Todos los derechos reservados.
          </p>
          <p>
            Diseñado para equipos que necesitan una vista clara de su trabajo.
          </p>
        </div>
      </footer>
    </div>
  );
}
