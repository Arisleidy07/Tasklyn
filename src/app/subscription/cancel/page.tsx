"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-amber-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Suscripción cancelada
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mb-6">
          Has cancelado el proceso de suscripción. No te preocupes, no se ha
          realizado ningún cargo. Puedes intentarlo nuevamente cuando quieras.
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => router.push("/pricing")}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          >
            Ver planes nuevamente
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full"
          >
            Ir al Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
