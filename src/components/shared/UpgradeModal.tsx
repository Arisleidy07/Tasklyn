"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Crown, Check, Zap, ArrowRight } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  description?: string;
}

const PRO_FEATURES = [
  "Equipos ilimitados",
  "Listas ilimitadas",
  "Miembros ilimitados",
  "Historial avanzado",
  "Dashboard premium",
  "Estadísticas avanzadas",
  "Ranking en tiempo real",
  "Productividad del equipo",
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
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
            <Crown size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Límite alcanzado
              </h3>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border border-blue-500/20"
                style={{ color: "#2563eb" }}
              >
                <Zap size={9} />
                Pro
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {description ||
                (feature
                  ? `Tu plan actual ha alcanzado el límite para ${feature}.`
                  : "Tu plan actual ha alcanzado el límite permitido.")}
            </p>
          </div>
        </div>

        {/* Features */}
        <div
          className="rounded-xl p-4 space-y-2.5"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            Actualiza a Tasklyn Pro para:
          </p>
          {PRO_FEATURES.map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <Check size={10} style={{ color: "#059669" }} />
              </div>
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Price hint */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl border"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Tasklyn Pro
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Cancela cuando quieras
            </p>
          </div>
          <div className="text-right">
            <span
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              $4.99
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              /mes
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Ahora no
          </Button>
          <Button
            onClick={handleUpgrade}
            icon={<ArrowRight size={15} />}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 border-0"
          >
            Actualizar plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function useUpgradeModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [feature, setFeature] = React.useState("");
  const [description, setDescription] = React.useState("");

  const openUpgradeModal = (featureName: string, desc?: string) => {
    setFeature(featureName);
    setDescription(desc || "");
    setIsOpen(true);
  };

  const closeUpgradeModal = () => setIsOpen(false);

  const UpgradeModalComponent = () => (
    <UpgradeModal
      isOpen={isOpen}
      onClose={closeUpgradeModal}
      feature={feature}
      description={description}
    />
  );

  return { openUpgradeModal, closeUpgradeModal, UpgradeModalComponent, isOpen };
}
