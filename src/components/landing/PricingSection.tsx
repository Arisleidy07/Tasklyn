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

export default function PricingSection({
  onSelectPlan,
  isLoading,
}: PricingSectionProps) {
  const { user } = useAuthStore();
  const currentPlan = user?.plan ?? "free";

  return (
    <section
      id="pricing"
      className="py-20 sm:py-24"
      style={{
        backgroundColor: "var(--bg-default)",
        borderTop: "1px solid var(--border-color)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Planes y precios
          </h2>
          <p
            className="text-sm sm:text-base max-w-md mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Elige el plan que mejor se adapte a tu uso de Tasklyn.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {AVAILABLE_PLANS.map((plan, index) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="rounded-2xl p-6 border flex flex-col"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="mb-5">
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      US${plan.price.toFixed(plan.price % 1 === 0 ? 0 : 2)}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      / mes
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Check
                        size={14}
                        className="text-blue-600 flex-shrink-0 mt-0.5"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div
                    className="w-full h-11 flex items-center justify-center rounded-xl text-sm font-semibold border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Plan actual
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
                    style={
                      plan.id === "free"
                        ? {
                            border: "1px solid var(--border-color)",
                            color: "var(--text-primary)",
                            backgroundColor: "var(--bg-card)",
                          }
                        : {
                            backgroundColor: "#2563eb",
                            color: "#fff",
                          }
                    }
                  >
                    {plan.id === "free"
                      ? "Comenzar gratis"
                      : plan.id === "pro"
                        ? "Elegir Pro"
                        : "Elegir Business"}
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
