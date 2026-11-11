"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import {
  getTeamInvitationByToken,
  acceptTeamInvitation,
  declineInvitation,
  getTeam,
} from "@/lib/firestore";
import type { Invitation, Team } from "@/types";
import Logo from "@/components/shared/Logo";
import Button from "@/components/ui/Button";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Users,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

type Status =
  | "loading"
  | "invalid"
  | "expired"
  | "already-member"
  | "not-logged-in"
  | "ready"
  | "accepting"
  | "rejecting"
  | "rejected"
  | "success";

export default function TeamInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { user, isAuthenticated, isAuthReady, login } = useAuthStore();
  const { refreshTeams, isTeamMember } = useTeamStore();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!isAuthReady) return;

      const inv = await getTeamInvitationByToken(token);
      if (!inv) {
        setStatus("invalid");
        return;
      }

      const teamId = inv.teamId ?? inv.targetId;
      const teamData = teamId ? await getTeam(teamId) : null;
      setInvitation(inv);
      setTeam(teamData);

      // Membership is checked against the team document itself (not the
      // local store, which may not be loaded yet on this public page).
      const alreadyInTeam =
        !!user &&
        !!teamData &&
        (teamData.owner === user.id ||
          teamData.members?.some((m) => m.userId === user.id) ||
          (teamData as Team & { memberIds?: string[] }).memberIds?.includes(
            user.id,
          ) ||
          (teamId ? isTeamMember(teamId, user.id) : false));

      if (isAuthenticated && alreadyInTeam) {
        setStatus("already-member");
        return;
      }

      if (
        inv.status !== "pending" ||
        !teamData ||
        new Date(inv.expiresAt) < new Date()
      ) {
        setStatus("expired");
        return;
      }

      if (!isAuthenticated) {
        setStatus("not-logged-in");
        return;
      }

      setStatus("ready");
    };

    load();
  }, [token, isAuthReady, isAuthenticated, user, isTeamMember]);

  const handleLogin = async () => {
    try {
      // Come back to this invitation after signing in.
      localStorage.setItem(
        "tasklyn-redirect-after-login",
        `/invite/team/${token}`,
      );
      await login();
    } catch {
      setError("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
    }
  };

  const handleAccept = async () => {
    if (!invitation || !user) return;
    setStatus("accepting");
    try {
      await acceptTeamInvitation(invitation, user.id);
      await refreshTeams(user.id);
      setStatus("success");
      setTimeout(() => {
        router.push(`/teams/${invitation.teamId ?? invitation.targetId}`);
      }, 1500);
    } catch (err) {
      console.error("[TeamInvitePage] Accept error:", err);
      const code = (err as { code?: string; message?: string }).code;
      const msg = (err as Error).message || "";
      setError(
        code === "permission-denied"
          ? "No tienes permiso para unirte a este equipo con esta invitación."
          : msg.includes("expired")
            ? "La invitación ha expirado."
            : msg.includes("processed")
              ? "Esta invitación ya fue utilizada."
              : "Error al unirse al equipo. Por favor, inténtalo de nuevo.",
      );
      setStatus("ready");
    }
  };

  const handleReject = async () => {
    if (!invitation || !user) return;
    setStatus("rejecting");
    setError("");
    try {
      await declineInvitation(invitation, user.id);
      setStatus("rejected");
    } catch {
      setError("No se pudo rechazar la invitación. Inténtalo de nuevo.");
      setStatus("ready");
    }
  };

  const roleLabel =
    invitation?.defaultRole === "admin" ? "Administrador" : "Miembro";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Logo size="xs" showText textClassName="text-blue-700 text-base" className="gap-2" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.2)] p-6 sm:p-8">
            {status === "loading" && (
              <div className="text-center py-8">
                <Loader2
                  size={32}
                  className="animate-spin mx-auto text-blue-600 mb-4"
                />
                <p className="text-slate-600">Cargando invitación...</p>
              </div>
            )}

            {status === "invalid" && (
              <div className="text-center py-8">
                <XCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Invitación inválida
                </h2>
                <p className="text-slate-600 mb-6">
                  Este enlace no existe o ya fue utilizado.
                </p>
                <Button onClick={() => router.push("/")} className="w-full">
                  Ir al inicio
                </Button>
              </div>
            )}

            {status === "expired" && (
              <div className="text-center py-8">
                <AlertCircle
                  size={48}
                  className="mx-auto text-slate-600 mb-4"
                />
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Invitación expirada
                </h2>
                <p className="text-slate-600 mb-6">
                  Este enlace expiró. Pide al administrador del equipo que
                  genere uno nuevo.
                </p>
                <Button onClick={() => router.push("/")} className="w-full">
                  Ir al inicio
                </Button>
              </div>
            )}

            {status === "already-member" && (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-blue-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Ya eres miembro
                </h2>
                <p className="text-slate-600 mb-6">
                  Ya formas parte de{" "}
                  <strong className="text-slate-800">
                    {team?.name ?? "este equipo"}
                  </strong>
                  .
                </p>
                <Button
                  onClick={() =>
                    invitation?.teamId &&
                    router.push(`/teams/${invitation.teamId}`)
                  }
                  className="w-full"
                >
                  Ir al equipo
                </Button>
              </div>
            )}

            {status === "not-logged-in" && (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-blue-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Has sido invitado
                </h2>
                <p className="text-slate-600 mb-1">
                  <strong className="text-slate-800">
                    {invitation?.inviterName || "Un miembro"}
                  </strong>{" "}
                  te invita al equipo{" "}
                  <strong className="text-slate-800">{team?.name}</strong>
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  Inicia sesión con Google para aceptar esta invitación.
                </p>
                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                <Button
                  onClick={handleLogin}
                  className="w-full"
                  icon={<ArrowRight size={16} />}
                >
                  Iniciar sesión con Google
                </Button>
              </div>
            )}

            {(status === "ready" ||
              status === "accepting" ||
              status === "rejecting") && (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-blue-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Unirte a{" "}
                  <span className="text-blue-600">
                    {team?.name ?? "este equipo"}
                  </span>
                </h2>
                <p className="text-slate-600 mb-3">
                  Has sido invitado a colaborar en este equipo.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm mb-6">
                  <ShieldCheck size={14} className="text-blue-600" />
                  Rol: {roleLabel}
                </div>
                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleReject}
                    className="flex-1"
                    disabled={status !== "ready"}
                    isLoading={status === "rejecting"}
                  >
                    Rechazar
                  </Button>
                  <Button
                    onClick={handleAccept}
                    className="flex-1"
                    disabled={status !== "ready"}
                    isLoading={status === "accepting"}
                    icon={<ArrowRight size={16} />}
                  >
                    Unirse
                  </Button>
                </div>
              </div>
            )}

            {status === "rejected" && (
              <div className="text-center py-8">
                <CheckCircle size={56} className="mx-auto text-blue-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Invitación rechazada
                </h2>
                <p className="text-slate-600 mb-6">
                  La invitación fue procesada y ya no está pendiente.
                </p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Ir a mis listas
                </Button>
              </div>
            )}

            {status === "success" && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle
                    size={64}
                    className="mx-auto text-blue-600 mb-4"
                  />
                </motion.div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  ¡Bienvenido!
                </h2>
                <p className="text-slate-600">
                  Te has unido a{" "}
                  <strong className="text-slate-800">
                    {team?.name ?? "el equipo"}
                  </strong>{" "}
                  correctamente.
                </p>
                <p className="text-sm text-slate-500 mt-2">Redirigiendo...</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
