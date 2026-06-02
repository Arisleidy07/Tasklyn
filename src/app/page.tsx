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
  FolderKanban,
  Calendar,
  Share2,
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

          {/* Hero demo — Representación real de app en funcionamiento */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/70 bg-slate-900/80 p-4 sm:p-5 shadow-[0_30px_90px_rgba(15,23,42,0.95)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.16),transparent_30%)]" />
              <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(148,163,184,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.25)_1px,transparent_1px)] bg-[size:36px_36px]" />

              <div className="relative">
                {/* Header de app */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
                      <ListTodo size={18} className="text-white" />
                    </div>
                    <span className="font-semibold text-slate-100">
                      Tasklyn
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock size={12} />
                    <span>
                      {new Date().toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Grid principal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Panel Lista Principal */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center">
                          <ListTodo size={14} className="text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-slate-200">
                          Proyecto Alpha
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-slate-500" />
                        <span className="text-[10px] text-slate-400">4</span>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">Progreso</span>
                        <span className="text-blue-300">75%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "75%" }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Tareas */}
                    <div className="space-y-2">
                      {[
                        {
                          label: "Revisar diseño UI",
                          done: true,
                          time: "09:00",
                        },
                        {
                          label: "Aprobar presupuesto",
                          done: true,
                          time: "10:30",
                        },
                        {
                          label: "Reunión con cliente",
                          done: false,
                          time: "14:00",
                          urgent: true,
                        },
                        { label: "Enviar reporte", done: false, time: "16:00" },
                      ].map((task, index) => (
                        <motion.div
                          key={task.label}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className={`flex items-center gap-2 p-2 rounded-xl ${
                            task.done
                              ? "bg-slate-900/40"
                              : "bg-slate-800/60 border border-slate-700/50"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              task.done
                                ? "bg-blue-500"
                                : "border-2 border-slate-500"
                            }`}
                          >
                            {task.done && (
                              <CheckCircle2 size={10} className="text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-[11px] truncate ${
                                task.done
                                  ? "text-slate-500 line-through"
                                  : "text-slate-200"
                              }`}
                            >
                              {task.label}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {task.urgent && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            )}
                            <span
                              className={`text-[9px] ${task.urgent ? "text-amber-300" : "text-slate-500"}`}
                            >
                              {task.time}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Panel Listas y Compartidas */}
                  <div className="space-y-3">
                    {/* Mis Listas */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FolderKanban size={14} className="text-slate-400" />
                        <span className="text-[11px] font-medium text-slate-300">
                          Mis Listas
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          {
                            name: "Personal",
                            count: 8,
                            color: "bg-emerald-500",
                          },
                          { name: "Trabajo", count: 12, color: "bg-blue-500" },
                          { name: "Compras", count: 5, color: "bg-amber-500" },
                        ].map((list, i) => (
                          <div
                            key={list.name}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${list.color}`}
                              />
                              <span className="text-[11px] text-slate-300">
                                {list.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {list.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Compartidas */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Share2 size={14} className="text-slate-400" />
                          <span className="text-[11px] font-medium text-slate-300">
                            Compartidas
                          </span>
                        </div>
                        <div className="flex -space-x-1.5">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { name: "Marketing Q4", members: 5 },
                          { name: "Desarrollo App", members: 8 },
                        ].map((list) => (
                          <div
                            key={list.name}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/50"
                          >
                            <span className="text-[11px] text-slate-300">
                              {list.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <Users size={10} className="text-slate-500" />
                              <span className="text-[10px] text-slate-500">
                                {list.members}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Recordatorios Próximos */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-2xl border border-slate-700/60 bg-slate-950/70 p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Bell size={14} className="text-amber-400" />
                        <span className="text-[11px] font-medium text-slate-300">
                          Próximos
                        </span>
                      </div>
                      <div className="space-y-2">
                        {[
                          {
                            label: "Vence: Reporte mensual",
                            time: "Hoy 17:00",
                            urgent: true,
                          },
                          {
                            label: "Reunión equipo",
                            time: "Mañana 10:00",
                            urgent: false,
                          },
                        ].map((reminder, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div
                              className={`w-1 h-1 rounded-full mt-1.5 ${reminder.urgent ? "bg-red-400" : "bg-blue-400"}`}
                            />
                            <div className="flex-1">
                              <p className="text-[10px] text-slate-300">
                                {reminder.label}
                              </p>
                              <p
                                className={`text-[9px] ${reminder.urgent ? "text-red-400" : "text-slate-500"}`}
                              >
                                {reminder.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Barra inferior con estados */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-400">6 done</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] text-slate-400">
                        4 pending
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[10px] text-slate-400">
                        2 urgent
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Calendar size={12} />
                    <span>Actualizado ahora</span>
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

      {/* Demo 2 — Hub central Tasklyn con identidad real y conexiones tecnológicas */}
      <section className="py-16 sm:py-20 bg-slate-950 border-t border-slate-800/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">
              Todo conectado en un flujo visual
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Las funciones de Tasklyn se interconectan para mantener a tu equipo sincronizado sin fricción.
            </p>
          </div>

          {/* Hub visual central */}
          <div className="relative">
            {/* Líneas de conexión con flujo de energía */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-full absolute" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
                <defs>
                  {/* Gradiente de flujo azul */}
                  <linearGradient id="flowBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(59,130,246,0)">
                      <animate attributeName="offset" values="-0.5;1.5" dur="3s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="50%" stopColor="rgba(59,130,246,0.8)">
                      <animate attributeName="offset" values="-0.5;1.5" dur="3s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="rgba(59,130,246,0)">
                      <animate attributeName="offset" values="-0.5;1.5" dur="3s" repeatCount="indefinite" />
                    </stop>
                  </linearGradient>
                  
                  {/* Gradiente de flujo cian */}
                  <linearGradient id="flowCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(6,182,212,0)">
                      <animate attributeName="offset" values="-0.5;1.5" dur="2.5s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="50%" stopColor="rgba(6,182,212,0.7)">
                      <animate attributeName="offset" values="-0.5;1.5" dur="2.5s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="rgba(6,182,212,0)">
                      <animate attributeName="offset" values="-0.5;1.5" dur="2.5s" repeatCount="indefinite" />
                    </stop>
                  </linearGradient>
                </defs>
                
                {/* Líneas horizontales con flujo */}
                <line x1="100" y1="200" x2="350" y2="200" stroke="url(#flowBlue)" strokeWidth="2" />
                <line x1="450" y1="200" x2="700" y2="200" stroke="url(#flowBlue)" strokeWidth="2" />
                
                {/* Líneas verticales con flujo */}
                <line x1="400" y1="50" x2="400" y2="150" stroke="url(#flowCyan)" strokeWidth="2" />
                <line x1="400" y1="250" x2="400" y2="350" stroke="url(#flowCyan)" strokeWidth="2" />
                
                {/* Líneas diagonales sutiles */}
                <line x1="120" y1="80" x2="350" y2="170" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                <line x1="680" y1="80" x2="450" y2="170" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                <line x1="120" y1="320" x2="350" y2="230" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                <line x1="680" y1="320" x2="450" y2="230" stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
              </svg>
            </div>

            {/* Nodos de funciones distribuidos */}
            <div className="relative h-[420px] sm:h-[380px]">
              {/* Nodo superior — Equipo */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="absolute left-1/2 -translate-x-1/2 top-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shadow-slate-900/50">
                    <Users size={24} className="text-blue-400" />
                  </div>
                  <span className="mt-2 text-xs font-medium text-slate-400">Equipo</span>
                </div>
              </motion.div>

              {/* Nodo izquierdo — Listas */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="absolute left-0 sm:left-8 top-1/2 -translate-y-1/2"
              >
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shadow-slate-900/50">
                    <FolderKanban size={24} className="text-emerald-400" />
                  </div>
                  <span className="mt-2 text-xs font-medium text-slate-400">Listas</span>
                </div>
              </motion.div>

              {/* Nodo derecho — Tareas */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute right-0 sm:right-8 top-1/2 -translate-y-1/2"
              >
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shadow-slate-900/50">
                    <CheckCircle2 size={24} className="text-cyan-400" />
                  </div>
                  <span className="mt-2 text-xs font-medium text-slate-400">Tareas</span>
                </div>
              </motion.div>

              {/* Nodo inferior izquierdo — Recordatorios */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute left-[15%] sm:left-[20%] bottom-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shadow-slate-900/50">
                    <Bell size={24} className="text-amber-400" />
                  </div>
                  <span className="mt-2 text-xs font-medium text-slate-400">Recordatorios</span>
                </div>
              </motion.div>

              {/* Nodo inferior derecho — Vencimientos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute right-[15%] sm:right-[20%] bottom-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shadow-slate-900/50">
                    <Clock size={24} className="text-rose-400" />
                  </div>
                  <span className="mt-2 text-xs font-medium text-slate-400">Vencimientos</span>
                </div>
              </motion.div>

              {/* Centro — Logo Tasklyn con identidad real */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="relative">
                  {/* Anillos pulsantes */}
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 -m-6 rounded-[2rem] border border-blue-400/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute inset-0 -m-10 rounded-[2.5rem] border border-blue-400/10"
                  />
                  
                  {/* Logo principal */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.4)] border border-blue-400/30">
                    <ListTodo size={36} className="text-white" strokeWidth={2} />
                  </div>
                  
                  {/* Nombre debajo */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                    <p className="text-base font-bold text-slate-100">Tasklyn</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Leyenda de funciones */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: FolderKanban, label: "Organiza por listas", color: "text-emerald-400" },
              { icon: CheckCircle2, label: "Gestiona tareas", color: "text-cyan-400" },
              { icon: Users, label: "Colabora en equipo", color: "text-blue-400" },
              { icon: Bell, label: "Recibe recordatorios", color: "text-amber-400" },
              { icon: Clock, label: "Controla vencimientos", color: "text-rose-400" },
              { icon: Share2, label: "Comparte listas", color: "text-slate-400" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-2 text-xs text-slate-400"
              >
                <item.icon size={14} className={item.color} />
                <span>{item.label}</span>
              </motion.div>
            ))}
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
