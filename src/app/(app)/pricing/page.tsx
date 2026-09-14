// ============================================
// TASKLYN — Planes y precios
// ============================================
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/layout/Header";
import SubscriptionUpgradeModal from "@/components/paypal/SubscriptionUpgradeModal";
import { AVAILABLE_PLANS } from "@/types/subscription";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "business" | null>(
    null,
  );

  const currentPlan = user?.plan ?? "free";

  useEffect(() => {
    const plan = searchParams.get("plan");
    const subscribe = searchParams.get("subscribe");
    if (subscribe === "1" && (plan === "pro" || plan === "business")) {
      setSelectedPlan(plan);
    }
  }, [searchParams]);

  const handleSelectPlan = (planId: string) => {
    if (planId === "free") {
      if (isAuthenticated || user) {
        router.push("/dashboard");
      } else {
        if (typeof window !== "undefined") {
          localStorage.setItem("tasklyn-redirect-after-login", "/dashboard");
        }
        const { useAuthStore } = require("@/stores/authStore");
        useAuthStore.getState().login();
      }
      return;
    }

    setSelectedPlan(planId as "pro" | "business");
  };

  const planInfo = (id: string) => {
    const plan = AVAILABLE_PLANS.find((p) => p.id === id);
    if (!plan) return null;
    const isCurrent = currentPlan === id;
    return { ...plan, isCurrent };
  };

  const isPaying = currentPlan === "pro" || currentPlan === "business";

  return (
    <>
      <Header
        title="Planes y precios"
        description="Elige el plan que mejor se adapte a tu uso de Tasklyn."
        showMenuButton={true}
      />

      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Planes y precios
          </h1>
          <p
            className="text-sm md:text-base max-w-lg mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Elige el plan que mejor se adapte a tu uso de Tasklyn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {AVAILABLE_PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isCurrentPaid = isCurrent && plan.id !== "free";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl p-5 md:p-6 border flex flex-col"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="mb-5">
                  <h2
                    className="text-lg font-bold mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {plan.name}
                  </h2>
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
                    onClick={() => handleSelectPlan(plan.id)}
                    className={cn(
                      "w-full h-11 rounded-xl text-sm font-semibold transition-colors",
                      plan.id === "free"
                        ? "border hover:bg-[var(--bg-hover)]"
                        : "bg-blue-600 hover:bg-blue-500 text-white",
                    )}
                    style={
                      plan.id === "free"
                        ? {
                            borderColor: "var(--border-color)",
                            color: "var(--text-primary)",
                          }
                        : undefined
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

      <SubscriptionUpgradeModal
        planId={selectedPlan ?? "pro"}
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
    </>
  );
}
