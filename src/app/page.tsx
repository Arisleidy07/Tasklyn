"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Logo from "@/components/shared/Logo";
import PricingSection from "@/components/landing/PricingSection";
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
  Menu,
  X,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SubscriptionUpgradeModal from "@/components/paypal/SubscriptionUpgradeModal";

const DEMO_WIDTH = 580;
const DEMO_HEIGHT = 480;

/** Scales the fixed-size product demo to the available width without ever
 *  contributing intrinsic width to the layout (prevents horizontal overflow). */
function ScaledDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setScale(Math.min(1, el.clientWidth / DEMO_WIDTH) || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative w-full max-w-[580px] mx-auto overflow-hidden"
      style={{ height: scale ? DEMO_HEIGHT * scale : undefined, minHeight: 1 }}
    >
      {scale > 0 && (
        <div
          className="absolute top-0 left-0"
          style={{
            width: DEMO_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <HeroDemo />
        </div>
      )}
    </div>
  );
}

const features = [
  {
    icon: ListTodo,
    title: "Listas claras",
    description:
      "Listas personales o compartidas con prioridades, fechas y ubicación.",
  },
  {
    icon: Users,
    title: "Colaboración real",
    description:
      "Invita a tu equipo, asigna responsables y trabaja sin perder contexto.",
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
      "Roles de propietario, editor y lector con historial de cada acción.",
  },
  {
    icon: Zap,
    title: "Rápido y ligero",
    description:
      "Instálala en el teléfono o úsala en la oficina. Misma experiencia.",
  },
  {
    icon: BarChart3,
    title: "Métricas útiles",
    description:
      "Progreso, ranking y actividad del equipo en paneles fáciles de leer.",
  },
];

const steps = [
  {
    n: "01",
    title: "Crea tu espacio",
    text: "Entra con tu cuenta de Google y crea tu primera lista en segundos.",
  },
  {
    n: "02",
    title: "Invita a tu equipo",
    text: "Comparte listas o forma un equipo y define quién puede hacer qué.",
  },
  {
    n: "03",
    title: "Ejecuta y mide",
    text: "Asigna, completa y sigue el progreso en tiempo real desde cualquier dispositivo.",
  },
];

const highlights = [
  "Tiempo real",
  "Roles y permisos",
  "Móvil y escritorio",
  "Gratis para empezar",
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user, login, isLoading } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "business" | null>(
    null,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const signedIn = isAuthenticated || !!user;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const handlePrimaryAction = () => {
    if (signedIn) {
      router.push("/dashboard");
      return;
    }
    localStorage.setItem("tasklyn-redirect-after-login", "/dashboard");
    login();
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === "free") {
      handlePrimaryAction();
      return;
    }
    if (signedIn) {
      setSelectedPlan(planId as "pro" | "business");
      return;
    }
    localStorage.setItem(
      "tasklyn-redirect-after-login",
      `/pricing?plan=${planId}&subscribe=1`,
    );
    login();
  };

  const scrollToId = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navItems = [
    { label: "Características", id: "features" },
    { label: "Cómo funciona", id: "how" },
    { label: "Precios", id: "pricing" },
  ];

  const primaryLabel = signedIn ? "Ir a mi panel" : "Crear cuenta gratis";

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden antialiased">
      {/* ───────── Header ───────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
            : "bg-white/70 backdrop-blur-sm border-b border-transparent"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 min-w-0"
            aria-label="TASKLYN — inicio"
          >
            <Logo
              size="xs"
              showText
              textClassName="text-blue-700 text-base sm:text-lg"
              className="gap-2"
            />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className="px-4 h-10 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isLoading}
              className="inline-flex items-center gap-2 h-10 px-4 sm:px-5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-70 whitespace-nowrap"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>{signedIn ? "Mi panel" : "Empezar"}</span>
                  <ArrowRight size={16} className="hidden sm:block" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToId(item.id)}
                  className="h-12 px-3 rounded-lg text-left text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ───────── Hero ───────── */}
      <section
        id="hero"
        className="relative pt-28 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0) 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-blue-700 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Colaboración en tiempo real para equipos
            </div>
            <h1 className="text-[2rem] leading-[1.1] sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 text-balance">
              Organiza el trabajo de tu equipo{" "}
              <span className="text-blue-600">sin perder el control.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto text-pretty">
              TASKLYN reúne listas, tareas, responsables, fechas y ubicaciones
              en un solo lugar. Todo sincronizado al instante, desde el
              teléfono o la computadora.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-semibold shadow-[0_10px_30px_rgba(37,99,235,0.30)] transition-all disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {primaryLabel}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => scrollToId("features")}
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-base font-semibold transition-colors"
              >
                Ver características
              </button>
            </div>

            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-600">
              {highlights.map((h) => (
                <li key={h} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  {h}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Product visual */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mt-12 sm:mt-16 max-w-[640px] mx-auto"
          >
            <div className="absolute inset-x-8 -bottom-6 h-24 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
            <div className="relative rounded-2xl sm:rounded-3xl border border-slate-200 bg-slate-50 p-2 sm:p-3 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)]">
              <ScaledDemo />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
              Características
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
              Todo lo que tu equipo necesita, sin complicaciones
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 text-pretty">
              Herramientas simples y potentes, pensadas para equipos que
              necesitan resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-200 hover:shadow-[0_12px_40px_-12px_rgba(37,99,235,0.25)] transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <feature.icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section
        id="how"
        className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50 border-y border-slate-200"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
              Cómo funciona
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
              Empieza en tres pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="relative rounded-2xl bg-white border border-slate-200 p-6 sm:p-7"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold mb-4">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                  {s.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <PricingSection onSelectPlan={handleSelectPlan} isLoading={isLoading} />

      <SubscriptionUpgradeModal
        planId={selectedPlan ?? "pro"}
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />

      {/* ───────── Final CTA ───────── */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 px-6 py-12 sm:px-12 sm:py-16 text-center text-white shadow-[0_30px_80px_-20px_rgba(37,99,235,0.5)]"
          >
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
            <div className="relative max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-balance">
                Empieza a organizar tu equipo hoy
              </h2>
              <p className="mt-4 text-blue-100 text-base sm:text-lg text-pretty">
                Crea tu espacio gratis, invita a tu equipo y convierte el
                trabajo disperso en resultados.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-base font-semibold shadow-lg transition-colors disabled:opacity-70"
                >
                  {primaryLabel}
                  <ArrowRight size={18} />
                </button>
                <a
                  href="mailto:tasklyn.oficial@gmail.com"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-white/40 text-white hover:bg-white/10 text-base font-semibold transition-colors"
                >
                  <Mail size={18} />
                  Contactar
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-3">
            <Logo
              size="xs"
              showText
              textClassName="text-blue-700 text-base"
              className="gap-2"
            />
            <p className="text-sm text-slate-500 max-w-xs">
              Gestión de tareas colaborativa para equipos productivos.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
            <a
              href="mailto:tasklyn.oficial@gmail.com"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-700 transition-colors break-all"
            >
              <Mail size={16} className="flex-shrink-0" />
              tasklyn.oficial@gmail.com
            </a>
            <p className="text-slate-400">
              © {new Date().getFullYear()} TASKLYN. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
