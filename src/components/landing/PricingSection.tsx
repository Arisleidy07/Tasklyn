// ============================================
// TASKLYN — Landing Pricing Section
// ============================================
"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AVAILABLE_PLANS } from "@/types/subscription";
import { useAuthStore } from "@/stores/authStore";

interface PricingSectionProps {
  onSelectPlan: (planId: string) => void;
  isLoading: boolean;
}

const ctaLabel: Record<string, string> = {
  free: "Comenzar gratis",
  pro: "Elegir Pro",
  business: "Elegir Business",
};

export default function PricingSection({
  onSelectPlan,
  isLoading,
}: PricingSectionProps) {
  const { user } = useAuthStore();
  const currentPlan = user?.plan ?? "free";

  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-10 sm:mb-14"
        >
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
            Precios
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
            Planes simples y transparentes
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 text-pretty">
            Empieza gratis y mejora cuando tu equipo lo necesite. Sin cobros
            automáticos sin tu autorización.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {AVAILABLE_PLANS.map((plan, index) => {
            const isCurrent = currentPlan === plan.id;
            const popular = !!plan.popular;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col border bg-white ${
                  popular
                    ? "border-blue-600 shadow-[0_20px_60px_-20px_rgba(37,99,235,0.45)] md:-translate-y-2"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
                    Más popular
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">
                    US${plan.price.toFixed(plan.price % 1 === 0 ? 0 : 2)}
                  </span>
                  <span className="text-sm text-slate-500">/ mes</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <span className="mt-0.5 inline-flex w-5 h-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full h-12 flex items-center justify-center rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50 text-slate-500">
                    Plan actual
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectPlan(plan.id)}
                    disabled={isLoading}
                    className={`w-full h-12 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                      popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border border-slate-300 bg-white hover:bg-slate-50 text-slate-900"
                    }`}
                  >
                    {ctaLabel[plan.id] ?? "Elegir plan"}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
