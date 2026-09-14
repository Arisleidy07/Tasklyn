// ============================================
// TASKLYN — Payment status modal
// Sound + confetti for success; colored states.
// ============================================
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Confetti from "./Confetti";
import { playPaymentSound } from "@/lib/sounds";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Receipt,
} from "lucide-react";

type PaymentStatus = "processing" | "success" | "error" | "cancelled" | null;

interface PaymentStatusModalProps {
  status: PaymentStatus;
  message?: string;
  onClose?: () => void;
  onRetry?: () => void;
  onGoProfile?: () => void;
}

const statusConfig = {
  processing: {
    icon: Loader2,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-600/10",
    borderClass: "border-blue-600/20",
    title: "Procesando pago",
    description:
      "Estamos verificando tu transacción con PayPal. No cierres esta ventana.",
    primary: null,
    secondary: null,
    colorLabel: "Procesando",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    title: "Pago exitoso",
    description:
      "Tu plan ha sido activado. Hemos generado tu factura y está disponible en tu perfil.",
    primary: "Ir a mi perfil",
    secondary: "Cerrar",
    colorLabel: "Aprobado",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-500",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/20",
    title: "No se pudo procesar el pago",
    description:
      "Ocurrió un error con PayPal. No se ha realizado ningún cargo. Puedes intentarlo de nuevo.",
    primary: "Intentar de nuevo",
    secondary: "Cerrar",
    colorLabel: "Error",
  },
  cancelled: {
    icon: AlertCircle,
    iconClass: "text-orange-500",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/20",
    title: "Pago cancelado",
    description:
      "Cancelaste el proceso de pago. Tu plan actual sigue activo y no se realizó ningún cargo.",
    primary: null,
    secondary: "Volver",
    colorLabel: "Cancelado",
  },
};

export default function PaymentStatusModal({
  status,
  message,
  onClose,
  onRetry,
  onGoProfile,
}: PaymentStatusModalProps) {
  useEffect(() => {
    if (!status) return;
    playPaymentSound(status);
  }, [status]);

  if (!status) return null;

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <>
      <Confetti active={status === "success"} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl p-6 sm:p-8 border shadow-xl"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${config.bgClass} border ${config.borderClass}`}
            >
              <Icon
                size={28}
                className={`${config.iconClass} ${status === "processing" ? "animate-spin" : ""}`}
              />
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3 ${config.bgClass} border ${config.borderClass}`}
            >
              <span className={config.iconClass}>{config.colorLabel}</span>
            </div>

            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {config.title}
            </h2>

            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {message ?? config.description}
            </p>

            {status === "success" && (
              <div
                className="flex items-center gap-3 w-full p-3 rounded-xl mb-6 text-left"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-tertiary)" }}
                >
                  <Receipt size={16} className="text-blue-600" />
                </div>
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Factura generada
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Disponible en tu historial de pagos.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {config.primary && onRetry && onGoProfile && (
                <>
                  <Button
                    onClick={status === "success" ? onGoProfile : onRetry}
                    className="flex-1 h-11 rounded-xl"
                  >
                    {config.primary}
                  </Button>
                  {config.secondary && onClose && (
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 h-11 rounded-xl"
                    >
                      {config.secondary}
                    </Button>
                  )}
                </>
              )}
              {config.primary && onRetry && !onGoProfile && (
                <>
                  <Button onClick={onRetry} className="flex-1 h-11 rounded-xl">
                    {config.primary}
                  </Button>
                  {config.secondary && onClose && (
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 h-11 rounded-xl"
                    >
                      {config.secondary}
                    </Button>
                  )}
                </>
              )}
              {!config.primary && onClose && (
                <Button onClick={onClose} className="w-full h-11 rounded-xl">
                  {config.secondary}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
