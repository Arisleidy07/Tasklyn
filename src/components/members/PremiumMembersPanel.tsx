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

  const handleCopyLink = async () => {
    if (!user) return;
    setIsCopyingLink(true);
    try {
      const invitation = await createInvitation(list.id, user.id, "viewer");
      const url = `${window.location.origin}/invite/${invitation.token}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (error) {
      console.error("Error creating invite link:", error);
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-5 border border-blue-100/80 dark:border-blue-900/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Share2 size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">
                Colaboración en tiempo real
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
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
                color:
                  "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300",
              },
            ].map((item) => (
              <div
                key={item.role}
                className="bg-white/70 rounded-xl p-2.5 text-center dark:bg-slate-800/70"
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1",
                    item.color,
                  )}
                >
                  {item.icon} {item.role}
                </span>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
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
              <div className="w-7 h-7 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserPlus size={15} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm dark:text-slate-100">
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
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500"
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
                  className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl px-4 py-3"
                >
                  {inviteError}
                </motion.p>
              )}
              {inviteSent && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40"
                >
                  <CheckCircle2
                    size={18}
                    className="text-green-600 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-400">
                      Invitación enviada
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
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
        <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
          <motion.button
            onClick={handleCopyLink}
            disabled={isCopyingLink}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-all duration-200",
              linkCopied
                ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600",
            )}
          >
            {isCopyingLink ? (
              <div className="w-4 h-4 border-2 border-gray-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : linkCopied ? (
              <Check size={15} className="text-green-600" />
            ) : (
              <Link2 size={15} />
            )}
            {linkCopied
              ? "¡Enlace copiado!"
              : isCopyingLink
                ? "Generando enlace..."
                : "Copiar enlace de invitación"}
            {!linkCopied && !isCopyingLink && (
              <Copy
                size={12}
                className="text-gray-400 dark:text-slate-500 ml-0.5"
              />
            )}
          </motion.button>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center mt-2">
            Expira en 7 días · Se une como Viewer
          </p>
        </div>
      </div>
    </Modal>
  );
}
