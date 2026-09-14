// ============================================
// TASKLYN — PayPal Subscription Modal
// ============================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PayPalCheckout from "./PayPalCheckout";
import PaymentStatusModal from "./PaymentStatusModal";
import { usePayPalPlans } from "@/hooks/usePayPalPlans";
import { AVAILABLE_PLANS } from "@/types/subscription";
import { X, CreditCard, Check } from "lucide-react";
import { auth } from "@/lib/firebase";

type PaymentStatus =
  | "idle"
  | "processing"
  | "success"
  | "error"
  | "cancelled";

interface SubscriptionModalProps {
  planId: "pro" | "business";
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({
  planId,
  isOpen,
  onClose,
}: SubscriptionModalProps) {
  const router = useRouter();
  const { plans, loading, error } = usePayPalPlans();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  const plan = AVAILABLE_PLANS.find((p) => p.id === planId);
  const paypalPlanId = planId === "business" ? plans?.business : plans?.pro;

  const verifySubscription = async (subscriptionId: string) => {
    setStatus("processing");
    try {
      const fbUser = auth.currentUser;
      const token = fbUser ? await fbUser.getIdToken() : null;
      if (!token) throw new Error("User not authenticated");

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
        throw new Error(data.error ?? "Failed to verify");
      }

      const data = (await res.json()) as {
        success: boolean;
        status: string;
      };

      if (data.success && data.status === "ACTIVE") {
        setStatus("success");
      } else {
        setStatusMessage(`Estado: ${data.status}`);
        setStatus("processing");
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Error");
      setStatus("error");
    }
  };

  const handleSubscriptionCreated = (subId: string) => {
    void verifySubscription(subId);
  };

  const handleError = (msg: string) => {
    setStatusMessage(msg);
    setStatus("error");
  };

  const handleClose = () => {
    setStatus("idle");
    setStatusMessage(undefined);
    onClose();
  };

  if (!plan) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="w-full max-w-md rounded-2xl p-6 border shadow-xl relative"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-color)",
            }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-black/5"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X size={18} />
            </button>

            {status === "idle" ? (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                    <CreditCard size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {plan.name}
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      ${plan.price} USD/mes
                    </p>
                  </div>
                </div>

                <div className="mb-5 space-y-2">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <Check
                        size={14}
                        className="text-blue-600 flex-shrink-0"
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {loading ? (
                  <p
                    className="text-sm text-center py-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Cargando...
                  </p>
                ) : error ? (
                  <p className="text-sm text-red-500 text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    {error}
                  </p>
                ) : (
                  <PayPalCheckout
                    paypalPlanId={paypalPlanId ?? ""}
                    onSubscriptionCreated={handleSubscriptionCreated}
                    onError={handleError}
                  />
                )}

                <p
                  className="mt-4 text-xs text-center"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Puedes cancelar en cualquier momento desde tu perfil.
                </p>
              </>
            ) : (
              <PaymentStatusModal
                status={status}
                message={statusMessage}
                onClose={handleClose}
                onRetry={() => setStatus("idle")}
                onGoProfile={() => {
                  handleClose();
                  router.push("/profile");
                }}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
