// ============================================
// TASKLYN — Subscription manager (profile)
// ============================================
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import type { Subscription } from "@/types/payment";
import { Loader2, Crown, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SubscriptionManager({ userId }: { userId: string }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const fbUser = auth.currentUser;
        if (!fbUser) return;
        const token = await fbUser.getIdToken();
        const res = await fetch(
          "/api/paypal/get-subscription-by-user?userId=" + userId,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as { subscription: Subscription | null };
        setSubscription(data.subscription);
      } catch {
        // No active subscription
      } finally {
        setLoading(false);
      }
    }

    void fetchSubscription();
  }, [userId]);

  async function handleCancel() {
    if (!subscription) return;
    setCancelling(true);
    setError(null);
    setSuccess(null);
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error("Not authenticated");
      const token = await fbUser.getIdToken();
      const res = await fetch("/api/paypal/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscriptionId: subscription.paypalSubscriptionId,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Cancel failed");
      }

      setSubscription({ ...subscription, status: "CANCELLED" });
      setSuccess("Suscripción cancelada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={18} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!subscription) return null;

  const isActive = subscription.status === "ACTIVE";

  return (
    <div
      className="p-4 rounded-xl border mb-6"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {isActive ? (
          <CheckCircle2 size={16} className="text-emerald-500" />
        ) : (
          <AlertCircle size={16} className="text-amber-500" />
        )}
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Suscripción {subscription.planId === "business" ? "Business" : "Pro"}
        </span>
      </div>

      <div
        className="text-xs mb-4"
        style={{ color: "var(--text-secondary)" }}
      >
        <p>
          Estado: <span className="font-medium">{subscription.status}</span>
        </p>
        <p>
          Monto: ${subscription.amount.toFixed(2)} {subscription.currency}/mes
        </p>
        {subscription.nextBillingDate && (
          <p>
            Próximo cobro: {new Date(subscription.nextBillingDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {isActive && (
        <Button
          variant="danger"
          size="sm"
          isLoading={cancelling}
          onClick={handleCancel}
          className="h-9"
        >
          Cancelar suscripción
        </Button>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-500 mt-2">{success}</p>
      )}
    </div>
  );
}
