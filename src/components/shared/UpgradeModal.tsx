"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Crown, Sparkles, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
}

const PRO_FEATURES = [
  "Listas ilimitadas",
  "Tareas ilimitadas",
  "Colaboradores ilimitados",
  "Modo oscuro",
  "Estadísticas personales",
  "Calendario avanzado",
];

export function UpgradeModal({
  isOpen,
  onClose,
  feature,
  description,
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push("/pricing");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Crown size={24} className="text-white" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">
                    <Sparkles size={10} />
                    PRO
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-1">Actualiza a Pro</h3>
              <p className="text-blue-100 text-sm">
                Desbloquea {feature} y más funciones premium
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              {description && (
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                  {description}
                </p>
              )}

              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">
                Incluye:
              </p>

              <ul className="space-y-2 mb-6">
                {PRO_FEATURES.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400"
                  >
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-green-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6 p-4 rounded-xl bg-gray-50 dark:bg-slate-800">
                <span className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                  $4.99
                </span>
                <span className="text-gray-500 dark:text-slate-400">/mes</span>
                <span className="ml-auto text-xs text-gray-400">
                  Cancela cuando quieras
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleUpgrade}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                >
                  Ver planes y precios
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Ahora no
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to use the upgrade modal
export function useUpgradeModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [feature, setFeature] = React.useState("");
  const [description, setDescription] = React.useState("");

  const openUpgradeModal = (
    featureName: string,
    desc?: string
  ) => {
    setFeature(featureName);
    setDescription(desc || "");
    setIsOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsOpen(false);
  };

  const UpgradeModalComponent = () => (
    <UpgradeModal
      isOpen={isOpen}
      onClose={closeUpgradeModal}
      feature={feature}
      description={description}
    />
  );

  return {
    openUpgradeModal,
    closeUpgradeModal,
    UpgradeModalComponent,
    isOpen,
  };
}
