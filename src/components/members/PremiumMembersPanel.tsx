"use client";

import React, { useState, useEffect, useRef } from "react";
import { TaskList, MemberRole } from "@/types";
import { useListStore } from "@/stores/listStore";
import { useAuthStore } from "@/stores/authStore";
import { useInvitationStore } from "@/stores/invitationStore";
import {
  getUserRole,
  canChangeRoles,
  canRemoveMembers,
  canInviteMembers,
} from "@/lib/permissions";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import {
  Trash2,
  Check,
  Shield,
  Pencil,
  X as XIcon,
  Mail,
  Send,
  UserPlus,
  CheckCircle2,
  Share2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumMembersPanelProps {
  list: TaskList;
  memberNames: Record<string, string>;
  originalNames: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
}

const roleOptions: { value: string; label: string }[] = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const roleBadgeVariant: Record<MemberRole, "blue" | "sky" | "default"> = {
  owner: "blue",
  editor: "sky",
  viewer: "default",
};

function InlineNameEditor({
  currentName,
  originalName,
  onSave,
  onCancel,
}: {
  currentName: string;
  originalName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 flex-1 min-w-0"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(value)}
        placeholder={originalName}
        className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-blue-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
      <button
        type="submit"
        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
      >
        <Check size={16} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
      >
        <XIcon size={16} />
      </button>
    </form>
  );
}

export default function PremiumMembersPanel({
  list,
  memberNames,
  originalNames,
  isOpen,
  onClose,
}: PremiumMembersPanelProps) {
  const { user } = useAuthStore();
  const { updateMemberRole, removeMember, setCustomName } = useListStore();
  const { sendEmailInvitation } = useInvitationStore();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("viewer");
  const [isSending, setIsSending] = useState(false);
  const [inviteSent, setInviteSent] = useState<{
    email: string;
    notified: boolean;
  } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  if (!user) return null;

  const myRole = getUserRole(list, user.id);
  const isOwner = myRole === "owner";
  const canManageRoles = canChangeRoles(myRole);
  const canRemove = canRemoveMembers(myRole);
  const canInvite = canInviteMembers(myRole);

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError("Ingresa un correo electrónico válido.");
      return;
    }
    const alreadyMember = list.members.some(
      (m) => memberNames[m.userId]?.toLowerCase() === inviteEmail.toLowerCase(),
    );
    if (alreadyMember) {
      setInviteError("Esta persona ya es miembro de la lista.");
      return;
    }

    setIsSending(true);
    setInviteError(null);
    try {
      const result = await sendEmailInvitation(
        inviteEmail.trim(),
        list.id,
        list.name,
        user.name || user.email || "Un miembro",
        inviteRole,
      );
      setInviteSent({ email: inviteEmail.trim(), notified: result.notified });
      setInviteEmail("");
    } catch (error) {
      console.error("Error sending invitation:", error);
      setInviteError("Error al enviar la invitación. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    updateMemberRole(list.id, memberId, newRole as MemberRole);
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember(list.id, memberId);
  };

  const handleSaveCustomName = (memberId: string, newName: string) => {
    setCustomName(list.id, memberId, newName);
    setEditingUserId(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compartir lista"
      description={`Invita y gestiona el acceso a "${list.name}"`}
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 px-2 sm:px-0">
        {/* Left Section - Info & Explanation */}
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Share2 size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Compartir lista</h3>
                <p className="text-sm text-gray-600">
                  Colaboración en tiempo real
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <p className="leading-relaxed">
                Invita a personas a colaborar en esta lista. Cada miembro podrá:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-green-500 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>Editor:</strong> Crear y editar tareas
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-green-500 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>Viewer:</strong> Solo ver tareas
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-green-500 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    <strong>Owner:</strong> Control total
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Current Stats */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Estado actual</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tipo de lista</span>
                <Badge variant={list.type === "shared" ? "blue" : "default"}>
                  {list.type === "shared" ? "Compartida" : "Personal"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Miembros totales</span>
                <span className="text-sm font-semibold text-gray-900">
                  {list.members.length} / ∞
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tu rol</span>
                <Badge variant={roleBadgeVariant[myRole]}>{myRole}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Section - Invite Form & Members */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Email invite section */}
          {canInvite && (
            <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 p-4 lg:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Invitar por correo
                  </h3>
                  <p className="text-sm text-gray-600">
                    Envía una invitación directa
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setInviteError(null);
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendInvitation()
                    }
                    placeholder="correo@ejemplo.com"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Select
                    options={roleOptions}
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as MemberRole)
                    }
                    className="!h-12 !text-sm flex-1"
                  />
                  <Button
                    onClick={handleSendInvitation}
                    isLoading={isSending}
                    icon={<Send size={16} />}
                    className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    Enviar invitación
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {inviteError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200"
                  >
                    <p className="text-sm text-red-600">{inviteError}</p>
                  </motion.div>
                )}
                {inviteSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        size={20}
                        className="text-green-600 flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Invitación enviada exitosamente
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          {inviteSent.notified
                            ? `Notificación enviada a ${inviteSent.email} dentro de TASKLYN.`
                            : `Correo de invitación enviado a ${inviteSent.email}.`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Members list */}
          <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users size={18} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Miembros</h3>
                  <p className="text-sm text-gray-600">
                    {list.members.length}{" "}
                    {list.members.length === 1 ? "persona" : "personas"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {list.members.map((member) => {
                const isOwnerMember = member.role === "owner";
                const isSelf = member.userId === user.id;
                const displayName = memberNames[member.userId] || "Unknown";
                const hasCustomName = !!list.customNames[member.userId];
                const isEditing = editingUserId === member.userId;

                return (
                  <motion.div
                    key={member.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    <Avatar name={displayName} size="md" />

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <InlineNameEditor
                          currentName={memberNames[member.userId] || ""}
                          originalName={originalNames[member.userId] || ""}
                          onSave={(name) =>
                            handleSaveCustomName(member.userId, name)
                          }
                          onCancel={() => setEditingUserId(null)}
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {displayName}
                            </p>
                            {isSelf && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                                Tú
                              </span>
                            )}
                          </div>
                          {hasCustomName && (
                            <p className="text-sm text-gray-500 mt-1">
                              Original: {originalNames[member.userId]}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwnerMember && <Badge variant="blue">Owner</Badge>}
                      {canManageRoles && !isOwnerMember && (
                        <Select
                          options={roleOptions}
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.userId, e.target.value)
                          }
                          className="!h-10 !text-xs"
                        />
                      )}
                      {isOwner && !isSelf && (
                        <button
                          onClick={() => setEditingUserId(member.userId)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Editar nombre"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {canRemove && !isSelf && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar miembro"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
