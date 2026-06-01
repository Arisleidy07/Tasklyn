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

          {/* Hero mockup — demo realista del dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="relative"
          >
            {/* Preview - Mockup realista del dashboard de Tasklyn */}
            <div className="bg-slate-950/90 rounded-3xl border border-slate-700/70 p-4 shadow-[0_26px_80px_rgba(15,23,42,0.95)]">
              <div className="bg-slate-950 rounded-2xl overflow-hidden flex min-h-[260px] sm:min-h-[320px] lg:min-h-[360px]">
                {/* Sidebar simulando navegación real */}
                <div className="w-56 bg-slate-950 border-r border-slate-800 p-4 hidden sm:flex flex-col">
                  <div className="flex items-center gap-2 mb-5">
                    <Logo size="sm" showText={false} />
                    <span className="font-semibold text-slate-50 text-sm">
                      Tasklyn
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="px-3 py-2 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-between shadow-sm">
                      <span>Dashboard</span>
                      <span className="text-[10px] bg-blue-500/40 px-1.5 py-0.5 rounded-md">
                        Hoy
                      </span>
                    </div>
                    <div className="px-3 py-2 rounded-lg flex items-center justify-between text-slate-200/90 hover:bg-slate-900/60 cursor-default">
                      <span>Mis listas</span>
                      <span className="text-[10px] text-slate-400">8</span>
                    </div>
                    <div className="px-3 py-2 rounded-lg flex items-center justify-between text-slate-200/90 hover:bg-slate-900/60 cursor-default">
                      <span>Compartidas</span>
                      <span className="text-[10px] text-slate-400">5</span>
                    </div>
                    <div className="px-3 py-2 rounded-lg flex items-center justify-between text-slate-400 hover:bg-slate-900/60 cursor-default">
                      <span>Archivadas</span>
                      <span className="text-[10px] text-slate-500">2</span>
                    </div>
                  </div>
                </div>

                {/* Main dashboard mock */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3">
                  {/* Top row: título + métricas y notificaciones */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
                        Panel de equipo
                      </p>
                      <h3 className="font-semibold text-slate-50 text-sm sm:text-base">
                        Implementación clientes · Q2
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/70">
                        <Clock size={10} />
                        <span>Hoy · 14 tareas</span>
                      </div>
                      <div className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-slate-200">
                        <Bell size={14} />
                        <span className="absolute -top-1 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-semibold flex items-center justify-center text-white">
                          3
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: métricas rápidas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <div className="rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2">
                      <p className="text-slate-400 mb-1">Pendientes hoy</p>
                      <p className="text-lg font-semibold text-slate-50 leading-none">
                        14
                      </p>
                      <p className="text-[10px] text-emerald-400 mt-0.5">
                        +5 vs ayer
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2">
                      <p className="text-slate-400 mb-1">Completadas</p>
                      <p className="text-lg font-semibold text-emerald-400 leading-none">
                        11
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        78% del día
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2">
                      <p className="text-slate-400 mb-1">Miembros activos</p>
                      <p className="text-lg font-semibold text-slate-50 leading-none">
                        6
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        3 editores · 3 viewers
                      </p>
                    </div>
                  </div>

                  {/* Bottom: lista de tareas y miembros */}
                  <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0">
                    {/* Tareas simuladas */}
                    <div className="flex-1 rounded-xl bg-slate-900/90 border border-slate-700/80 p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-200">
                          Tareas del día
                        </p>
                        <span className="text-[10px] text-slate-400">
                          6 de 14 completadas
                        </span>
                      </div>
                      {[
                        {
                          label: "Llamar a cliente principal",
                          status: "En curso",
                          badge: "Vence hoy",
                        },
                        {
                          label: "Configurar acceso del equipo",
                          status: "Completada",
                          badge: "Hecho",
                        },
                        {
                          label: "Programar recordatorios",
                          status: "Pendiente",
                          badge: "Mañana",
                        },
                      ].map((task, idx) => (
                        <div
                          key={task.label}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80"
                        >
                          <div className="w-4 h-4 rounded-full border-2 border-blue-500/80 flex items-center justify-center flex-shrink-0">
                            {task.status === "Completada" && (
                              <CheckCircle2
                                size={11}
                                className="text-blue-400"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-slate-100 truncate">
                              {task.label}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {task.status}
                            </p>
                          </div>
                          <span
                            className={
                              idx === 0
                                ? "text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300"
                                : idx === 1
                                  ? "text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300"
                                  : "text-[10px] px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-200"
                            }
                          >
                            {task.badge}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Miembros y listas */}
                    <div className="w-full md:w-44 rounded-xl bg-slate-900/90 border border-slate-700/80 p-3 flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-200 mb-1">
                          Miembros
                        </p>
                        <div className="flex -space-x-2 mb-1">
                          {[0, 1, 2, 3].map((idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center"
                              style={{ zIndex: 10 - idx }}
                            >
                              <span className="w-3 h-3 rounded-full bg-slate-500" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Owners, editores y viewers.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200 mb-1">
                          Listas activas
                        </p>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          <li className="flex items-center justify-between">
                            <span>Clientes clave</span>
                            <span className="text-slate-500">8</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span>Operaciones</span>
                            <span className="text-slate-500">5</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span>Backlog</span>
                            <span className="text-slate-500">12</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
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

      {/* Capturas / Mockups — demo clara del panel */}
      <section className="py-16 sm:py-20 bg-slate-950/95 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">
                Un panel que refleja tu día a día
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                Así se ve el panel principal cuando entras a Tasklyn: las mismas
                listas, tareas, miembros y notificaciones que verás dentro de la
                aplicación real.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5 lg:gap-6">
            {/* Mockup dashboard completo */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col gap-3 shadow-[0_22px_60px_rgba(15,23,42,0.85)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Logo size="sm" textClassName="text-slate-50" />
                  <span className="text-xs text-slate-400">
                    Dashboard de Tasklyn
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
                  Equipo en tiempo real
                </span>
              </div>

              {/* Fila de métricas */}
              <div className="grid grid-cols-4 gap-3 text-[11px] mb-3">
                <div className="rounded-2xl bg-slate-950/90 border border-slate-800 px-3 py-2">
                  <p className="text-slate-400 mb-1">Tareas hoy</p>
                  <p className="text-xl font-semibold text-slate-50 leading-none">
                    18
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    +6 vs ayer
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/90 border border-slate-800 px-3 py-2">
                  <p className="text-slate-400 mb-1">Completadas</p>
                  <p className="text-xl font-semibold text-emerald-400 leading-none">
                    13
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    72% avance
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/90 border border-slate-800 px-3 py-2">
                  <p className="text-slate-400 mb-1">Listas activas</p>
                  <p className="text-xl font-semibold text-slate-50 leading-none">
                    9
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    por cliente / área
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/90 border border-slate-800 px-3 py-2">
                  <p className="text-slate-400 mb-1">Miembros</p>
                  <p className="text-xl font-semibold text-slate-50 leading-none">
                    24
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    owners y editores
                  </p>
                </div>
              </div>

              {/* Zona principal: listas y tareas */}
              <div className="flex-1 grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] gap-3 min-h-[180px]">
                {/* Columna de listas */}
                <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-200">
                      Listas
                    </p>
                    <span className="text-[10px] text-slate-500">
                      9 activas
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/40">
                      <span className="text-slate-50">Clientes VIP</span>
                      <span className="text-slate-300">12</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-200">
                        Operaciones diarias
                      </span>
                      <span className="text-slate-400">8</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-200">Soporte</span>
                      <span className="text-slate-400">5</span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Backlog</span>
                      <span className="text-slate-500">21</span>
                    </div>
                  </div>
                </div>

                {/* Columna de tareas */}
                <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-200">
                      Tareas en "Clientes VIP"
                    </p>
                    <span className="text-[10px] text-slate-500">
                      Vista de hoy
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={9} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-50 truncate">
                          Enviar propuesta final
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Asignada a un miembro del equipo · Vence hoy
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
                        Completada
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-50 truncate">
                          Reunión con cliente A
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Hoy · 16:00 · 2 recordatorios
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300">
                        Próxima
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-50 truncate">
                          Actualizar datos de contacto
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Sin vencimiento · 3 comentarios
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        En curso
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel lateral: actividad y notificaciones */}
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-1">
                  Actividad reciente
                </p>
                <ul className="space-y-2 text-[11px] text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div>
                      <p>Se completó la tarea "Enviar propuesta final"</p>
                      <p className="text-slate-500 text-[10px]">
                        Hace 12 min · Lista Clientes VIP
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <div>
                      <p>
                        Se añadió un miembro a la lista "Operaciones diarias"
                      </p>
                      <p className="text-slate-500 text-[10px]">Hace 35 min</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <div>
                      <p>3 tareas vencen en las próximas 24 horas</p>
                      <p className="text-slate-500 text-[10px]">
                        Notificaciones activas en todos los dispositivos
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2">
                    Perfil
                  </p>
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/80 flex items-center justify-center">
                      <Users size={16} className="text-white" />
                    </div>
                    <div className="text-[11px]">
                      <p className="text-slate-50">Miembro del equipo</p>
                      <p className="text-slate-400">Owner · Plan Free</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2">
                    Notificaciones
                  </p>
                  <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 text-[11px] text-slate-300 space-y-1.5">
                    <p className="flex items-center justify-between">
                      <span>Invitaciones</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[10px]">
                        2
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Vencimientos</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px]">
                        3 hoy
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Actividad</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px]">
                        OK
                      </span>
                    </p>
                  </div>
                </div>
              </div>
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
              <Logo size="sm" />
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
