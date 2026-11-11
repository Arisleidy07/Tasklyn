"use client";

import React, { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { useReportStore } from "@/stores/reportStore";
import { useTaskStore } from "@/stores/taskStore";
import { uploadReportEvidence } from "@/lib/storage";
import type {
  ServiceType,
  ReportResult,
  TechnicianReport,
  ReportEvidence,
} from "@/types";
import {
  X,
  MapPin,
  Phone,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultTaskId?: string;
}

const SERVICE_TYPES: ServiceType[] = [
  "INSTALACION",
  "AVERIA",
  "REVISION",
  "RETIRO",
  "CAMBIO_DE_CABLE",
  "CAMBIO_DE_TERMINAL",
  "CAMBIO_ROUTER",
  "TRASLADO",
  "OTROS",
];

const RESULTS: ReportResult[] = [
  "TERMINADO",
  "PENDIENTE",
  "NO_SE_PUDO_REALIZAR",
  "OTROS",
];

export default function CreateReportForm({
  onSuccess,
  onCancel,
  defaultTaskId,
}: CreateReportFormProps) {
  const { user } = useAuthStore();
  const { createReport, updateReport } = useReportStore();
  const { getTasksByList } = useTaskStore();

  // Effect to handle default task ID
  useEffect(() => {
    if (defaultTaskId) {
      setLinkedTaskId(defaultTaskId);
    }
  }, [defaultTaskId]);

  // Form state
  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportTime, setReportTime] = useState(
    new Date().toTimeString().slice(0, 5),
  );
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("INSTALACION");
  const [serviceTypeOther, setServiceTypeOther] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [amountCharged, setAmountCharged] = useState("");
  const [locationGPS, setLocationGPS] = useState("");
  const [result, setResult] = useState<ReportResult>("TERMINADO");
  const [resultOther, setResultOther] = useState("");
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>(
    defaultTaskId,
  );
  const [searchTaskQuery, setSearchTaskQuery] = useState("");
  const [showTaskSearch, setShowTaskSearch] = useState(false);

  // File uploads
  const [locationPhoto, setLocationPhoto] = useState<File | null>(null);
  const [workEvidence, setWorkEvidence] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Refs
  const locationPhotoRef = useRef<HTMLInputElement>(null);
  const workEvidenceRef = useRef<HTMLInputElement>(null);

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationGPS(`${latitude},${longitude}`);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(
          "No se pudo obtener la ubicación. Por favor, ingrésala manualmente.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Handle file selection
  const handleLocationPhotoSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocationPhoto(file);
      setUploadErrors((prev) => ({ ...prev, locationPhoto: "" }));
    }
  };

  const handleWorkEvidenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWorkEvidence(file);
      setUploadErrors((prev) => ({ ...prev, workEvidence: "" }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!serviceDate)
      errors.serviceDate = "La fecha del servicio es obligatoria";
    if (!clientName.trim())
      errors.clientName = "El nombre o código del cliente es obligatorio";
    if (!clientPhone.trim()) errors.clientPhone = "El teléfono es obligatorio";
    if (!locationPhoto)
      errors.locationPhoto = "La foto del lugar es obligatoria";
    if (!serviceType) errors.serviceType = "El tipo de servicio es obligatorio";
    if (serviceType === "OTROS" && !serviceTypeOther.trim()) {
      errors.serviceTypeOther = "Describe el tipo de trabajo";
    }
    if (!arrivalTime) errors.arrivalTime = "La hora de llegada es obligatoria";
    if (!departureTime)
      errors.departureTime = "La hora de salida es obligatoria";
    if (!locationGPS.trim()) errors.locationGPS = "La ubicación es obligatoria";
    if (!workEvidence)
      errors.workEvidence = "La evidencia del trabajo es obligatoria";
    if (!result) errors.result = "El resultado es obligatorio";
    if (result === "OTROS" && !resultOther.trim()) {
      errors.resultOther = "Describe el resultado";
    }
    if (!declarationConfirmed) {
      errors.declaration = "Debes confirmar la declaración";
    }

    // Validate time logic
    if (arrivalTime && departureTime) {
      const [arrH, arrM] = arrivalTime.split(":").map(Number);
      const [depH, depM] = departureTime.split(":").map(Number);
      const arrMinutes = arrH * 60 + arrM;
      const depMinutes = depH * 60 + depM;

      // Allow for next day (e.g., 23:00 to 01:00 is valid)
      if (depMinutes < arrMinutes && depMinutes > arrMinutes - 12 * 60) {
        // Less than 12 hours difference seems wrong
        errors.departureTime =
          "La hora de salida parece anterior a la de llegada";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Debes estar autenticado para crear un reporte");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // First create the report to get the ID
      const reportId = await createReport({
        createdBy: user.id,
        createdByName: user.name,
        reportTime,
        serviceDate,
        serviceType,
        serviceTypeOther:
          serviceType === "OTROS" ? serviceTypeOther : undefined,
        clientNameOrCode: clientName.trim(),
        clientPhone: clientPhone.trim(),
        arrivalTime,
        departureTime,
        amountCharged: amountCharged ? parseFloat(amountCharged) : undefined,
        locationGPS: locationGPS.trim(),
        evidences: [], // Will be populated after uploads
        result,
        resultOther: result === "OTROS" ? resultOther : undefined,
        declarationConfirmed: true,
        declarationConfirmedAt: new Date().toISOString(),
        linkedTaskId,
        teamId: undefined, // Can be set based on user's team
      });

      const evidences: ReportEvidence[] = [];

      // Upload location photo
      if (locationPhoto) {
        setUploadProgress((prev) => ({ ...prev, locationPhoto: 0 }));
        try {
          const locationUpload = await uploadReportEvidence(
            reportId,
            "location_photo",
            locationPhoto,
            (progress) => {
              setUploadProgress((prev) => ({
                ...prev,
                locationPhoto: progress,
              }));
            },
          );
          setUploadProgress((prev) => ({ ...prev, locationPhoto: 100 }));
          evidences.push({
            id: `loc-${Date.now()}`,
            type: "location_photo",
            url: locationUpload.url,
            storagePath: locationUpload.storagePath,
            fileName: locationUpload.fileName,
            fileType: locationUpload.fileType,
            fileSize: locationUpload.fileSize,
            uploadedAt: new Date().toISOString(),
          });
        } catch (err) {
          setUploadErrors((prev) => ({
            ...prev,
            locationPhoto:
              err instanceof Error ? err.message : "Error al subir la foto",
          }));
          throw err;
        }
      }

      // Upload work evidence
      if (workEvidence) {
        setUploadProgress((prev) => ({ ...prev, workEvidence: 0 }));
        try {
          const workUpload = await uploadReportEvidence(
            reportId,
            "work_evidence",
            workEvidence,
            (progress) => {
              setUploadProgress((prev) => ({
                ...prev,
                workEvidence: progress,
              }));
            },
          );
          setUploadProgress((prev) => ({ ...prev, workEvidence: 100 }));
          evidences.push({
            id: `work-${Date.now()}`,
            type: "work_evidence",
            url: workUpload.url,
            storagePath: workUpload.storagePath,
            fileName: workUpload.fileName,
            fileType: workUpload.fileType,
            fileSize: workUpload.fileSize,
            uploadedAt: new Date().toISOString(),
          });
        } catch (err) {
          setUploadErrors((prev) => ({
            ...prev,
            workEvidence:
              err instanceof Error
                ? err.message
                : "Error al subir la evidencia",
          }));
          throw err;
        }
      }

      // Update report with evidence metadata
      if (evidences.length > 0) {
        await updateReport(reportId, { evidences });
      }

      // Reset form
      resetForm();
      onSuccess?.();
    } catch (err) {
      console.error("[handleSubmit] Error:", err);
      setError(
        err instanceof Error ? err.message : "No se pudo crear el reporte",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setServiceDate(new Date().toISOString().split("T")[0]);
    setReportTime(new Date().toTimeString().slice(0, 5));
    setClientName("");
    setClientPhone("");
    setServiceType("INSTALACION");
    setServiceTypeOther("");
    setArrivalTime("");
    setDepartureTime("");
    setAmountCharged("");
    setLocationGPS("");
    setResult("TERMINADO");
    setResultOther("");
    setDeclarationConfirmed(false);
    setLinkedTaskId(undefined);
    setLocationPhoto(null);
    setWorkEvidence(null);
    setUploadProgress({});
    setUploadErrors({});
    setValidationErrors({});
    setError(null);
    if (locationPhotoRef.current) locationPhotoRef.current.value = "";
    if (workEvidenceRef.current) workEvidenceRef.current.value = "";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-4 sm:p-6"
    >
      <div className="mb-6">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Nuevo Reporte de Técnico
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Completa todos los campos obligatorios marcados con *
        </p>
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2"
          style={{
            backgroundColor: "var(--bg-error)",
            color: "var(--text-error)",
            border: "1px solid var(--border-color)",
          }}
        >
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Information */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            Información del Reporte
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Fecha del servicio *
              </label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: validationErrors.serviceDate
                    ? "1px solid var(--text-error)"
                    : "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              {validationErrors.serviceDate && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-error)" }}
                >
                  {validationErrors.serviceDate}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Técnico responsable
              </label>
              <input
                type="text"
                value={user?.name || ""}
                disabled
                className="w-full h-11 px-4 rounded-xl text-sm"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-tertiary)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Hora del reporte
              </label>
              <input
                type="time"
                value={reportTime}
                onChange={(e) => setReportTime(e.target.value)}
                className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            Información del Cliente
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Nombre o código del cliente *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: validationErrors.clientName
                    ? "1px solid var(--text-error)"
                    : "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              {validationErrors.clientName && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-error)" }}
                >
                  {validationErrors.clientName}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Teléfono *
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Teléfono del cliente"
                className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: validationErrors.clientPhone
                    ? "1px solid var(--text-error)"
                    : "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              {validationErrors.clientPhone && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-error)" }}
                >
                  {validationErrors.clientPhone}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Foto del lugar (máximo 1) *
            </label>
            <input
              ref={locationPhotoRef}
              type="file"
              accept="image/*"
              onChange={handleLocationPhotoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => locationPhotoRef.current?.click()}
              className="w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors"
              style={{
                borderColor: validationErrors.locationPhoto
                  ? "var(--text-error)"
                  : "var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <Camera size={24} style={{ color: "var(--text-tertiary)" }} />
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {locationPhoto
                  ? locationPhoto.name
                  : "Seleccionar foto del lugar"}
              </span>
            </button>
            {validationErrors.locationPhoto && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-error)" }}
              >
                {validationErrors.locationPhoto}
              </p>
            )}
            {locationPhoto && (
              <div
                className="mt-2 flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={16}
                    style={{ color: "var(--text-success)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {locationPhoto.name} ({formatFileSize(locationPhoto.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationPhoto(null)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-error)" }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {uploadProgress.locationPhoto !== undefined &&
              uploadProgress.locationPhoto < 100 && (
                <div className="mt-2">
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${uploadProgress.locationPhoto}%`,
                        backgroundColor: "var(--text-link)",
                      }}
                    />
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Subiendo foto... {Math.round(uploadProgress.locationPhoto)}%
                  </p>
                </div>
              )}
            {uploadErrors.locationPhoto && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-error)" }}
              >
                {uploadErrors.locationPhoto}
              </p>
            )}
          </div>
        </div>

        {/* Work Details */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            Trabajo Realizado
          </h2>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Tipo de servicio *
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{
                border: validationErrors.serviceType
                  ? "1px solid var(--text-error)"
                  : "1px solid var(--border-input)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {validationErrors.serviceType && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-error)" }}
              >
                {validationErrors.serviceType}
              </p>
            )}
          </div>

          {serviceType === "OTROS" && (
            <div className="mt-4">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Descripción del trabajo *
              </label>
              <textarea
                value={serviceTypeOther}
                onChange={(e) => setServiceTypeOther(e.target.value)}
                placeholder="Describe el tipo de trabajo realizado"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                style={{
                  border: validationErrors.serviceTypeOther
                    ? "1px solid var(--text-error)"
                    : "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              {validationErrors.serviceTypeOther && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-error)" }}
                >
                  {validationErrors.serviceTypeOther}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Schedule and Charge */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            Horario y Cobro
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Hora de llegada *
              </label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: validationErrors.arrivalTime
                    ? "1px solid var(--text-error)"
                    : "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              {validationErrors.arrivalTime && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-error)" }}
                >
                  {validationErrors.arrivalTime}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Hora de salida *
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: validationErrors.departureTime
                    ? "1px solid var(--text-error)"
                    : "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              {validationErrors.departureTime && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-error)" }}
                >
                  {validationErrors.departureTime}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Monto cobrado (opcional)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={amountCharged}
                onChange={(e) => setAmountCharged(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Location and Evidence */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            Ubicación y Evidencias
          </h2>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Ubicación GPS *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationGPS}
                onChange={(e) => setLocationGPS(e.target.value)}
                placeholder="Coordenadas o enlace de Google Maps"
                className="flex-1 h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: validationErrors.locationGPS
                    ? "1px solid var(--text-error)"
                    : "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="h-11 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <MapPin size={16} />
                GPS
              </button>
            </div>
            {validationErrors.locationGPS && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-error)" }}
              >
                {validationErrors.locationGPS}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Foto o video del trabajo realizado (máximo 1) *
            </label>
            <input
              ref={workEvidenceRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleWorkEvidenceSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => workEvidenceRef.current?.click()}
              className="w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors"
              style={{
                borderColor: validationErrors.workEvidence
                  ? "var(--text-error)"
                  : "var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <Upload size={24} style={{ color: "var(--text-tertiary)" }} />
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {workEvidence ? workEvidence.name : "Seleccionar foto o video"}
              </span>
            </button>
            {validationErrors.workEvidence && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-error)" }}
              >
                {validationErrors.workEvidence}
              </p>
            )}
            {workEvidence && (
              <div
                className="mt-2 flex items-center justify-between p-2 rounded-lg"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={16}
                    style={{ color: "var(--text-success)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {workEvidence.name} ({formatFileSize(workEvidence.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkEvidence(null)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-error)" }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {uploadProgress.workEvidence !== undefined &&
              uploadProgress.workEvidence < 100 && (
                <div className="mt-2">
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${uploadProgress.workEvidence}%`,
                        backgroundColor: "var(--text-link)",
                      }}
                    />
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Subiendo evidencia...{" "}
                    {Math.round(uploadProgress.workEvidence)}%
                  </p>
                </div>
              )}
            {uploadErrors.workEvidence && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-error)" }}
              >
                {uploadErrors.workEvidence}
              </p>
            )}
          </div>
        </div>

        {/* Result and Declaration */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            Resultado y Declaración
          </h2>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Resultado *
            </label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value as ReportResult)}
              className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{
                border: validationErrors.result
                  ? "1px solid var(--text-error)"
                  : "1px solid var(--border-input)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            >
              {RESULTS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {validationErrors.result && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-error)" }}
              >
                {validationErrors.result}
              </p>
            )}
          </div>

          {result === "OTROS" && (
            <div className="mt-4">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Descripción del resultado *
              </label>
              <textarea
                value={resultOther}
                onChange={(e) => setResultOther(e.target.value)}
                placeholder="Describe el resultado del trabajo"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                style={{
                  border: validationErrors.resultOther
                    ? "1px solid var(--text-error)"
                    : "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              {validationErrors.resultOther && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-error)" }}
                >
                  {validationErrors.resultOther}
                </p>
              )}
            </div>
          )}

          <div className="mt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationConfirmed}
                onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded"
                style={{ accentColor: "var(--text-link)" }}
              />
              <span
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                Declaro que la información suministrada corresponde al trabajo
                realizado y que las evidencias adjuntas corresponden a los
                servicios reportados *
              </span>
            </label>
            {validationErrors.declaration && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-error)" }}
              >
                {validationErrors.declaration}
              </p>
            )}
          </div>
        </div>

        {/* Optional Task Linking */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            Vinculación Opcional
          </h2>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Vincular a una tarea de Tasklyn (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={linkedTaskId || ""}
                readOnly
                placeholder="ID de la tarea (opcional)"
                className="flex-1 h-11 px-4 rounded-xl text-sm"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-tertiary)",
                }}
              />
              {linkedTaskId && (
                <button
                  type="button"
                  onClick={() => setLinkedTaskId(undefined)}
                  className="h-11 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-error)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <X size={16} />
                  Quitar
                </button>
              )}
            </div>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Esta función permite vincular el reporte a una tarea existente. La
              búsqueda de tareas se implementará en una versión futura.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-end gap-3 pt-4 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            icon={
              isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : undefined
            }
          >
            {isSubmitting ? "Enviando..." : "Enviar Reporte"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
