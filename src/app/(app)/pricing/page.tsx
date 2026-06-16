"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import Header from "@/components/layout/Header";
import {
  Check,
  Crown,
  Building2,
  Sparkles,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AVAILABLE_PLANS } from "@/types/subscription";

interface PlanCardProps {
  plan: (typeof AVAILABLE_PLANS)[0];
  isCurrentPlan: boolean;
  isPopular?: boolean;
}

function PlanCard({ plan, isCurrentPlan, isPopular }: PlanCardProps) {
  const isFree = plan.id === "free";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={cn(
        "relative rounded-2xl p-6 sm:p-8 flex flex-col h-full",
        "border transition-all duration-300",
        isPopular
          ? "border-blue-500/60 bg-gradient-to-b from-blue-600/10 via-indigo-500/5 to-transparent shadow-[0_8px_40px_-8px_rgba(99,102,241,0.3)]"
          : "",
        isCurrentPlan && "ring-2 ring-blue-500/60 ring-offset-2",
      )}
      style={
        !isPopular
          ? {
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
            }
          : {}
      }
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[11px] font-semibold shadow-md tracking-wide"
            style={{ color: "var(--text-on-accent)" }}
          >
            <Sparkles size={11} />
            MOST POPULAR
          </span>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: "rgba(16,185,129,0.1)",
              color: "#059669",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <Check size={11} />
            Actual
          </span>
        </div>
      )}

      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-5",
          isFree
            ? ""
            : isPopular
              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
              : "bg-gradient-to-br from-violet-500 to-purple-600",
        )}
      >
        {isFree ? (
          <Zap size={20} style={{ color: "var(--text-tertiary)" }} />
        ) : plan.id === "business" ? (
          <Building2 size={20} style={{ color: "var(--text-on-accent)" }} />
        ) : (
          <Crown size={20} style={{ color: "var(--text-on-accent)" }} />
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <h3
          className="text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {plan.name}
        </h3>
        {plan.id === "pro" && <span className="text-base">⭐</span>}
        {plan.id === "business" && <span className="text-base">🚀</span>}
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
        {plan.description}
      </p>

      <div className="mb-6">
        {plan.price === 0 ? (
          <div>
            <span
              className="text-4xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              $0
            </span>
            <span
              className="ml-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Forever
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span
              className="text-4xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              ${plan.price}
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              / mes
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mb-7">
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full h-10 rounded-xl text-sm font-medium cursor-default"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-tertiary)",
              border: "1px solid var(--border-color)",
            }}
          >
            Plan actual
          </button>
        ) : isFree ? (
          <button
            className="w-full h-10 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Comenzar gratis
          </button>
        ) : isPopular ? (
          <button
            className="w-full h-10 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 active:scale-[0.98]"
            style={{ color: "var(--text-on-accent)" }}
          >
            ✨ Suscribirse ahora
          </button>
        ) : (
          <button
            className="w-full h-10 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200 active:scale-[0.98]"
            style={{ color: "var(--text-on-accent)" }}
          >
            🚀 Comenzar
          </button>
        )}
      </div>

      <div className="flex-1">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          Incluye:
        </p>
        <ul className="space-y-2.5">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                  isPopular ? "" : "",
                )}
              >
                <Check
                  size={10}
                  style={{
                    color: isPopular ? "#2563eb" : "var(--text-tertiary)",
                  }}
                />
              </div>
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function PricingPage() {
  const { currentPlan } = useSubscriptionStore();

  return (
    <>
      <Header
        title="Planes y Precios"
        description="Elige el plan perfecto para tu productividad"
        showMenuButton={true}
      />

      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{
              backgroundColor: "rgba(37,99,235,0.07)",
              border: "1px solid rgba(37,99,235,0.2)",
              color: "#2563eb",
            }}
          >
            <Sparkles size={12} />
            Planes flexibles
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Planes simples y transparentes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base max-w-xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Comienza gratis y escala cuando lo necesites. Sin contratos, cancela
            cuando quieras.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7 mb-14">
          {AVAILABLE_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.15 }}
              className="flex flex-col"
            >
              <PlanCard
                plan={plan}
                isCurrentPlan={currentPlan === plan.id}
                isPopular={plan.popular}
              />
            </motion.div>
          ))}
        </div>

        {/* Payment providers — Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-dashed p-6 text-center"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={16} style={{ color: "var(--text-tertiary)" }} />
            <span
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-secondary)" }}
            >
              Métodos de pago — Próximamente
            </span>
          </div>
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            Los pagos serán habilitados pronto. Podrás suscribirte con:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["Stripe", "PayPal", "MercadoPago", "Apple Pay", "Google Pay"].map(
              (p) => (
                <span
                  key={p}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {p}
                </span>
              ),
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
        >
          {[
            { icon: Shield, text: "Pago 100% seguro" },
            { icon: Check, text: "Cancela cuando quieras" },
            { icon: Zap, text: "Activación inmediata" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-center gap-2">
              <item.icon size={16} className="text-blue-500" />
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
