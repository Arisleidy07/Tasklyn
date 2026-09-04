"use client";

import { motion } from "framer-motion";
import { Check, Zap, Building2, User } from "lucide-react";

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  features: string[];
  cta: string;
  ctaVariant: "primary" | "secondary";
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "/mes",
    description: "Para organizar tus tareas esenciales.",
    badge: "Gratis",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    features: [
      "Hasta 4 listas",
      "Hasta 15 tareas",
      "Hasta 5 personas por lista",
      "Funciones básicas",
    ],
    cta: "Comenzar gratis",
    ctaVariant: "secondary",
  },
  {
    name: "Pro",
    price: "$2.99",
    period: "/mes",
    description: "Para profesionales productivos.",
    badge: "MOST POPULAR",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    features: [
      "Hasta 20 listas",
      "Hasta 35 tareas",
      "Mayor límite de personas",
      "Historial completo",
      "Personalización",
      "Funciones avanzadas",
    ],
    cta: "Elegir Pro",
    ctaVariant: "primary",
    popular: true,
  },
  {
    name: "Business",
    price: "$10",
    period: "/mes",
    description: "Para equipos y empresas.",
    badge: "Empresas",
    badgeColor: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    features: [
      "Listas, tareas y personas ilimitadas",
      "Equipos y colaboración sin límite",
      "Todas las funciones Pro",
      "Futuras funciones empresariales",
    ],
    cta: "Elegir Business",
    ctaVariant: "secondary",
  },
];

export default function PricingSection({
  login,
  isLoading,
}: {
  login: () => void;
  isLoading: boolean;
}) {
  return (
    <section
      id="pricing"
      className="py-20 sm:py-24 bg-slate-950 border-t border-slate-800/70"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Zap size={14} className="text-blue-400" />
            <span className="text-xs font-medium text-blue-400">
              Planes flexibles
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-50 mb-4 tracking-tight">
            Precios simples y transparentes
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
            Empieza gratis y escala cuando tu equipo lo necesite. Sin sorpresas,
            sin contratos a largo plazo.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? "bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.15)]"
                  : "bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-medium shadow-lg">
                    Más popular
                  </div>
                </div>
              )}

              {/* Plan Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${plan.badgeColor} w-fit mb-4`}
              >
                {plan.name === "Free" && <User size={12} />}
                {plan.name === "Pro" && <Zap size={12} />}
                {plan.name === "Business" && <Building2 size={12} />}
                <span className="text-[11px] font-medium">{plan.badge}</span>
              </div>

              {/* Plan Name */}
              <h3 className="text-xl font-semibold text-slate-100 mb-1">
                {plan.name}
              </h3>
              <p className="text-sm text-slate-400 mb-4">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-100">
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                {plan.name !== "Free" && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Facturado mensualmente
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular ? "bg-blue-500/20" : "bg-slate-800"
                      }`}
                    >
                      <Check
                        size={12}
                        className={
                          plan.popular ? "text-blue-400" : "text-slate-400"
                        }
                      />
                    </div>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {plan.ctaVariant === "primary" ? (
                <button
                  onClick={login}
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 active:scale-[0.98]"
                >
                  {plan.cta}
                </button>
              ) : plan.name.startsWith("Business") ? (
                <button
                  onClick={login}
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200 active:scale-[0.98]"
                >
                  {plan.cta}
                </button>
              ) : (
                <button
                  onClick={login}
                  disabled={isLoading}
                  className="w-full h-10 rounded-xl text-sm font-medium border border-slate-700 text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 transition-all duration-200"
                >
                  {plan.cta}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-slate-500">
            ¿Necesitas algo más?{" "}
            <a
              href="mailto:tasklyn.oficial@gmail.com"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Contáctanos para planes personalizados
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
