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
              className="flex items-center gap-2 cursor-pointer"
            >
              <Logo size="md" />
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
              variant="ghost"
              size="sm"
              onClick={login}
              isLoading={isLoading}
              className="hidden sm:inline-flex text-slate-200 hover:text-white hover:bg-slate-800/80 border-slate-700"
            >
              Iniciar sesión
            </Button>
            <Button
              onClick={login}
              isLoading={isLoading}
              size="sm"
              icon={<ArrowRight size={16} />}
              className="bg-blue-600 hover:bg-blue-500 text-white border-none"
            >
              Crear cuenta
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="hero"
        className="relative pt-28 sm:pt-32 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden"
      >
        {/* Premium background — mesh gradient */}
        <div className="absolute inset-0 bg-mesh-blue pointer-events-none" />

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
              <Logo size="lg" />
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900/70 border border-slate-700 text-slate-200 uppercase tracking-wide">
                SaaS de productividad para equipos
              </span>
            </div>

            <h1 className="text-3.5xl sm:text-5xl lg:text-6xl font-semibold text-slate-50 tracking-tight mb-5 leading-tight">
              Organiza tu trabajo y
              <br className="hidden sm:block" />
              <span className="text-blue-400">colabora en tiempo real.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 mb-7 max-w-xl">
              Tasklyn centraliza listas, tareas, miembros y notificaciones en un
              solo lugar, para que tu equipo se mantenga alineado desde
              cualquier dispositivo.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-5">
              <Button
                onClick={login}
                isLoading={isLoading}
                size="lg"
                icon={<ArrowRight size={18} />}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_18px_50px_rgba(37,99,235,0.45)]"
              >
                Comenzar gratis
              </Button>
              <button
                type="button"
                onClick={login}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl border border-slate-700/80 text-sm font-medium text-slate-100 bg-slate-900/40 hover:bg-slate-800/70 transition-colors"
              >
                Ver panel en vivo
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-400">
              Gratis para siempre en el plan personal. Sin tarjeta de crédito.
            </p>
          </motion.div>

          {/* Hero mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="relative"
          >
            {/* Preview - Mockup simple */}
            <div className="bg-slate-900/70 rounded-3xl border border-slate-700/80 p-4 shadow-[0_32px_80px_rgba(15,23,42,0.9)]">
              <div className="bg-slate-950/80 rounded-2xl overflow-hidden">
                {/* Mock UI simple */}
                <div className="flex h-[280px] sm:h-[320px]">
                  <div className="w-52 bg-slate-950 border-r border-slate-800 p-4 hidden sm:block">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-white" />
                      </div>
                      <span className="font-semibold text-slate-50 text-sm">
                        Tasklyn
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="px-3 py-2 bg-blue-600/90 text-white rounded-lg font-medium flex items-center justify-between">
                        <span>Dashboard</span>
                        <span className="text-[10px] bg-blue-500/40 px-1.5 py-0.5 rounded-md">
                          Hoy
                        </span>
                      </div>
                      <div className="px-3 py-2 text-slate-300/90 rounded-lg flex items-center justify-between">
                        <span>Mis listas</span>
                        <span className="text-[10px] text-slate-500">6</span>
                      </div>
                      <div className="px-3 py-2 text-slate-300/80 rounded-lg flex items-center justify-between">
                        <span>Compartidas</span>
                        <span className="text-[10px] text-slate-500">4</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-50 text-sm sm:text-base">
                        Lista: Implementación clientes
                      </h3>
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300">
                        <CheckCircle2 size={12} />
                        72% completado
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        "Configurar acceso",
                        "Notificar al equipo",
                        "Activar recordatorios",
                      ].map((label, index) => (
                        <div
                          key={label}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80"
                        >
                          <div className="w-5 h-5 rounded-full border-2 border-blue-500/70 flex items-center justify-center flex-shrink-0">
                            {index === 0 && (
                              <CheckCircle2
                                size={12}
                                className="text-blue-400"
                              />
                            )}
                          </div>
                          <div className="flex-1 h-3 rounded bg-slate-700/60">
                            <div className="h-3 rounded bg-blue-500/80 w-[70%]" />
                          </div>
                        </div>
                      ))}
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
                  Crea listas personales o compartidas y mantén a toda la
                  empresa alineada con un único lugar de verdad.
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
                  colabora en tiempo real, como en las mejores apps SaaS.
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
                  Vencimientos, recordatorios y repeticiones con notificaciones
                  en tiempo real en web, Android, iOS, Windows y Mac.
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={22} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50 mb-1">
                  Desde cualquier dispositivo
                </h3>
                <p className="text-slate-400 text-sm">
                  Interfaz responsive diseñada para teléfono, tablet, laptop y
                  monitores grandes, sin nada roto ni cortado.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capturas / Mockups */}
      <section className="py-16 sm:py-20 bg-slate-950/95 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">
                Un panel tan claro como potente
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl">
                Inspírate en la experiencia de herramientas como Todoist, Notion
                o ClickUp, pero con un flujo adaptado a tu operación diaria.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-4">
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                Dashboard
              </p>
              <div className="h-[220px] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80" />
              <p className="text-sm text-slate-300">
                KPIs de listas, tareas pendientes/completadas y actividad
                reciente de tu equipo en un solo vistazo.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-3">
                  Listas y tareas
                </p>
                <div className="h-[140px] rounded-2xl bg-slate-950 border border-slate-800/80" />
                <p className="mt-3 text-sm text-slate-300">
                  Tarjetas de listas ejecutivas y tareas con vencimientos,
                  recordatorios, archivos y contexto.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2">
                    Perfil
                  </p>
                  <div className="h-20 rounded-2xl bg-slate-950 border border-slate-800/80" />
                  <p className="mt-2 text-xs text-slate-400">
                    Foto real, datos de contacto y plan.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2">
                    Notificaciones
                  </p>
                  <div className="h-20 rounded-2xl bg-slate-950 border border-slate-800/80" />
                  <p className="mt-2 text-xs text-slate-400">
                    Invitaciones, vencimientos y actividad clave.
                  </p>
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
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden border-t border-slate-800/70 bg-mesh-blue">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="animate-glow-drift absolute top-[10%] right-[15%] w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="animate-glow-drift-2 absolute bottom-[5%] left-[10%] w-80 h-80 rounded-full bg-blue-400/20 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-slate-50 mb-4">
              ¿Listo para que Tasklyn sea tu nuevo centro de operaciones?
            </h2>
            <p className="text-slate-200/80 mb-8 text-sm sm:text-base">
              Crea tu espacio, invita a tu equipo y empieza a coordinar trabajo
              como una empresa SaaS profesional.
            </p>
            <Button
              onClick={login}
              isLoading={isLoading}
              size="lg"
              icon={<ArrowRight size={18} />}
              className="bg-slate-950 text-slate-50 border border-slate-700 hover:bg-slate-900/90"
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
            href="mailto:soporte@tasklyn.app"
            className="inline-flex items-center justify-center px-5 h-11 rounded-xl border border-slate-700 text-sm font-medium text-slate-100 hover:bg-slate-900/80 hover:text-white transition-colors"
          >
            soporte@tasklyn.app
          </a>
        </div>
      </section>

      {/* Footer simple */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Logo size="sm" />
              <span className="text-slate-200 font-semibold text-sm">
                Tasklyn
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs">
              Plataforma de gestión de tareas colaborativa, lista para llevar tu
              operación al siguiente nivel.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Producto
            </p>
            <ul className="space-y-2 text-slate-300">
              <li>Acerca de Tasklyn</li>
              <li>Soporte</li>
              <li>Contacto</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Legal & redes
            </p>
            <ul className="space-y-2 text-slate-300">
              <li>Política de privacidad</li>
              <li>Términos de uso</li>
              <li>Redes sociales</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Tasklyn. Todos los derechos reservados.
          </p>
          <p>
            Hecho para equipos que necesitan orden real, no más listas sueltas.
          </p>
        </div>
      </footer>
    </div>
  );
}
