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
  const { getInvitation, acceptInvitation } = useInvitationStore();
  const { getList } = useListStore();

  const [invitation, setInvitation] =
    useState<Awaited<ReturnType<typeof getInvitation>>>(null);
  const [listName, setListName] = useState<string>("");
  const [status, setStatus] = useState<
    | "loading"
    | "invalid"
    | "expired"
    | "not-logged-in"
    | "already-member"
    | "ready"
    | "accepting"
    | "success"
  >("loading");
  const [error, setError] = useState<string>("");

  // Load invitation
  useEffect(() => {
    const load = async () => {
      const inv = await getInvitation(token);
      if (!inv) {
        setStatus("invalid");
        return;
      }

      if (new Date(inv.expiresAt) < new Date()) {
        setStatus("expired");
        return;
      }

      const list = await getList(inv.listId);
      if (list) {
        setListName(list.name);
      }

      setInvitation(inv);

      if (!isAuthReady) {
        setStatus("loading");
        return;
      }

      if (!isAuthenticated) {
        setStatus("not-logged-in");
        return;
      }

      // Check if already member
      if (list?.members.some((m) => m.userId === user?.id)) {
        setStatus("already-member");
        return;
      }

      setStatus("ready");
    };

    load();
  }, [token, getInvitation, getList, isAuthenticated, isAuthReady, user?.id]);

  const handleLogin = async () => {
    try {
      await login();
      // Después de iniciar sesión, volver a verificar el estado de la invitación
      const inv = await getInvitation(token);
      if (inv) {
        const list = await getList(inv.listId);
        if (list?.members.some((m) => m.userId === user?.id)) {
          setStatus("already-member");
        } else {
          setStatus("ready");
        }
      }
    } catch (err) {
      setError("Error al iniciar sesión. Por favor, inténtalo de nuevo.");
    }
  };

  const handleAccept = async () => {
    if (!invitation || !user) return;

    setStatus("accepting");
    try {
      await acceptInvitation(invitation, user.id);
      setStatus("success");
      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push(`/lists/${invitation.listId}`);
      }, 1500);
    } catch (err) {
      setError("Error al unirse a la lista. Por favor, inténtalo de nuevo.");
      setStatus("ready");
    }
  };

  const handleDecline = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full border-b border-gray-200 bg-white">
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-8">
            {status === "loading" && (
              <div className="text-center py-8">
                <Loader2
                  size={32}
                  className="animate-spin mx-auto text-blue-600 mb-4"
                />
                <p className="text-gray-500">Cargando invitación...</p>
              </div>
            )}

            {status === "invalid" && (
              <div className="text-center py-8">
                <XCircle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Invitación inválida
                </h2>
                <p className="text-gray-500 mb-6">
                  Este enlace de invitación es inválido o ha sido eliminado.
                </p>
                <Button onClick={() => router.push("/")} className="w-full">
                  Ir al inicio
                </Button>
              </div>
            )}

            {status === "expired" && (
              <div className="text-center py-8">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Invitación expirada
                </h2>
                <p className="text-gray-500 mb-6">
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Has sido invitado!
                </h2>
                <p className="text-gray-500 mb-2">
                  Unirse a &quot;{listName || "una lista compartida"}&quot;
                </p>
                <p className="text-sm text-gray-400 mb-6">
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Ya eres miembro
                </h2>
                <p className="text-gray-500 mb-6">
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

            {(status === "ready" || status === "accepting") && (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-blue-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  ¿Unirse a &quot;{listName}&quot;?
                </h2>
                <p className="text-gray-500 mb-6">
                  Has sido invitado a colaborar en esta lista compartida.
                </p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleDecline}
                    className="flex-1"
                    disabled={status === "accepting"}
                  >
                    Rechazar
                  </Button>
                  <Button
                    onClick={handleAccept}
                    className="flex-1"
                    isLoading={status === "accepting"}
                    icon={<ArrowRight size={16} />}
                  >
                    Unirse
                  </Button>
                </div>
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Bienvenido!
                </h2>
                <p className="text-gray-500">
                  Te has unido a la lista correctamente.
                </p>
                <p className="text-sm text-gray-400 mt-2">Redirigiendo...</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
