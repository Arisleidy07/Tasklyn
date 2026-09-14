// ============================================
// TASKLYN — Professional Subscription Upgrade Modal
// ============================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Loader2, Shield } from "lucide-react";
import { AVAILABLE_PLANS } from "@/types/subscription";
import { usePayPalPlans } from "@/hooks/usePayPalPlans";
import { useAuthStore } from "@/stores/authStore";
import PayPalCheckout from "./PayPalCheckout";
import PaymentStatusModal from "./PaymentStatusModal";
import { auth } from "@/lib/firebase";

type PaymentStatus =
  | "idle"
  | "processing"
  | "success"
  | "error"
  | "cancelled";

interface SubscriptionUpgradeModalProps {
  planId: "pro" | "business";
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionUpgradeModal({
  planId,
  isOpen,
  onClose,
}: SubscriptionUpgradeModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { plans, loading: plansLoading, error: plansError } = usePayPalPlans();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  const plan = AVAILABLE_PLANS.find((p) => p.id === planId);
  const paypalPlanId =
    planId === "business" ? plans?.business : plans?.pro;

  // Handle Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const verifySubscription = async (subscriptionId: string) => {
    setStatus("processing");
    try {
      const fbUser = auth.currentUser;
      const token = fbUser ? await fbUser.getIdToken() : null;
      if (!token) throw new Error("Sesión no válida");

      const res = await fetch("/api/paypal/verify-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "No se pudo verificar la suscripción");
      }

      const data = (await res.json()) as {
        success: boolean;
        status: string;
      };

      if (data.success && data.status === "ACTIVE") {
        setStatus("success");
      } else {
        setStatusMessage(`Estado de PayPal: ${data.status}`);
        setStatus("processing");
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error");
      setStatus("error");
    }
  };

  const handleCreated = (subId: string) => {
    void verifySubscription(subId);
  };

  const handleError = (msg: string) => {
    setStatusMessage(msg);
    setStatus("error");
  };

  const handleCancelFlow = () => {
    setStatusMessage(undefined);
    setStatus("cancelled");
  };

  const handleClose = () => {
    setStatus("idle");
    setStatusMessage(undefined);
    onClose();
  };

  const handleGoDashboard = () => {
    handleClose();
    router.push("/dashboard");
  };

  const handleGoProfile = () => {
    handleClose();
    router.push("/profile");
  };

  if (!plan) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8 border shadow-2xl"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
            }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            {status === "idle" ? (
              <>
                <div className="mb-6">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Actualizar plan
                  </p>
                  <h2
                    className="text-2xl font-bold mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {plan.name}
                  </h2>
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
                  <p
                    className="text-sm mt-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {plan.description}
                  </p>
                </div>

                <div
                  className="rounded-xl p-4 sm:p-5 mb-6"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                >
                  <p
                    className="text-xs font-medium mb-3 uppercase tracking-wide"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Incluido en {plan.name}
                  </p>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Check
                          size={16}
                          className="text-blue-600 flex-shrink-0 mt-0.5"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  {plansLoading ? (
                    <div
                      className="flex items-center justify-center gap-2 py-6 rounded-xl border"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <Loader2
                        size={18}
                        className="animate-spin text-blue-600"
                      />
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Preparando PayPal...
                      </span>
                    </div>
                  ) : plansError || !paypalPlanId ? (
                    <div
                      className="p-4 rounded-xl border text-center"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.06)",
                        borderColor: "rgba(239,68,68,0.15)",
                      }}
                    >
                      <p className="text-sm text-red-600">
                        {plansError ??
                          "No se pudo cargar el plan. Revisa la configuración."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <p
                        className="text-xs text-center"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Pago seguro procesado por PayPal. Puedes cancelar en
                        cualquier momento desde tu perfil.
                      </p>
                      <PayPalCheckout
                        paypalPlanId={paypalPlanId}
                        onSubscriptionCreated={handleCreated}
                        onError={handleError}
                      />
                    </>
                  )}

                  <div
                    className="flex items-center justify-center gap-1.5 text-[11px] pt-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Shield size={10} />
                    <span>Transacción cifrada por PayPal</span>
                  </div>
                </div>
              </>
            ) : (
              <PaymentStatusModal
                status={status}
                message={statusMessage}
                onClose={handleClose}
                onRetry={() => setStatus("idle")}
                onGoProfile={handleGoProfile}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
