"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useReportStore } from "@/stores/reportStore";
import { useTeamStore } from "@/stores/teamStore";
import type { TechnicianReport, ServiceType, ReportResult } from "@/types";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "my" | "supervision";

interface ReportsListProps {
  viewMode: ViewMode;
  onReportClick?: (report: TechnicianReport) => void;
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

export default function ReportsList({
  viewMode,
  onReportClick,
}: ReportsListProps) {
  const { user } = useAuthStore();
  const { myReports, allReports, loadMyReports, loadAllReports, isLoading } =
    useReportStore();
  const { teams } = useTeamStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterServiceType, setFilterServiceType] = useState<
    ServiceType | "all"
  >("all");
  const [filterResult, setFilterResult] = useState<ReportResult | "all">("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (viewMode === "my" && user) {
      loadMyReports();
    } else if (viewMode === "supervision" && teams.length > 0) {
      // Load reports for the first team (can be enhanced to select team)
      loadAllReports(teams[0].id);
    }
  }, [viewMode, user, teams, loadMyReports, loadAllReports]);

  const reports = viewMode === "my" ? myReports : allReports;

  // Filter reports
  const filteredReports = reports.filter((report) => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        report.clientNameOrCode.toLowerCase().includes(query) ||
        report.createdByName.toLowerCase().includes(query) ||
        (report.serviceTypeOther &&
          report.serviceTypeOther.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Service type filter
    if (
      filterServiceType !== "all" &&
      report.serviceType !== filterServiceType
    ) {
      return false;
    }

    // Result filter
    if (filterResult !== "all" && report.result !== filterResult) {
      return false;
    }

    // Date range filter
    if (filterDateFrom && report.serviceDate < filterDateFrom) {
      return false;
    }
    if (filterDateTo && report.serviceDate > filterDateTo) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setFilterServiceType("all");
    setFilterResult("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilters =
    searchQuery ||
    filterServiceType !== "all" ||
    filterResult !== "all" ||
    filterDateFrom ||
    filterDateTo;

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: "var(--text-tertiary)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {viewMode === "my" ? "Mis Reportes" : "Supervisión"}
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <Filter size={16} />
          Filtros
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-tertiary)" }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por cliente, técnico..."
          className="w-full h-11 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          style={{
            border: "1px solid var(--border-input)",
            backgroundColor: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl space-y-4"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Tipo de servicio
                </label>
                <select
                  value={filterServiceType}
                  onChange={(e) =>
                    setFilterServiceType(e.target.value as ServiceType | "all")
                  }
                  className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="all">Todos</option>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Resultado
                </label>
                <select
                  value={filterResult}
                  onChange={(e) =>
                    setFilterResult(e.target.value as ReportResult | "all")
                  }
                  className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="all">Todos</option>
                  {Object.entries(RESULT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Desde
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Hasta
                </label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--text-link)" }}
              >
                Limpiar filtros
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {filteredReports.length}{" "}
        {filteredReports.length === 1 ? "reporte" : "reportes"}
        {hasActiveFilters && " (filtrados)"}
      </div>

      {/* Reports list */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle size={48} style={{ color: "var(--text-tertiary)" }} />
          <p
            className="mt-4 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {hasActiveFilters
              ? "No se encontraron reportes con los filtros aplicados"
              : "No hay reportes registrados"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl cursor-pointer transition-colors hover:shadow-md"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
              }}
              onClick={() => onReportClick?.(report)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${RESULT_COLORS[report.result]}1a`,
                        color: RESULT_COLORS[report.result],
                      }}
                    >
                      {RESULT_LABELS[report.result]}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {SERVICE_TYPE_LABELS[report.serviceType]}
                    </span>
                  </div>

                  <h3
                    className="text-sm font-medium mb-1 truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {report.clientNameOrCode}
                  </h3>

                  <div
                    className="flex flex-wrap items-center gap-3 text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(report.serviceDate).toLocaleDateString("es-DO")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {report.reportTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {report.locationGPS.slice(0, 20)}...
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 mt-2 text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <span>Técnico: {report.createdByName}</span>
                    {report.linkedTaskId && (
                      <div
                        className="flex items-center gap-1"
                        style={{ color: "var(--text-link)" }}
                      >
                        <LinkIcon size={12} />
                        Vinculado a tarea
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {report.result === "TERMINADO" ? (
                    <CheckCircle
                      size={20}
                      style={{ color: RESULT_COLORS.TERMINADO }}
                    />
                  ) : (
                    <AlertCircle
                      size={20}
                      style={{ color: RESULT_COLORS[report.result] }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
