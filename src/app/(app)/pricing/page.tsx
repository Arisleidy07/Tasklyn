"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import {
  Check,
  Crown,
  Building2,
  Sparkles,
  Zap,
  Shield,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AVAILABLE_PLANS } from "@/types/subscription";
import type { PlanType } from "@/types/subscription";

// Plan card component
interface PlanCardProps {
  plan: (typeof AVAILABLE_PLANS)[0];
  isCurrentPlan: boolean;
  isPopular?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

function PlanCard({
  plan,
  isCurrentPlan,
  isPopular,
  onSelect,
  isLoading,
}: PlanCardProps) {
  const isFree = plan.id === "free";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className={cn(
        "relative rounded-3xl p-6 sm:p-8 flex flex-col h-full",
        "border backdrop-blur-sm transition-all duration-300",
        isPopular
          ? "border-blue-500/50 bg-gradient-to-b from-blue-500/10 to-blue-600/5 shadow-[0_20px_60px_-15px_rgba(59,130,246,0.3)]"
          : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-blue-300 dark:hover:border-blue-500/30",
        isCurrentPlan &&
          "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950",
      )}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold shadow-lg">
            <Sparkles size={12} />
            Más popular
          </span>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium">
            <Check size={12} />
            Actual
          </span>
        </div>
      )}

      {/* Plan icon */}
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-5",
          isFree
            ? "bg-gray-100 dark:bg-slate-800"
            : isPopular
              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
              : "bg-gradient-to-br from-violet-500 to-purple-600",
        )}
      >
        {isFree ? (
          <Zap size={24} className="text-gray-600 dark:text-gray-400" />
        ) : plan.id === "business" ? (
          <Building2 size={24} className="text-white" />
        ) : (
          <Crown size={24} className="text-white" />
        )}
      </div>

      {/* Plan name and description */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1">
        {plan.name}
      </h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        {plan.description}
      </p>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          {plan.price === 0 ? (
            <span className="text-4xl font-bold text-gray-900 dark:text-slate-100">
              Gratis
            </span>
          ) : (
            <>
              <span className="text-4xl font-bold text-gray-900 dark:text-slate-100">
                ${plan.price}
              </span>
              <span className="text-gray-500 dark:text-slate-400">
                /{plan.period}
              </span>
            </>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <Button
        onClick={onSelect}
        disabled={isCurrentPlan || isLoading}
        isLoading={isLoading}
        className={cn(
          "w-full mb-8",
          isCurrentPlan
            ? "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-500 cursor-default"
            : isPopular
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
              : "bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-gray-800 dark:hover:bg-white",
        )}
      >
        {isCurrentPlan
          ? "Plan actual"
          : isFree
            ? "Comenzar gratis"
            : plan.id === "pro"
              ? "Actualizar a Pro"
              : "Actualizar a Business"}
      </Button>

      {/* Features */}
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Incluye:
        </p>
        <ul className="space-y-3">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  isPopular
                    ? "bg-blue-100 dark:bg-blue-500/20"
                    : "bg-gray-100 dark:bg-slate-800",
                )}
              >
                <Check
                  size={12}
                  className={
                    isPopular
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400"
                  }
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-slate-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// PayPal subscription modal
interface PayPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: (typeof AVAILABLE_PLANS)[0] | null;
}

function PayPalModal({ isOpen, onClose, plan }: PayPalModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { upgradePlan } = useSubscriptionStore();

  if (!isOpen || !plan || typeof document === "undefined") return null;

  const handleSubscribe = async () => {
    if (!user || !plan.paypalPlanId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create subscription
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.paypalPlanId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const data = await response.json();

      // Redirect to PayPal for approval
      if (data.approveLink) {
        window.location.href = data.approveLink;
      } else {
        throw new Error("No approval link received from PayPal");
      }
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  Actualizar a {plan.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  ${plan.price}/{plan.period}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800">
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
                Al suscribirte, obtendrás acceso inmediato a:
              </p>
              <ul className="space-y-2">
                {plan.features.slice(0, 5).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-green-500" />
                    <span className="text-gray-600 dark:text-slate-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubscribe}
              isLoading={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Shield size={16} className="mr-2" />
                  Pagar con PayPal
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-4">
            Pago seguro procesado por PayPal. Puedes cancelar en cualquier
            momento.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

export default function PricingPage() {
  const { user } = useAuthStore();
  const { currentPlan } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<
    (typeof AVAILABLE_PLANS)[0] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectPlan = (plan: (typeof AVAILABLE_PLANS)[0]) => {
    if (plan.id === "free") {
      // Free plan - no payment needed
      return;
    }
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  return (
    <>
      <Header
        title="Planes y Precios"
        description="Elige el plan perfecto para tu productividad"
        showMenuButton={true}
      />

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Hero section */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4"
          >
            Planes simples y transparentes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Comienza gratis y escala cuando lo necesites. Sin contratos, cancela
            cuando quieras.
          </motion.p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {AVAILABLE_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <PlanCard
                plan={plan}
                isCurrentPlan={currentPlan === plan.id}
                isPopular={plan.popular}
                onSelect={() => handleSelectPlan(plan)}
              />
            </motion.div>
          ))}
        </div>

        {/* FAQ / Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
        >
          {[
            { icon: Shield, text: "Pago seguro con PayPal" },
            { icon: Check, text: "Cancela cuando quieras" },
            { icon: Zap, text: "Activación inmediata" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-center gap-2">
              <item.icon size={18} className="text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {item.text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* PayPal Modal */}
      <PayPalModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        plan={selectedPlan}
      />
    </>
  );
}
