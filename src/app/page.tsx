"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Logo from "@/components/shared/Logo";
import PricingSection from "@/components/landing/PricingSection";
import Button from "@/components/ui/Button";
import HeroDemo from "@/components/landing/HeroDemo";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ListTodo,
  Users,
  Clock,
  Shield,
  Zap,
  BarChart3,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DEMO_WIDTH = 580;
const DEMO_HEIGHT = 480;

/** Scales the fixed-size product demo down to fit any viewport (never overflows). */
function ScaledDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / DEMO_WIDTH));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full max-w-[580px] mx-auto">
      <div
        style={{ height: DEMO_HEIGHT * scale }}
        className="relative overflow-hidden"
      >
        <div
          style={{
            width: DEMO_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <HeroDemo />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user, login, isLoading } = useAuthStore();

  const handlePrimaryAction = () => {
    if (isAuthenticated || user) {
      router.push("/dashboard");
      return;
    }
    login();
  };

  const scrollToId = (id: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navItems = [
    { label: "Inicio", id: "hero" },
    { label: "Características", id: "features" },
    { label: "Precios", id: "pricing" },
  ];

  const features = [
    {
      icon: ListTodo,
      title: "Listas claras",
      description:
        "Organiza tareas en listas personales o compartidas con prioridades y fechas.",
    },
    {
      icon: Users,
      title: "Colaboración real",
      description:
        "Invita miembros, asigna responsables y trabaja en equipo sin perder contexto.",
    },
    {
      icon: Clock,
      title: "Siempre a tiempo",
      description:
        "Recordatorios, vencimientos y notificaciones para que nada se escape.",
    },
    {
      icon: Shield,
      title: "Control total",
      description:
        "Roles de owner, editor y viewer con historial completo de cada acción.",
    },
    {
      icon: Zap,
      title: "Rápido y ligero",
      description:
        "Diseñado para usarse desde el celular hasta la oficina sin fricción.",
    },
    {
      icon: BarChart3,
      title: "Métricas útiles",
      description:
        "Progreso, ranking y actividad del equipo en paneles fáciles de leer.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
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

          <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className="px-4 h-8 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <Button
            onClick={handlePrimaryAction}
            isLoading={isLoading}
            size="sm"
            icon={<ArrowRight size={16} />}
            className="rounded-full bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_8px_24px_rgba(37,99,235,0.35)]"
          >
            {isAuthenticated || user ? "Mis listas" : "Empezar"}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section
        id="hero"
        className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="animate-glow-drift absolute top-[-10%] right-[-10%] w-[480px] h-[480px] rounded-full bg-blue-500/18 blur-[120px]" />
          <div className="animate-glow-drift-2 absolute bottom-[-10%] left-[-10%] w-[440px] h-[440px] rounded-full bg-indigo-500/14 blur-[110px]" />
        </div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3.5 py-1.5 text-xs font-medium text-slate-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Colaboración en tiempo real
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-tight mb-5 leading-[1.08]">
              Gestión de tareas pensada para equipos.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Crea listas, asigna tareas, controla vencimientos y mantén a tu
              equipo sincronizado en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Button
                onClick={handlePrimaryAction}
                isLoading={isLoading}
                size="lg"
                icon={<ArrowRight size={18} />}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_20px_60px_rgba(37,99,235,0.45)] hover:shadow-[0_20px_70px_rgba(37,99,235,0.6)] transition-shadow"
              >
                {isAuthenticated || user
                  ? "Abrir Tasklyn"
                  : "Crear cuenta gratis"}
              </Button>
              <button
                type="button"
                onClick={() => scrollToId("features")}
                className="w-full sm:w-auto h-12 px-6 rounded-xl text-sm font-medium text-slate-200 border border-slate-700/80 hover:bg-slate-900 hover:text-white transition-colors"
              >
                Ver características
              </button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-400">
              <span>Gratis para empezar</span>
              <span className="hidden sm:inline text-slate-700">·</span>
              <span>Tiempo real</span>
              <span className="hidden sm:inline text-slate-700">·</span>
              <span>Móvil y escritorio</span>
            </div>
          </motion.div>

          {/* Product visual */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <ScaledDemo />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="py-16 sm:py-20 bg-slate-950 border-t border-slate-800/60"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-2">
              Todo en un solo lugar
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Herramientas simples para equipos que necesitan resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center flex-shrink-0">
                  <feature.icon size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-50 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection login={login} isLoading={isLoading} />

      {/* Final CTA */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden border-t border-slate-800/60 bg-slate-950">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="animate-glow-drift absolute top-[10%] right-[15%] w-64 h-64 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="animate-glow-drift-2 absolute bottom-[5%] left-[10%] w-80 h-80 rounded-full bg-blue-400/20 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-50 mb-3">
              Empieza a organizar tu equipo hoy
            </h2>
            <p className="text-slate-300 mb-8 text-sm sm:text-base max-w-lg mx-auto">
              Crea tu espacio, invita a tu equipo y convierte el trabajo
              disperso en resultados concretos.
            </p>
            <Button
              onClick={handlePrimaryAction}
              isLoading={isLoading}
              size="lg"
              icon={<ArrowRight size={18} />}
              className="bg-blue-600 hover:bg-blue-500 text-white border-none"
            >
              {isAuthenticated || user
                ? "Ir a mis listas"
                : "Crear cuenta gratis"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 sm:py-14 bg-slate-950 border-t border-slate-900/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-1">
              ¿Necesitas algo?
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              Escríbenos y te respondemos lo antes posible.
            </p>
          </div>
          <a
            href="mailto:tasklyn.oficial@gmail.com"
            className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl border border-slate-700 text-sm font-medium text-slate-100 hover:bg-slate-900/80 hover:text-white transition-colors"
          >
            tasklyn.oficial@gmail.com
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Logo size="sm" showText={false} />
              <span className="text-slate-200 font-semibold text-sm">
                Tasklyn
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs">
              Plataforma de gestión de tareas colaborativa para equipos
              productivos.
            </p>
          </div>
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Tasklyn. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
