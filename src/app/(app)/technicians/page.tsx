"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import CreateReportForm from "@/components/reports/CreateReportForm";
import ReportsList from "@/components/reports/ReportsList";
import ReportDetail from "@/components/reports/ReportDetail";
import type { TechnicianReport } from "@/types";
import { Plus, FileText, Shield } from "lucide-react";
import { motion } from "framer-motion";

type View = "home" | "create" | "my-reports" | "supervision" | "detail";

export default function TechniciansPage() {
  const { user } = useAuthStore();
  const [view, setView] = useState<View>("home");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleReportClick = (report: TechnicianReport) => {
    setSelectedReportId(report.id);
    setView("detail");
  };

  const handleBackFromDetail = () => {
    setSelectedReportId(null);
    setView("my-reports");
  };

  const handleNavigateToTask = (taskId: string) => {
    // Navigate to task detail
    window.location.href = `/lists/${taskId}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Debes estar autenticado para acceder a esta sección
        </p>
      </div>
    );
  }

  if (view === "create") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
        <CreateReportForm
          onSuccess={() => setView("my-reports")}
          onCancel={() => setView("home")}
        />
      </div>
    );
  }

  if (view === "detail" && selectedReportId) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
        <ReportDetail
          reportId={selectedReportId}
          onBack={handleBackFromDetail}
          onNavigateToTask={handleNavigateToTask}
        />
      </div>
    );
  }

  if (view === "my-reports") {
    return (
      <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="mb-4">
          <button
            onClick={() => setView("home")}
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            ← Volver
          </button>
        </div>
        <ReportsList viewMode="my" onReportClick={handleReportClick} />
      </div>
    );
  }

  if (view === "supervision") {
    return (
      <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="mb-4">
          <button
            onClick={() => setView("home")}
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            ← Volver
          </button>
        </div>
        <ReportsList viewMode="supervision" onReportClick={handleReportClick} />
      </div>
    );
  }

  // Home view
  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Técnicos
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Gestión de reportes diarios de técnicos
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* New Report */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView("create")}
            className="p-6 rounded-xl text-left transition-colors"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--bg-info)" }}>
              <Plus size={24} style={{ color: "var(--text-link)" }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Nuevo Reporte
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Crear un nuevo reporte diario de técnico
            </p>
          </motion.button>

          {/* My Reports */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView("my-reports")}
            className="p-6 rounded-xl text-left transition-colors"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--bg-info)" }}>
              <FileText size={24} style={{ color: "var(--text-link)" }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Mis Reportes
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Ver todos mis reportes enviados
            </p>
          </motion.button>

          {/* Supervision */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView("supervision")}
            className="p-6 rounded-xl text-left transition-colors"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "var(--bg-info)" }}>
              <Shield size={24} style={{ color: "var(--text-link)" }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Supervisión
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Ver reportes del equipo (solo supervisores)
            </p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
