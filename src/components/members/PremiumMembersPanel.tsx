"use client";

import React, { useState } from "react";
import type { MemberRole, TaskList } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useInvitationStore } from "@/stores/invitationStore";
import { canInviteMembers, getUserRole } from "@/lib/permissions";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { CheckCircle2, Share2, UserPlus, Users } from "lucide-react";
import { motion } from "framer-motion";

interface PremiumMembersPanelProps {
  list: TaskList;
  isOpen: boolean;
  onClose: () => void;
}

const roleOptions = [
  { value: "viewer", label: "Viewer — puede consultar" },
  { value: "editor", label: "Editor — puede modificar" },
];

export default function PremiumMembersPanel({
  list,
  isOpen,
  onClose,
}: PremiumMembersPanelProps) {
  const { user } = useAuthStore();
  const { createInvitation } = useInvitationStore();
  const [role, setRole] = useState<MemberRole>("viewer");
  const [isSharing, setIsSharing] = useState(false);
  const [result, setResult] = useState<"copied" | "shared" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  if (!user) return null;

  const canInvite = canInviteMembers(getUserRole(list, user.id));

  const handleShare = async () => {
    if (!canInvite || isSharing) return;
    setIsSharing(true);
    setError(null);
    setResult(null);

    try {
      let url = inviteLink;
      if (!url) {
        const invitation = await createInvitation(list.id, user.id, role);
        url = `${window.location.origin}/invite/${invitation.token}`;
        setInviteLink(url);
      }

      const text = `¡Te invito a mi lista “${list.name}” en TASKLYN! 🎉`;
      if (navigator.share) {
        await navigator.share({
          title: `Invitación a ${list.name}`,
          text,
          url,
        });
        setResult("shared");
      } else {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        setResult("copied");
      }
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }
      console.error("Error sharing invitation:", shareError);
      setError("No se pudo compartir la invitación. Inténtalo de nuevo.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invitar personas a “${list.name}”`}
      description="Comparte una invitación para que otra persona pueda unirse a esta lista."
      size="lg"
    >
      <div className="p-4 sm:p-6 space-y-5">
        <div
          className="flex items-start gap-3 p-4 rounded-2xl border"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={20} className="text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Invitación para una lista compartida
            </p>
            <p
              className="text-sm mt-1 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              El enlace es único, expira en 7 días y permite aceptar o rechazar
              la invitación.
            </p>
            <p
              className="text-xs mt-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              {list.members.length}{" "}
              {list.members.length === 1
                ? "miembro actual"
                : "miembros actuales"}
            </p>
          </div>
        </div>

        <label className="block space-y-2">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Rol al unirse
          </span>
          <Select
            options={roleOptions}
            value={role}
            onChange={(event) => {
              setRole(event.target.value as MemberRole);
              setInviteLink(null);
              setResult(null);
            }}
            className="!min-h-12 !text-base sm:!text-sm w-full"
          />
        </label>

        {!canInvite && (
          <p
            className="text-sm p-3 rounded-xl bg-amber-500/10 text-amber-700"
            role="alert"
          >
            No tienes permisos para invitar personas a esta lista.
          </p>
        )}

        <motion.button
          type="button"
          onClick={handleShare}
          disabled={!canInvite || isSharing}
          whileTap={{ scale: 0.98 }}
          className="w-full min-h-12 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSharing ? (
            <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : result ? (
            <CheckCircle2 size={19} aria-hidden="true" />
          ) : (
            <Share2 size={19} aria-hidden="true" />
          )}
          {isSharing
            ? "Preparando invitación..."
            : result === "copied"
              ? "Invitación copiada"
              : result === "shared"
                ? "Invitación compartida"
                : "Compartir invitación"}
        </motion.button>

        {error && (
          <p className="text-sm text-center text-red-600" role="alert">
            {error}
          </p>
        )}

        <div
          className="flex items-center justify-center gap-2 text-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          <UserPlus size={14} aria-hidden="true" />
          La persona deberá iniciar sesión antes de unirse.
        </div>
      </div>
    </Modal>
  );
}
