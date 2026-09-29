"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useInvitationStore } from "@/stores/invitationStore";
import { useListStore } from "@/stores/listStore";
import Logo from "@/components/shared/Logo";
import Button from "@/components/ui/Button";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Users,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { user, isAuthenticated, isAuthReady, login } = useAuthStore();
  const { getInvitation, acceptInvitation, rejectInvitation } =
    useInvitationStore();
  const { getList } = useListStore();

  const [invitation, setInvitation] =
    useState<Awaited<ReturnType<typeof getInvitation>>>(null);
  const [listName, setListName] = useState<string>("");
  const [status, setStatus] = useState<
    | "loading"
    | "invalid"
    | "expired"
    | "used"
    | "error"
    | "not-logged-in"
    | "already-member"
    | "ready"
    | "accepting"
    | "rejecting"
    | "rejected"
    | "success"
  >("loading");
  const [error, setError] = useState<string>("");

  // Load invitation
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let inv: Awaited<ReturnType<typeof getInvitation>>;
      try {
        inv = await getInvitation(token);
      } catch (err) {
        console.error("[InvitePage] Error fetching invitation:", err);
        if (!cancelled) setStatus("error");
        return;
      }

      if (cancelled) return;

      if (!inv) {
        setStatus("invalid");
        return;
      }

      // A team token opened on the list-invite route: forward to the right page.
      if (inv.type === "team") {
        router.replace(`/invite/team/${token}`);
        return;
      }

      if (inv.status === "accepted" || inv.status === "declined") {
        setInvitation(inv);
        setListName(inv.targetName ?? "");
        setStatus("used");
        return;
      }

      if (inv.status === "expired" || new Date(inv.expiresAt) < new Date()) {
        setStatus("expired");
        return;
      }

      setInvitation(inv);
      setListName(inv.targetName ?? "");

      if (!isAuthReady) {
        setStatus("loading");
        return;
      }

      if (!isAuthenticated) {
        setStatus("not-logged-in");
        return;
      }

      const list = await getList(inv.listId ?? inv.targetId);
      if (list) setListName(list.name);

      // Check if already member
      if (list?.members?.some((m) => m.userId === user?.id)) {
        setStatus("already-member");
        return;
      }

      setStatus("ready");
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [
    token,
    getInvitation,
    getList,
    isAuthenticated,
    isAuthReady,
    user?.id,
    router,
  ]);

  const handleLogin = async () => {
    try {
      setError("");
      await login();
    } catch {
      setError("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
    }
  };

  const handleAccept = async () => {
    if (!invitation || !user) return;

    setStatus("accepting");
    try {
      await acceptInvitation(invitation, user.id, user.name);
      setStatus("success");
      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push(`/lists/${invitation.listId ?? invitation.targetId}`);
      }, 1500);
    } catch (error) {
      if (error instanceof Error && error.message === "already-member") {
        setStatus("already-member");
        return;
      }
      setError("Error al unirse a la lista. Por favor, inténtalo de nuevo.");
      setStatus("ready");
    }
  };

  const handleDecline = async () => {
    if (!invitation || !user) return;
    setStatus("rejecting");
    setError("");
    try {
      await rejectInvitation(invitation, user.id, user.name);
      setStatus("rejected");
    } catch {
      setError("No se pudo rechazar la invitación. Inténtalo de nuevo.");
      setStatus("ready");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="w-full border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Logo size="md" showText={false} />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl p-8">
            {status === "loading" && (
              <div className="text-center py-8">
                <Loader2
                  size={32}
                  className="animate-spin mx-auto text-blue-600 mb-4"
                />
                <p className="text-slate-400">Cargando invitación...</p>
              </div>
            )}

            {status === "invalid" && (
              <div className="text-center py-8">
                <XCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  Invitación inválida
                </h2>
                <p className="text-slate-400 mb-6">
                  Este enlace de invitación es inválido o ha sido eliminado.
                </p>
                <Button onClick={() => router.push("/")} className="w-full">
                  Ir al inicio
                </Button>
              </div>
            )}

            {status === "used" && (
              <div className="text-center py-8">
                <CheckCircle
                  size={48}
                  className="mx-auto text-slate-400 mb-4"
                />
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  Invitación ya utilizada
                </h2>
                <p className="text-slate-400 mb-6">
                  Este enlace de invitación ya fue aceptado o rechazado
                  anteriormente.
                </p>
                <Button
                  onClick={() =>
                    router.push(isAuthenticated ? "/dashboard" : "/")
                  }
                  className="w-full"
                >
                  {isAuthenticated ? "Ir a mis listas" : "Ir al inicio"}
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="text-center py-8">
                <AlertCircle
                  size={48}
                  className="mx-auto text-amber-400 mb-4"
                />
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  No se pudo cargar la invitación
                </h2>
                <p className="text-slate-400 mb-6">
                  Hubo un problema de conexión. Revisa tu internet e inténtalo
                  de nuevo.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Reintentar
                </Button>
              </div>
            )}

            {status === "expired" && (
              <div className="text-center py-8">
                <AlertCircle
                  size={48}
                  className="mx-auto text-slate-400 mb-4"
                />
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  Invitación expirada
                </h2>
                <p className="text-slate-400 mb-6">
                  Esta invitación ha expirado. Pide al propietario de la lista
                  que cree una nueva.
                </p>
                <Button onClick={() => router.push("/")} className="w-full">
                  Ir al inicio
                </Button>
              </div>
            )}

            {status === "not-logged-in" && (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  ¡Has sido invitado!
                </h2>
                <p className="text-slate-400 mb-2">
                  Unirse a &quot;{listName || "una lista compartida"}&quot;
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  Inicia sesión con Google para aceptar esta invitación.
                </p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <Button
                  onClick={handleLogin}
                  className="w-full"
                  icon={<ArrowRight size={16} />}
                >
                  Iniciar sesión con Google
                </Button>
              </div>
            )}

            {status === "already-member" && (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  Ya eres miembro
                </h2>
                <p className="text-slate-400 mb-6">
                  Ya formas parte de esta lista.
                </p>
                <Button
                  onClick={() =>
                    invitation && router.push(`/lists/${invitation.listId}`)
                  }
                  className="w-full"
                >
                  Ir a la lista
                </Button>
              </div>
            )}

            {(status === "ready" ||
              status === "accepting" ||
              status === "rejecting") && (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  ¿Unirse a &quot;{listName}&quot;?
                </h2>
                <p className="text-slate-400 mb-6">
                  Has sido invitado a colaborar en esta lista compartida.
                </p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleDecline}
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
                    Aceptar
                  </Button>
                </div>
              </div>
            )}

            {status === "rejected" && (
              <div className="text-center py-8">
                <CheckCircle size={56} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  Invitación rechazada
                </h2>
                <p className="text-slate-400 mb-6">
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
                    className="mx-auto text-blue-500 mb-4"
                  />
                </motion.div>
                <h2 className="text-xl font-bold text-slate-100 mb-2">
                  ¡Bienvenido!
                </h2>
                <p className="text-slate-400">
                  Te has unido a la lista correctamente.
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
