"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

// Export dynamic config to prevent static generation
export const dynamic = "force-dynamic";

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [error, setError] = useState<string | null>(null);

  const subscriptionId = searchParams.get("subscription_id");
  const token = searchParams.get("token");
  const plan = (searchParams.get("plan") as "pro" | "business") || "pro";

  useEffect(() => {
    if (!subscriptionId || !user) return;

    const captureSubscription = async () => {
      try {
        const response = await fetch("/api/subscription/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId,
            userId: user.id,
            plan,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to activate subscription");
        }

        setStatus("success");
      } catch (err) {
        console.error("Error capturing subscription:", err);
        setError((err as Error).message);
        setStatus("error");
      }
    };

    captureSubscription();
  }, [subscriptionId, user, plan]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center"
      >
        {status === "processing" && (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 size={32} className="text-blue-600 animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              Activando tu suscripción...
            </h1>
            <p className="text-gray-500 dark:text-slate-400">
              Estamos confirmando tu pago con PayPal. Esto solo tomará un
              momento.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 size={32} className="text-green-600" />
            </motion.div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              ¡Bienvenido a Tasklyn {plan === "business" ? "Business" : "Pro"}!
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
              Tu suscripción ha sido activada exitosamente. Ya tienes acceso a
              todas las funciones premium.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              >
                Ir al Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/settings")}
                className="w-full"
              >
                Ver configuración
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              Algo salió mal
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mb-4">
              {error ||
                "No pudimos activar tu suscripción. Por favor contacta soporte."}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/pricing")}
                className="w-full"
              >
                Volver a planes
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/support")}
                className="w-full"
              >
                Contactar soporte
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Loader2 size={32} className="text-blue-600 animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              Cargando...
            </h1>
          </div>
        </div>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
