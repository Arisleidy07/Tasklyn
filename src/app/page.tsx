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

          {/* Hero mockup — vista fiel del dashboard real */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-[2rem] border border-slate-700/70 bg-slate-900/80 p-2 sm:p-3 shadow-[0_30px_90px_rgba(15,23,42,0.95)]">
              <div className="overflow-hidden rounded-[1.5rem] bg-gray-50 text-gray-900 min-h-[520px] sm:min-h-[560px] lg:min-h-[610px] flex">
                <aside className="hidden md:flex w-[212px] flex-col border-r border-gray-200 bg-gray-50">
                  <div className="h-16 flex items-center px-4 border-b border-gray-200 bg-white">
                    <Logo size="md" />
                  </div>
                  <nav className="flex-1 px-3 py-4 space-y-6">
                    <div className="space-y-1">
                      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        General
                      </p>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                        <ListTodo size={18} />
                        <span>Panel de control</span>
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600">
                        <Bell size={18} />
                        <span>Notificaciones</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Workspace
                      </p>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-white shadow-sm">
                        <Users size={18} />
                        <span>Listas</span>
                      </div>
                    </div>
                  </nav>
                </aside>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl">
                    <div className="flex items-center gap-2 px-3 md:px-6 py-3 md:py-5 min-h-[60px] md:min-h-[72px]">
                      <button className="md:hidden p-2 rounded-xl text-gray-500 bg-gray-100 min-w-[40px] min-h-[40px] flex items-center justify-center">
                        <ListTodo size={20} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate tracking-tight">
                          Panel de control
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 truncate mt-0.5">
                          Vista principal de Tasklyn
                        </p>
                      </div>
                      <button className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-sm">
                        <span className="hidden sm:inline">Nueva lista</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {[
                        { label: "Listas totales", value: "5", icon: ListTodo },
                        { label: "Compartidas", value: "2", icon: Users },
                        {
                          label: "Completadas",
                          value: "7",
                          icon: CheckCircle2,
                        },
                        { label: "Pendientes", value: "9", icon: Clock },
                      ].map((item, idx) => (
                        <div
                          key={item.label}
                          className="relative p-4 rounded-2xl border border-gray-200/80 bg-white overflow-hidden"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div
                              className={
                                idx % 2 === 0
                                  ? "w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/25"
                                  : "w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 shadow-sm shadow-gray-500/20"
                              }
                            >
                              <item.icon size={18} className="text-white" />
                            </div>
                          </div>
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight tabular-nums">
                            {item.value}
                          </p>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <ListTodo size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-base font-semibold text-gray-900">
                              Mis listas
                            </h4>
                            <p className="text-xs text-gray-500">
                              Listas personales y compartidas
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {[
                          {
                            name: "Operaciones",
                            type: "Compartida",
                            pending: 4,
                            done: 6,
                            members: 3,
                          },
                          {
                            name: "Clientes",
                            type: "Personal",
                            pending: 3,
                            done: 1,
                            members: 1,
                          },
                        ].map((list) => (
                          <div
                            key={list.name}
                            className="relative p-5 rounded-2xl border border-gray-200/80 bg-white/95 overflow-hidden"
                          >
                            <div
                              className={
                                list.type === "Compartida"
                                  ? "absolute inset-y-3 left-0 w-[3px] rounded-r-xl bg-gradient-to-b from-blue-500 via-indigo-500 to-blue-400"
                                  : "absolute inset-y-3 left-0 w-[3px] rounded-r-xl bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200"
                              }
                            />
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0 pr-3">
                                <h5 className="text-[15px] font-semibold text-gray-900 truncate leading-snug">
                                  {list.name}
                                </h5>
                                <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-1">
                                  <Clock size={9} />
                                  Creada recientemente
                                </p>
                              </div>
                              <div className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 shadow-sm border bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500/60">
                                <Users size={15} className="text-white" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col min-w-[54px]">
                                  <span className="text-lg font-semibold text-gray-900 leading-none tabular-nums">
                                    {list.pending}
                                  </span>
                                  <span className="text-[10px] text-gray-400 mt-0.5">
                                    pendientes
                                  </span>
                                </div>
                                <div className="w-px h-7 bg-gray-100" />
                                <div className="flex flex-col min-w-[54px]">
                                  <span className="text-lg font-semibold text-blue-600 leading-none tabular-nums">
                                    {list.done}
                                  </span>
                                  <span className="text-[10px] text-gray-400 mt-0.5">
                                    completadas
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                <Users size={11} />
                                <span>
                                  {list.members} miembro
                                  {list.members !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                {list.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
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

      {/* Vista real de una lista */}
      <section className="py-16 sm:py-20 bg-slate-950/95 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">
                La misma experiencia que usas dentro de Tasklyn
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                Esta vista muestra cómo se organizan las tareas dentro de una
                lista real: filtros, estados, recordatorios, vencimientos,
                miembros y acciones de gestión.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-2 sm:p-3 shadow-[0_22px_60px_rgba(15,23,42,0.85)]">
            <div className="overflow-hidden rounded-[1.5rem] bg-gray-50 text-gray-900">
              <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl">
                <div className="flex items-center gap-2 px-3 md:px-6 py-3 md:py-5 min-h-[60px] md:min-h-[72px]">
                  <button className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
                    <ArrowRight size={18} className="rotate-180" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate tracking-tight">
                        Operaciones
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-600 border border-gray-200">
                        <Users size={10} className="text-gray-500" />3 miembros
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 truncate mt-0.5">
                      Lista compartida con tareas activas
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium">
                      <Users size={15} />
                      Miembros
                    </button>
                    <button className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-blue-600 text-white text-sm font-medium">
                      <ArrowRight size={15} />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
                <div className="flex bg-gray-50 border border-gray-200/80 rounded-2xl p-1.5 mb-6 gap-1 shadow-sm">
                  {[
                    {
                      label: "Pendientes",
                      count: 3,
                      active: true,
                      icon: Clock,
                    },
                    {
                      label: "Completadas",
                      count: 2,
                      active: false,
                      icon: CheckCircle2,
                    },
                    { label: "Todas", count: 5, active: false, icon: null },
                  ].map((tab) => (
                    <button
                      key={tab.label}
                      className={
                        tab.active
                          ? "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold tracking-tight min-h-[40px] bg-white text-gray-900 shadow-sm border border-gray-200"
                          : "relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold tracking-tight min-h-[40px] text-gray-500 border border-transparent"
                      }
                    >
                      {tab.icon && (
                        <tab.icon
                          size={13}
                          className="hidden sm:block flex-shrink-0"
                        />
                      )}
                      <span>{tab.label}</span>
                      <span
                        className={
                          tab.active
                            ? "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none tracking-wide bg-blue-600 text-white shadow-sm"
                            : "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none tracking-wide bg-gray-100 text-gray-500"
                        }
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-sm">
                    <ArrowRight size={16} />
                    Añadir tarea
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      title: "Preparar entrega semanal",
                      meta: "Vence hoy · Recordatorio activo",
                      badges: ["Vence hoy", "Aviso"],
                      completed: false,
                    },
                    {
                      title: "Confirmar datos del cliente",
                      meta: "Teléfono y ubicación guardados",
                      badges: ["Datos"],
                      completed: false,
                    },
                    {
                      title: "Revisar checklist de seguimiento",
                      meta: "Repetición semanal configurada",
                      badges: ["Repetir"],
                      completed: false,
                    },
                    {
                      title: "Actualizar estado de la lista",
                      meta: "Completada por un miembro del equipo",
                      badges: ["Completada"],
                      completed: true,
                    },
                  ].map((task) => (
                    <div
                      key={task.title}
                      className={
                        task.completed
                          ? "group rounded-xl border border-blue-200 bg-blue-50/30 transition-colors relative"
                          : "group rounded-xl border border-gray-200 bg-white transition-colors relative"
                      }
                    >
                      <div className="flex items-start gap-3 p-4">
                        <button
                          className={
                            task.completed
                              ? "mt-0.5 flex-shrink-0 text-blue-600"
                              : "mt-0.5 flex-shrink-0 text-gray-300"
                          }
                        >
                          {task.completed ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <span className="block w-5 h-5 rounded-full border-2 border-current" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p
                                className={
                                  task.completed
                                    ? "text-[15px] font-medium leading-snug text-gray-400 line-through break-words"
                                    : "text-[15px] font-medium leading-snug text-gray-900 break-words"
                                }
                              >
                                {task.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {task.badges.map((badge) => (
                                  <span
                                    key={badge}
                                    className={
                                      badge === "Vence hoy"
                                        ? "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600"
                                        : badge === "Aviso"
                                          ? "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600"
                                          : badge === "Repetir"
                                            ? "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600"
                                            : "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                                    }
                                  >
                                    {badge === "Aviso" && <Bell size={8} />}
                                    {badge === "Vence hoy" && (
                                      <Clock size={8} />
                                    )}
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
                              <button className="p-1.5 rounded-lg text-gray-400 bg-gray-50">
                                <Clock size={14} />
                              </button>
                              <button className="p-1.5 rounded-lg text-gray-400 bg-gray-50">
                                <Users size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center flex-wrap gap-2 mt-2">
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Clock size={10} />
                              {task.meta}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl border border-gray-100 bg-white/70 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-3">
                      Actividad
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-[11px] text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">
                          Se completó una tarea y se actualizó el historial.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[11px] text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">
                          Se configuró un recordatorio para una tarea pendiente.
                        </span>
                      </div>
                    </div>
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
