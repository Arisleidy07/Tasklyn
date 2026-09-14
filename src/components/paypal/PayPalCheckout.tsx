// ============================================
// TASKLYN — PayPal Subscriptions Checkout Button
// ============================================
"use client";

import { useEffect, useRef, useState } from "react";
import { usePayPal } from "@/hooks/usePayPal";
import { Loader2 } from "lucide-react";

interface PayPalCheckoutProps {
  paypalPlanId: string;
  onSubscriptionCreated?: (subscriptionId: string) => void;
  onError?: (message: string) => void;
}

export default function PayPalCheckout({
  paypalPlanId,
  onSubscriptionCreated,
  onError,
}: PayPalCheckoutProps) {
  const { isLoading, error, paypal } = usePayPal();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paypal || !buttonRef.current || !paypalPlanId) return;

    const button = paypal.Buttons({
      style: {
        color: "blue",
        shape: "rect",
        layout: "vertical",
        label: "subscribe",
        height: 45,
      },
      createSubscription: (_data, actions) => {
        return actions.subscription.create({
          plan_id: paypalPlanId,
        });
      },
      onApprove: (data) => {
        if (data?.subscriptionID) {
          onSubscriptionCreated?.(data.subscriptionID);
        }
      },
      onCancel: () => {
        setGeneralError("Suscripción cancelada");
      },
      onError: (err) => {
        const msg = err.message ?? "PayPal error";
        setGeneralError(msg);
        onError?.(msg);
      },
    });

    button.render(buttonRef.current).catch((err: Error) => {
      setGeneralError(err.message ?? "PayPal button render error");
      onError?.(err.message ?? "PayPal button render error");
    });

    return () => {
      try {
        button.close();
      } catch {
        // Ignore
      }
    };
  }, [paypal, paypalPlanId, onSubscriptionCreated, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || generalError) {
    return (
      <p className="text-sm text-red-500 text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        {generalError ?? error?.message ?? "PayPal no disponible"}
      </p>
    );
  }

  if (!paypalPlanId) {
    return (
      <p className="text-sm text-red-500 text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        Plan de PayPal no configurado.
      </p>
    );
  }

  return (
    <div
      ref={buttonRef}
      className="min-h-[45px] flex items-center justify-center"
    />
  );
}
