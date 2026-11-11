"use client";

import React, { useEffect, useState } from "react";
import { useReportStore } from "@/stores/reportStore";
import { deleteReportEvidence } from "@/lib/storage";
import type { TechnicianReport, ServiceType, ReportResult } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Play,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";

interface ReportDetailProps {
  reportId: string;
  onBack: () => void;
  onNavigateToTask?: (taskId: string) => void;
}

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  INSTALACION: "Instalación",
  AVERIA: "Avería",
  REVISION: "Revisión",
  RETIRO: "Retiro",
  CAMBIO_DE_CABLE: "Cambio de cable",
  CAMBIO_DE_TERMINAL: "Cambio de terminal",
  CAMBIO_ROUTER: "Cambio de router",
  TRASLADO: "Traslado",
  OTROS: "Otros",
};

const RESULT_LABELS: Record<ReportResult, string> = {
  TERMINADO: "Terminado",
  PENDIENTE: "Pendiente",
  NO_SE_PUDO_REALIZAR: "No se pudo realizar",
  OTROS: "Otros",
};

const RESULT_COLORS: Record<ReportResult, string> = {
  TERMINADO: "#16a34a",
  PENDIENTE: "#d97706",
  NO_SE_PUDO_REALIZAR: "#dc2626",
  OTROS: "#6b7280",
};

export default function ReportDetail({
  reportId,
  onBack,
  onNavigateToTask,
}: ReportDetailProps) {
  const { getReport, currentReport, setCurrentReport } = useReportStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const report = await getReport(reportId);
      if (!report) {
        setError("No se encontró el reporte");
      } else {
        setCurrentReport(report);
      }
    } catch (err) {
      console.error("[loadReport] Error:", err);
      setError("No se pudo cargar el reporte");
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isVideo = (fileType: string) => fileType.startsWith("video/");
  const isImage = (fileType: string) => fileType.startsWith("image/");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--text-link)" }} />
      </div>
    );
  }

  if (error || !currentReport) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} style={{ color: "var(--text-error)" }} />
        <p className="mt-4 text-sm" style={{ color: "var(--text-error)" }}>
          {error || "No se encontró el reporte"}
        </p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const report = currentReport;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: `${RESULT_COLORS[report.result]}1a`,
              color: RESULT_COLORS[report.result],
            }}
          >
            {RESULT_LABELS[report.result]}
          </span>
        </div>
      </div>

      {/* Report Information */}
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--text-tertiary)" }}>
          Información del Reporte
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User size={18} style={{ color: "var(--text-tertiary)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Técnico responsable
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {report.createdByName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar size={18} style={{ color: "var(--text-tertiary)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Fecha del servicio
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {new Date(report.serviceDate).toLocaleDateString("es-DO")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={18} style={{ color: "var(--text-tertiary)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Hora del reporte
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {report.reportTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={18} style={{ color: "var(--text-tertiary)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Creado el
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {new Date(report.createdAt).toLocaleString("es-DO")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--text-tertiary)" }}>
          Información del Cliente
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User size={18} style={{ color: "var(--text-tertiary)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Nombre o código
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {report.clientNameOrCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone size={18} style={{ color: "var(--text-tertiary)" }} />
            <div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Teléfono
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {report.clientPhone}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Work Details */}
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--text-tertiary)" }}>
          Trabajo Realizado
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
              Tipo de servicio
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {SERVICE_TYPE_LABELS[report.serviceType]}
            </p>
            {report.serviceType === "OTROS" && report.serviceTypeOther && (
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {report.serviceTypeOther}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
                Hora de llegada
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {report.arrivalTime}
              </p>
            </div>

            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
                Hora de salida
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {report.departureTime}
              </p>
            </div>

            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
                Monto cobrado
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {report.amountCharged
                  ? `$${report.amountCharged.toFixed(2)}`
                  : "No especificado"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location and Evidence */}
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--text-tertiary)" }}>
          Ubicación y Evidencias
        </h2>

        <div className="mb-4">
          <div className="flex items-center gap-3">
            <MapPin size={18} style={{ color: "var(--text-tertiary)" }} />
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
                Ubicación GPS
              </p>
              <a
                href={report.locationGPS.startsWith("http")
                  ? report.locationGPS
                  : `https://www.google.com/maps?q=${report.locationGPS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: "var(--text-link)" }}
              >
                {report.locationGPS}
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {report.evidences.map((evidence) => (
            <div
              key={evidence.id}
              className="p-3 rounded-lg"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isImage(evidence.fileType) ? (
                    <ImageIcon size={16} style={{ color: "var(--text-tertiary)" }} />
                  ) : isVideo(evidence.fileType) ? (
                    <Video size={16} style={{ color: "var(--text-tertiary)" }} />
                  ) : (
                    <Download size={16} style={{ color: "var(--text-tertiary)" }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {evidence.type === "location_photo"
                      ? "Foto del lugar"
                      : "Evidencia del trabajo"}
                  </span>
                </div>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {formatFileSize(evidence.fileSize)}
                </span>
              </div>

              {isImage(evidence.fileType) ? (
                <div className="relative">
                  <img
                    src={evidence.url}
                    alt={evidence.fileName}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={() => setFullscreenImage(evidence.url)}
                  />
                  <a
                    href={evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "white" }}
                  >
                    <Download size={16} />
                  </a>
                </div>
              ) : isVideo(evidence.fileType) ? (
                <video
                  src={evidence.url}
                  controls
                  className="w-full rounded-lg"
                  style={{ maxHeight: "400px" }}
                />
              ) : (
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ color: "var(--text-link)" }}
                >
                  <Download size={16} />
                  Descargar {evidence.fileName}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--text-tertiary)" }}>
          Resultado
        </h2>

        <div className="flex items-center gap-3">
          {report.result === "TERMINADO" ? (
            <CheckCircle size={24} style={{ color: RESULT_COLORS.TERMINADO }} />
          ) : (
            <AlertCircle size={24} style={{ color: RESULT_COLORS[report.result] }} />
          )}
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {RESULT_LABELS[report.result]}
            </p>
            {report.result === "OTROS" && report.resultOther && (
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {report.resultOther}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: "var(--bg-secondary)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
            Declaración confirmada
          </p>
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            La información suministrada corresponde al trabajo realizado y las evidencias adjuntas corresponden a los servicios reportados.
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
            Confirmado el {new Date(report.declarationConfirmedAt).toLocaleString("es-DO")}
          </p>
        </div>
      </div>

      {/* Task Linking */}
      {report.linkedTaskId && (
        <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--text-tertiary)" }}>
            Vinculación
          </h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LinkIcon size={18} style={{ color: "var(--text-link)" }} />
              <div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Vinculado a tarea
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  ID: {report.linkedTaskId}
                </p>
              </div>
            </div>
            {onNavigateToTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToTask(report.linkedTaskId!)}
              >
                Ver tarea
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full transition-colors hover:bg-white/20"
              style={{ color: "white" }}
            >
              <X size={24} />
            </button>
            <img
              src={fullscreenImage}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
