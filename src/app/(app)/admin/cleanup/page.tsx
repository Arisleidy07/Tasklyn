"use client";

/**
 * ADMIN — Cleanup legacy personal teams
 * Only accessible while logged in. Visit /admin/cleanup to run.
 * Delete this page after cleanup is done.
 */

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  findAllMyTeams,
  deletePersonalTeams,
  type PersonalTeamInfo,
} from "@/lib/cleanupPersonalTeams";

export default function CleanupPage() {
  const { user } = useAuthStore();
  const [found, setFound] = useState<PersonalTeamInfo[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFind = async () => {
    if (!user) return;
    setLoading(true);
    setStatus("Buscando...");
    try {
      const teams = await findAllMyTeams(user.id);
      setFound(teams);
      setStatus(
        teams.length === 0
          ? "✅ No tienes equipos como propietario."
          : `Se encontraron ${teams.length} equipo(s) donde eres propietario.`,
      );
    } catch (e) {
      setStatus(`❌ Error: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (found.length === 0) return;
    if (
      !confirm(
        `¿Eliminar ${found.length} equipos personales? Esta acción no se puede deshacer.`,
      )
    )
      return;
    setLoading(true);
    setStatus("Eliminando...");
    try {
      await deletePersonalTeams(found.map((t) => t.id));
      setFound([]);
      setStatus(
        `✅ ${found.length} equipos personales eliminados correctamente.`,
      );
    } catch (e) {
      setStatus(`❌ Error al eliminar: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        🧹 Limpieza de equipos
      </h1>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Esta herramienta muestra todos los equipos donde eres propietario y
        permite eliminar los que fueron creados automáticamente.{" "}
        <strong>Ejecutar una sola vez.</strong>
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleFind}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {loading ? "Buscando..." : "Ver mis equipos en Firestore"}
        </button>
        {found.length > 0 && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            Eliminar {found.length} equipos
          </button>
        )}
      </div>

      {status && (
        <p
          className="text-sm font-medium px-4 py-3 rounded-xl"
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
          }}
        >
          {status}
        </p>
      )}

      {found.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--border-color)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--bg-secondary)" }}>
                {["ID", "Nombre", "Owner", "Creado"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {found.map((t, i) => (
                <tr
                  key={t.id}
                  style={{
                    backgroundColor:
                      i % 2 === 0 ? "var(--bg-card)" : "var(--bg-secondary)",
                  }}
                >
                  <td
                    className="px-4 py-2.5 font-mono text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t.id}
                  </td>
                  <td
                    className="px-4 py-2.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {t.name}
                  </td>
                  <td
                    className="px-4 py-2.5 font-mono text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t.owner}
                  </td>
                  <td
                    className="px-4 py-2.5 text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
