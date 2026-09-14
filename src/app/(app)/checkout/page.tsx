// ============================================
// TASKLYN — PayPal Subscription Checkout Page
// ============================================
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { auth } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import PayPalCheckout from "@/components/paypal/PayPalCheckout";
import PaymentStatusModal from "@/components/paypal/PaymentStatusModal";
import Button from "@/components/ui/Button";
import { AVAILABLE_PLANS } from "@/types/subscription";
import { usePayPalPlans } from "@/hooks/usePayPalPlans";
import { Shield, ArrowLeft, CreditCard, Check } from "lucide-react";
import { motion } from "framer-motion";

type PaymentStatus = "idle" | "processing" | "success" | "error" | "cancelled";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { plans, loading: plansLoading, error: plansError } = usePayPalPlans();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const planId = (searchParams.get("plan") as "pro" | "business") ?? "pro";
  const plan = AVAILABLE_PLANS.find((p) => p.id === planId);
  const paypalPlanId = planId === "business" ? plans?.business : plans?.pro;

  useEffect(() => {
    if (!plan) {
      router.replace("/pricing");
    }
  }, [plan, router]);

  const verifySubscription = async (subId: string) => {
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
        body: JSON.stringify({ subscriptionId: subId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to verify subscription");
      }

      const data = (await res.json()) as {
        success: boolean;
        status: string;
      };

      if (data.success && data.status === "ACTIVE") {
        setStatus("success");
      } else {
        setStatusMessage(`Estado actual: ${data.status}`);
        setStatus("processing");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification error";
      setStatusMessage(msg);
      setStatus("error");
    }
  };

  if (!plan || !user) return null;

  const handleSubscriptionCreated = (subId: string) => {
    setSubscriptionId(subId);
    void verifySubscription(subId);
  };

  const handleError = (message: string) => {
    setStatusMessage(message);
    setStatus("error");
  };

  const handleCancel = () => {
    setStatusMessage(undefined);
    setStatus("cancelled");
  };

  const handleRetry = () => {
    setStatus("idle");
    setStatusMessage(undefined);
    setSubscriptionId(null);
  };

  return (
    <>
      <Header
        title="Checkout"
        description="Completa tu suscripción de forma segura"
        showMenuButton={true}
      />

      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6 shadow-sm"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/pricing")}
            icon={<ArrowLeft size={14} />}
            className="mb-4 -ml-2"
          >
            Volver a planes
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div>
              <h1
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {plan.name}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {plan.description}
              </p>
            </div>
          </div>

          <div
            className="flex items-baseline gap-1 mb-6 p-4 rounded-xl"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <span
              className="text-3xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              ${plan.price}
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              /mes
            </span>
          </div>

          <div className="mb-6 space-y-2">
            {plan.features.slice(0, 4).map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <Check size={14} className="text-blue-600 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {status === "idle" ? (
            <PayPalCheckout
              paypalPlanId={paypalPlanId ?? ""}
              onSubscriptionCreated={handleSubscriptionCreated}
              onError={handleError}
            />
          ) : (
            <PaymentStatusModal
              status={status}
              message={statusMessage}
              onClose={() => router.push("/pricing")}
              onRetry={handleRetry}
              onGoProfile={() => router.push("/profile?tab=invoices")}
            />
          )}

          <div
            className="mt-6 flex items-start gap-2 text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Shield size={12} className="flex-shrink-0 mt-0.5" />
            <span>
              La suscripción se procesa directamente con PayPal. Puedes
              cancelarla desde tu perfil en cualquier momento.
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
}
