"use client";

import React, { useState } from "react";
import { TaskList, MemberRole } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useInvitationStore } from "@/stores/invitationStore";
import { getUserRole, canInviteMembers } from "@/lib/permissions";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  Check,
  Mail,
  Send,
  UserPlus,
  CheckCircle2,
  Share2,
  Link2,
  Copy,
  Eye,
  Edit3,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumMembersPanelProps {
  list: TaskList;
  isOpen: boolean;
  onClose: () => void;
}

const roleOptions: { value: string; label: string }[] = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

export default function PremiumMembersPanel({
  list,
  isOpen,
  onClose,
}: PremiumMembersPanelProps) {
  const { user } = useAuthStore();
  const { sendEmailInvitation, createInvitation } = useInvitationStore();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("viewer");
  const [isSending, setIsSending] = useState(false);
  const [inviteSent, setInviteSent] = useState<{
    email: string;
    notified: boolean;
  } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  if (!user) return null;

  const myRole = getUserRole(list, user.id);
  const canInvite = canInviteMembers(myRole);

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError("Ingresa un correo electrónico válido.");
      return;
    }

    setIsSending(true);
    setInviteError(null);
    try {
      const result = await sendEmailInvitation({
        email: inviteEmail.trim(),
        listId: list.id,
        listName: list.name,
        inviterName: user.name || user.email || "...",
        role: inviteRole,
        invitedBy: user.id,
      });
      setInviteSent({ email: inviteEmail.trim(), notified: result.notified });
      setInviteEmail("");
    } catch (error) {
      console.error("Error sending invitation:", error);
      setInviteError("Error al enviar la invitación. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  const handleShareInvitation = async () => {
    if (!user) return;
    setIsCopyingLink(true);
    setShareError(null);
    try {
      let url = inviteLink;
      if (!url) {
        const invitation = await createInvitation(list.id, user.id, "viewer");
        url = `${window.location.origin}/invite/${invitation.token}`;
        setInviteLink(url);
      }
      const message = `¡Te invito a mi lista “${list.name}” en TASKLYN! 🎉`;
      if (navigator.share) {
        await navigator.share({
          title: `Invitación a ${list.name}`,
          text: message,
          url,
        });
      } else {
        await navigator.clipboard.writeText(`${message}\n\n${url}`);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Error sharing invite link:", error);
      setShareError("No se pudo compartir la invitación. Inténtalo de nuevo.");
    } finally {
      setIsCopyingLink(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compartir lista"
      description={`Invita personas a "${list.name}"`}
      size="md"
    >
      <div className="space-y-6">
        {/* Role guide */}
        <div
          className="rounded-2xl p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(99,102,241,0.06))",
            border: "1px solid rgba(37,99,235,0.15)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Share2 size={18} className="text-white" />
            </div>
            <div>
              <h3
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Colaboración en tiempo real
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {list.members.length}{" "}
                {list.members.length === 1
                  ? "miembro activo"
                  : "miembros activos"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                icon: <Crown size={13} />,
                role: "Owner",
                desc: "Control total",
                color: "bg-blue-100 text-blue-700",
              },
              {
                icon: <Edit3 size={13} />,
                role: "Editor",
                desc: "Crear y completar tareas",
                color: "bg-sky-100 text-sky-700",
              },
              {
                icon: <Eye size={13} />,
                role: "Viewer",
                desc: "Solo ver",
                color: "",
              },
            ].map((item) => (
              <div
                key={item.role}
                className="rounded-xl p-2.5 text-center"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1",
                    item.color,
                  )}
                >
                  {item.icon} {item.role}
                </span>
                <p
                  className="text-[10px] leading-tight"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Email invite */}
        {canInvite && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(37,99,235,0.1)" }}
              >
                <UserPlus size={15} className="text-blue-600" />
              </div>
              <h3
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Invitar por correo
              </h3>
            </div>

            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                  setInviteSent(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendInvitation()}
                placeholder="correo@ejemplo.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div className="flex gap-2">
              <Select
                options={roleOptions}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                className="!h-11 !text-sm flex-1"
              />
              <Button
                onClick={handleSendInvitation}
                isLoading={isSending}
                icon={<Send size={15} />}
                className="h-11 px-5 bg-blue-600 hover:bg-blue-700 flex-shrink-0"
              >
                Enviar
              </Button>
            </div>

            <AnimatePresence>
              {inviteError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-sm rounded-xl px-4 py-3"
                  style={{
                    color: "#dc2626",
                    backgroundColor: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  {inviteError}
                </motion.p>
              )}
              {inviteSent && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    backgroundColor: "rgba(22,163,74,0.06)",
                    border: "1px solid rgba(22,163,74,0.2)",
                  }}
                >
                  <CheckCircle2
                    size={18}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#15803d" }}
                    >
                      Invitación enviada
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#16a34a" }}>
                      {inviteSent.notified
                        ? `Notificado a ${inviteSent.email} dentro de Tasklyn.`
                        : `Correo enviado a ${inviteSent.email}.`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Copy invite link */}
        <div
          className="pt-2 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
          <motion.button
            onClick={handleShareInvitation}
            disabled={isCopyingLink}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-all duration-200",
              linkCopied ? "border-green-300 text-green-700" : "",
            )}
          >
            {isCopyingLink ? (
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{
                  borderColor: "var(--text-tertiary)",
                  borderTopColor: "transparent",
                }}
              />
            ) : linkCopied ? (
              <Check size={15} className="text-green-600" />
            ) : (
              <Link2 size={15} />
            )}
            {linkCopied
              ? "¡Enlace copiado!"
              : isCopyingLink
                ? "Generando enlace..."
                : "Compartir invitación"}
            {!linkCopied && !isCopyingLink && (
              <Copy
                size={12}
                style={{ color: "var(--text-tertiary)", marginLeft: "2px" }}
              />
            )}
          </motion.button>
          <p
            className="text-[11px] text-center mt-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            Expira en 7 días · Se une como Viewer
          </p>
          {shareError && (
            <p className="text-xs text-center text-red-600 mt-2" role="alert">
              {shareError}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
