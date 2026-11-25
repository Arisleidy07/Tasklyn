"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { useReportStore } from "@/stores/reportStore";
import { useListStore } from "@/stores/listStore";
import { useTeamStore } from "@/stores/teamStore";
import {
  uploadReportEvidence,
  type ReportEvidenceUploadResult,
} from "@/lib/storage";
import { subscribeToListTasks } from "@/lib/firestore";
import type { Unsubscribe as FsUnsubscribe } from "firebase/firestore";
import type {
  Task,
  ServiceType,
  ReportResult,
  ReportEvidence,
} from "@/types";
import {
  X,
  MapPin,
  Camera,
  Upload,
  AlertCircle,
  Loader2,
  Search,
  ChevronRight,
  ExternalLink,
  Link2,
  Film,
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

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  error?: string;
  evidence?: ReportEvidence; // set once uploaded to Storage
}

interface SelectedTask {
  id: string;
  title: string;
  listId: string;
  listName: string;
  teamId?: string;
}

function toLocalISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function genFileId() {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDuration(arrival?: string, departure?: string): string | null {
  if (!arrival || !departure) return null;
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  if ([ah, am, dh, dm].some(isNaN)) return null;
  let mins = dh * 60 + dm - (ah * 60 + am);
  if (mins < 0) mins += 24 * 60; // overnight service
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

// Accepts a Google Maps URL or raw "lat,lng" coordinates; returns a usable
// maps URL or null when the input is neither.
function resolveMapsUrl(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(v)) {
    return `https://www.google.com/maps?q=${v.replace(/\s/g, "")}`;
  }
  try {
    const u = new URL(v.startsWith("http") ? v : `https://${v}`);
    const host = u.hostname.toLowerCase();
    const isMaps =
      host.includes("google.") ||
      host === "maps.app.goo.gl" ||
      host.endsWith("goo.gl") ||
      host.includes("maps");
    return isMaps ? u.toString() : null;
  } catch {
    return null;
  }
}

export default function CreateReportForm({
  onSuccess,
  onCancel,
  defaultTaskId,
}: CreateReportFormProps) {
  const { user } = useAuthStore();
  const { createReport, updateReport } = useReportStore();
  const { lists } = useListStore();
  const { teams } = useTeamStore();

  // ---- Form state ----
  const [serviceDate, setServiceDate] = useState(() =>
    toLocalISODate(new Date()),
  );
  const [reportTime, setReportTime] = useState(() =>
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResult>("TERMINADO");
  const [resultOther, setResultOther] = useState("");
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const [linkedTask, setLinkedTask] = useState<SelectedTask | undefined>(
    undefined,
  );
  const [reportTeamId, setReportTeamId] = useState<string | undefined>(
    undefined,
  );

  // ---- Multi-file state ----
  const [locationPhotos, setLocationPhotos] = useState<PendingFile[]>([]);
  const [workFiles, setWorkFiles] = useState<PendingFile[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxVideo, setLightboxVideo] = useState<string | null>(null);

  // ---- Task picker state ----
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [pickerTeamId, setPickerTeamId] = useState<string | null>(null);
  const [pickerListId, setPickerListId] = useState<string | null>(null);
  const [pickerTasks, setPickerTasks] = useState<Task[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const taskUnsubRef = useRef<FsUnsubscribe | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittedReportIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const locationPhotoRef = useRef<HTMLInputElement>(null);
  const workEvidenceRef = useRef<HTMLInputElement>(null);

  // User's teams (store already filters to teams the user belongs to)
  const userTeams = useMemo(
    () => teams.filter((t) => t.memberIds?.includes(user?.id || "")),
    [teams, user?.id],
  );

  // Default report team: linked task's team, first user team, or undefined
  useEffect(() => {
    if (reportTeamId || userTeams.length === 0) return;
    setReportTeamId(userTeams[0].id);
  }, [userTeams, reportTeamId]);

  // Default task link
  useEffect(() => {
    if (defaultTaskId && !linkedTask) {
      // Resolve title async via lists/tasks stores is complex; keep id and
      // let the picker fill details. Store minimal selection.
      setLinkedTask({
        id: defaultTaskId,
        title: "Tarea vinculada",
        listId: "",
        listName: "",
      });
    }
  }, [defaultTaskId, linkedTask]);

  // ---- File helpers ----
  const makePendingFiles = (files: FileList | null, kind: "photo" | "work") => {
    if (!files?.length) return;
    const items: PendingFile[] = Array.from(files).map((file) => ({
      id: genFileId(),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
    }));
    if (kind === "photo") {
      setLocationPhotos((prev) => [...prev, ...items]);
      setValidationErrors((v) => ({ ...v, locationPhotos: "" }));
    } else {
      setWorkFiles((prev) => [...prev, ...items]);
      setValidationErrors((v) => ({ ...v, workEvidence: "" }));
    }
  };

  const removePendingFile = (kind: "photo" | "work", id: string) => {
    const revoke = (f: PendingFile) => URL.revokeObjectURL(f.previewUrl);
    if (kind === "photo") {
      setLocationPhotos((prev) => {
        prev.filter((f) => f.id === id).forEach(revoke);
        return prev.filter((f) => f.id !== id);
      });
    } else {
      setWorkFiles((prev) => {
        prev.filter((f) => f.id === id).forEach(revoke);
        return prev.filter((f) => f.id !== id);
      });
    }
  };

  const revokeAllPreviews = () => {
    [...locationPhotos, ...workFiles].forEach((f) =>
      URL.revokeObjectURL(f.previewUrl),
    );
  };

  // ---- GPS / Maps ----
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationGPS(
          `https://www.google.com/maps?q=${latitude},${longitude}`,
        );
        setLocationError(null);
      },
      () => {
        setError(
          "No se pudo obtener la ubicación. Pega un enlace de Google Maps.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const mapsUrl = useMemo(() => resolveMapsUrl(locationGPS), [locationGPS]);

  // ---- Task picker ----
  const pickerLists = useMemo(
    () =>
      pickerTeamId
        ? lists.filter((l) => l.teamId === pickerTeamId)
        : lists.filter((l) => !l.teamId),
    [lists, pickerTeamId],
  );

  useEffect(() => {
    if (!showTaskPicker) return;
    if (!pickerTeamId && userTeams.length > 0) {
      setPickerTeamId(userTeams[0].id);
    }
    if (!pickerListId && pickerLists.length > 0) {
      setPickerListId(pickerLists[0].id);
    }
  }, [showTaskPicker, pickerTeamId, pickerLists, userTeams]);

  // Real-time tasks subscription for the selected list
  useEffect(() => {
    if (!showTaskPicker || !pickerListId) {
      setPickerTasks([]);
      return;
    }
    setPickerLoading(true);
    taskUnsubRef.current?.();
    taskUnsubRef.current = subscribeToListTasks(pickerListId, (tasks) => {
      setPickerTasks(tasks);
      setPickerLoading(false);
    });
    return () => {
      taskUnsubRef.current?.();
      taskUnsubRef.current = null;
    };
  }, [showTaskPicker, pickerListId]);

  const filteredPickerTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    if (!q) return pickerTasks;
    return pickerTasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [pickerTasks, taskSearch]);

  const selectTask = (task: Task) => {
    const list = lists.find((l) => l.id === task.listId);
    setLinkedTask({
      id: task.id,
      title: task.title,
      listId: task.listId,
      listName: list?.name || "Lista",
      teamId: list?.teamId || pickerTeamId || undefined,
    });
    if (list?.teamId) setReportTeamId(list.teamId);
    setShowTaskPicker(false);
  };

  // ---- Validation ----
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!serviceDate)
      errors.serviceDate = "La fecha del servicio es obligatoria";
    if (!clientName.trim())
      errors.clientName = "El nombre o código del cliente es obligatorio";
    if (!clientPhone.trim()) errors.clientPhone = "El teléfono es obligatorio";
    if (locationPhotos.length === 0)
      errors.locationPhotos = "Añade al menos una foto del lugar";
    if (!serviceType) errors.serviceType = "El tipo de servicio es obligatorio";
    if (serviceType === "OTROS" && !serviceTypeOther.trim()) {
      errors.serviceTypeOther = "Describe el tipo de trabajo";
    }
    if (!arrivalTime) errors.arrivalTime = "La hora de llegada es obligatoria";
    if (!departureTime)
      errors.departureTime = "La hora de salida es obligatoria";
    if (locationGPS.trim() && !mapsUrl) {
      errors.locationGPS =
        "Ingresa un enlace válido de Google Maps o coordenadas";
    }
    if (workFiles.length === 0)
      errors.workEvidence = "Adjunta al menos una foto o video del trabajo";
    if (!result) errors.result = "El resultado es obligatorio";
    if (result === "OTROS" && !resultOther.trim()) {
      errors.resultOther = "Describe el resultado";
    }
    if (!declarationConfirmed) {
      errors.declaration = "Debes confirmar la declaración";
    }

    if (arrivalTime && departureTime) {
      const [arrH, arrM] = arrivalTime.split(":").map(Number);
      const [depH, depM] = departureTime.split(":").map(Number);
      const arrMinutes = arrH * 60 + arrM;
      const depMinutes = depH * 60 + depM;
      if (depMinutes < arrMinutes && depMinutes > arrMinutes - 12 * 60) {
        errors.departureTime =
          "La hora de salida parece anterior a la de llegada";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Debes estar autenticado para crear un reporte");
      return;
    }
    if (!validateForm()) return;

    // Read-only members cannot submit reports
    const reportTeam = userTeams.find((t) => t.id === reportTeamId);
    const myRole =
      reportTeam?.owner === user.id
        ? "owner"
        : reportTeam?.members?.find((m) => m.userId === user.id)?.role;
    if (reportTeam && myRole === "viewer") {
      setError("Tu rol en este equipo es de solo lectura.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    const reportPayload = {
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
      locationGPS: mapsUrl || locationGPS.trim(),
      result,
      resultOther: result === "OTROS" ? resultOther : undefined,
      declarationConfirmed: true,
      declarationConfirmedAt: new Date().toISOString(),
      linkedTaskId: linkedTask?.id,
      linkedTaskTitle: linkedTask?.title,
      linkedTaskListName: linkedTask?.listName || undefined,
      linkedTaskListId: linkedTask?.listId || undefined,
      teamId: reportTeamId,
    };

    try {
      // Reuse the already-created report on retry so files are not orphaned
      // and no duplicate report is written to Firestore.
      let reportId = submittedReportIdRef.current;
      if (reportId) {
        await updateReport(reportId, reportPayload);
      } else {
        reportId = await createReport({
          ...reportPayload,
          evidences: [],
        });
        submittedReportIdRef.current = reportId;
      }

      const setFileEvidence = (
        kind: "photo" | "work",
        id: string,
        evidence: ReportEvidence,
      ) => {
        const mark = (list: PendingFile[]) =>
          list.map((f) => (f.id === id ? { ...f, evidence } : f));
        if (kind === "photo") setLocationPhotos(mark);
        else setWorkFiles(mark);
      };

      const allFiles: Array<{
        item: PendingFile;
        type: "location_photo" | "work_evidence";
      }> = [
        ...locationPhotos.map((item) => ({
          item,
          type: "location_photo" as const,
        })),
        ...workFiles.map((item) => ({
          item,
          type: "work_evidence" as const,
        })),
      ];

      for (const { item, type } of allFiles) {
        const kind = type === "location_photo" ? "photo" : "work";
        if (item.evidence) continue; // already uploaded on a previous attempt
        const setProg = (p: number) => {
          const update = (list: PendingFile[]) =>
            list.map((f) => (f.id === item.id ? { ...f, progress: p } : f));
          if (kind === "photo") setLocationPhotos(update);
          else setWorkFiles(update);
        };
        try {
          setProg(0);
          const up: ReportEvidenceUploadResult = await uploadReportEvidence(
            reportId,
            type,
            item.file,
            setProg,
          );
          setProg(100);
          const evidence: ReportEvidence = {
            id: `${type}-${item.id}`,
            type,
            url: up.url,
            storagePath: up.storagePath,
            fileName: up.fileName,
            fileType: up.fileType,
            fileSize: up.fileSize,
            uploadedAt: new Date().toISOString(),
          };
          setFileEvidence(kind, item.id, evidence);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Error al subir el archivo";
          const markErr = (list: PendingFile[]) =>
            list.map((f) =>
              f.id === item.id ? { ...f, error: msg } : f,
            );
          if (kind === "photo") setLocationPhotos(markErr);
          else setWorkFiles(markErr);
          throw err;
        }
      }

      const evidences = [
        ...locationPhotos.map((f) => f.evidence),
        ...workFiles.map((f) => f.evidence),
      ].filter((e): e is ReportEvidence => !!e);

      if (evidences.length > 0) {
        await updateReport(reportId, { evidences });
      }

      revokeAllPreviews();
      submittedReportIdRef.current = null;
      resetForm();
      onSuccess?.();
    } catch (err) {
      console.error("[handleSubmit] Error:", err);
      setError(
        err instanceof Error
          ? `No se pudo enviar el reporte: ${err.message}`
          : "No se pudo crear el reporte",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setServiceDate(toLocalISODate(new Date()));
    setReportTime(new Date().toTimeString().slice(0, 5));
    setClientName("");
    setClientPhone("");
    setServiceType("INSTALACION");
    setServiceTypeOther("");
    setArrivalTime("");
    setDepartureTime("");
    setAmountCharged("");
    setLocationGPS("");
    setLocationError(null);
    setResult("TERMINADO");
    setResultOther("");
    setDeclarationConfirmed(false);
    setLinkedTask(undefined);
    setLocationPhotos([]);
    setWorkFiles([]);
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

  const duration = formatDuration(arrivalTime, departureTime);
  const isVideoFile = (f: File) => f.type.startsWith("video/");

  // Reusable file-grid renderer
  const renderFileGrid = (
    files: PendingFile[],
    kind: "photo" | "work",
    errorKey: string,
  ) => (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
        {files.map((item) => (
          <div
            key={item.id}
            className="relative aspect-square rounded-xl overflow-hidden group"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            {isVideoFile(item.file) ? (
              <video
                src={item.previewUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() =>
                  isVideoFile(item.file)
                    ? setLightboxVideo(item.previewUrl)
                    : setLightboxUrl(item.previewUrl)
                }
              />
            )}
            {isVideoFile(item.file) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Film size={20} className="text-white" />
              </div>
            )}
            {/* progress / remove overlay */}
            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
              {item.progress > 0 && item.progress < 100 ? (
                <div className="h-1 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              ) : (
                <p className="text-[10px] text-white/90 truncate">
                  {formatFileSize(item.file.size)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removePendingFile(kind, item.id)}
              disabled={isSubmitting}
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Eliminar archivo"
            >
              <X size={14} />
            </button>
            {item.error && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1">
                <span className="text-[10px] text-red-300 text-center">
                  {item.error}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      {validationErrors[errorKey] && (
        <p className="text-xs mt-1" style={{ color: "var(--text-error)" }}>
          {validationErrors[errorKey]}
        </p>
      )}
    </>
  );

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

          {userTeams.length > 1 && (
            <div className="mb-4">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Equipo del reporte *
              </label>
              <select
                value={reportTeamId || ""}
                onChange={(e) => setReportTeamId(e.target.value || undefined)}
                className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              >
                {userTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                step={60}
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
              Fotografías del lugar *
            </label>
            <input
              ref={locationPhotoRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={(e) => {
                makePendingFiles(e.target.files, "photo");
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => locationPhotoRef.current?.click()}
              className="w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors"
              style={{
                borderColor: validationErrors.locationPhotos
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
                Añadir fotografías del lugar
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Puedes seleccionar varias imágenes
              </span>
            </button>
            {renderFileGrid(locationPhotos, "photo", "locationPhotos")}
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
                step={60}
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
                step={60}
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
                min="0"
                className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {duration && (
            <p
              className="text-xs mt-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              Duración estimada del servicio: {duration}
            </p>
          )}
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
              Ubicación del servicio{" "}
              <span style={{ color: "var(--text-tertiary)" }}>
                (enlace de Google Maps o coordenadas)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationGPS}
                onChange={(e) => {
                  setLocationGPS(e.target.value);
                  setLocationError(null);
                }}
                placeholder="https://maps.app.goo.gl/... o 18.4861,-69.9312"
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
            {locationGPS.trim() && !mapsUrl && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-error)" }}
              >
                {locationError ||
                  "Ingresa un enlace válido de Google Maps o coordenadas"}
              </p>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs mt-1.5 font-medium"
                style={{ color: "var(--text-link)" }}
              >
                <ExternalLink size={12} />
                Abrir ubicación en Google Maps
              </a>
            )}
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
              Fotografías y videos del trabajo realizado *
            </label>
            <input
              ref={workEvidenceRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => {
                makePendingFiles(e.target.files, "work");
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => workEvidenceRef.current?.click()}
              className="w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors"
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
                Añadir fotos y videos del trabajo
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Puedes seleccionar varios archivos
              </span>
            </button>
            {renderFileGrid(workFiles, "work", "workEvidence")}
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

          {linkedTask ? (
            <div
              className="flex items-center justify-between gap-3 p-3 rounded-xl"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {linkedTask.title}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {linkedTask.listName || "Tarea de Tasklyn"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLinkedTask(undefined)}
                className="h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium flex-shrink-0"
                style={{
                  color: "var(--text-error)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <X size={14} />
                Quitar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTaskPicker(true)}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-link)",
                border: "1px solid var(--border-color)",
              }}
            >
              <Link2 size={16} />
              Seleccionar tarea de Tasklyn
            </button>
          )}
          <p
            className="text-xs mt-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            Opcional: vincula este reporte a una tarea existente para seguir su
            avance desde el panel de la tarea.
          </p>
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

      {/* Task picker modal */}
      <AnimatePresence>
        {showTaskPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99998] bg-[var(--bg-modal-overlay)] backdrop-blur-sm"
              onClick={() => setShowTaskPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed inset-x-0 bottom-0 sm:inset-0 z-[99999] flex items-end sm:items-center justify-center sm:p-4"
            >
              <div
                className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-modal)",
                  border: "1px solid var(--border-color)",
                  maxHeight: "min(560px, calc(100dvh - 32px))",
                  boxShadow: "var(--shadow-modal)",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex items-center gap-2">
                    <Link2
                      size={18}
                      style={{ color: "var(--text-secondary)" }}
                    />
                    <h3
                      className="text-base font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Seleccionar tarea
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowTaskPicker(false)}
                    aria-label="Cerrar"
                    className="min-w-10 min-h-10 p-1.5 rounded-lg flex items-center justify-center"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-3">
                  {/* Team selector */}
                  {userTeams.length > 0 && (
                    <div>
                      <label
                        className="text-xs font-medium mb-1.5 block"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Equipo
                      </label>
                      <select
                        value={pickerTeamId || ""}
                        onChange={(e) => {
                          setPickerTeamId(e.target.value || null);
                          setPickerListId(null);
                        }}
                        className="w-full h-11 px-3 rounded-xl text-sm"
                        style={{
                          border: "1px solid var(--border-input)",
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {userTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* List selector */}
                  <div>
                    <label
                      className="text-xs font-medium mb-1.5 block"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Lista
                    </label>
                    <select
                      value={pickerListId || ""}
                      onChange={(e) => setPickerListId(e.target.value || null)}
                      className="w-full h-11 px-3 rounded-xl text-sm"
                      style={{
                        border: "1px solid var(--border-input)",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {pickerLists.length === 0 && (
                        <option value="">Sin listas</option>
                      )}
                      {pickerLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <input
                      type="text"
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      placeholder="Buscar tarea por nombre..."
                      className="w-full h-11 pl-9 pr-3 rounded-xl text-sm"
                      style={{
                        border: "1px solid var(--border-input)",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  {/* Tasks */}
                  {pickerLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2
                        size={24}
                        className="animate-spin"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    </div>
                  ) : filteredPickerTasks.length === 0 ? (
                    <p
                      className="text-sm text-center py-8"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {pickerListId
                        ? "No hay tareas en esta lista"
                        : "Selecciona una lista para ver sus tareas"}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredPickerTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => selectTask(task)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-[var(--bg-hover)]"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {task.title}
                            </p>
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {task.dueDate
                                ? `Vence: ${task.dueDate}`
                                : "Sin fecha"}
                            </p>
                          </div>
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                task.status === "completed"
                                  ? "rgba(22,163,74,0.12)"
                                  : "rgba(217,119,6,0.12)",
                              color:
                                task.status === "completed"
                                  ? "#16a34a"
                                  : "#d97706",
                            }}
                          >
                            {task.status === "completed"
                              ? "Completada"
                              : "Pendiente"}
                          </span>
                          <ChevronRight
                            size={16}
                            style={{ color: "var(--text-tertiary)" }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {(lightboxUrl || lightboxVideo) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-black/90 flex items-center justify-center p-4"
            onClick={() => {
              setLightboxUrl(null);
              setLightboxVideo(null);
            }}
          >
            <button
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center"
              aria-label="Cerrar"
              onClick={() => {
                setLightboxUrl(null);
                setLightboxVideo(null);
              }}
            >
              <X size={22} />
            </button>
            {lightboxVideo ? (
              <video
                src={lightboxVideo}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxUrl || ""}
                alt="Vista previa"
                className="max-w-full max-h-[85vh] rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
