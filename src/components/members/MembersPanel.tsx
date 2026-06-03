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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MembersPanelProps {
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
  admin: "blue",
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
      className="flex items-center gap-1.5 flex-1 min-w-0"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(value)}
        placeholder={originalName}
        className="flex-1 min-w-0 h-7 px-2 rounded-md border border-blue-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
      <button
        type="submit"
        className="p-1 rounded-md text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded-md text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <XIcon size={14} />
      </button>
    </form>
  );
}

export default function MembersPanel({
  list,
  memberNames,
  originalNames,
  isOpen,
  onClose,
}: MembersPanelProps) {
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
      setInviteError("Este usuario ya es miembro de la lista.");
      return;
    }

    setIsSending(true);
    setInviteError(null);
    try {
      const result = await sendEmailInvitation({
        listId: list.id,
        listName: list.name,
        invitedBy: user.id,
        inviterName: user.name,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteSent({ email: inviteEmail.trim(), notified: result.notified });
      setInviteEmail("");
      setInviteRole("viewer");
      setTimeout(() => setInviteSent(null), 5000);
    } catch {
      setInviteError("No se pudo enviar la invitación. Intenta de nuevo.");
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
      title="Miembros"
      description={`Gestiona quién tiene acceso a "${list.name}"`}
      size="md"
    >
      <div className="space-y-5">
        {/* Email invite section */}
        {canInvite && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus size={15} className="text-blue-600" />
              <p className="text-sm font-semibold text-gray-800">
                Invitar por correo
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendInvitation()}
                  placeholder="correo@ejemplo.com"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select
                  options={roleOptions}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="!h-9 !text-sm flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleSendInvitation}
                  isLoading={isSending}
                  icon={<Send size={13} />}
                  className="h-9 px-4"
                >
                  Enviar invitación
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {inviteError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  {inviteError}
                </motion.p>
              )}
              {inviteSent && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200"
                >
                  <CheckCircle2
                    size={14}
                    className="text-green-600 flex-shrink-0"
                  />
                  <p className="text-xs text-green-700">
                    {inviteSent.notified
                      ? `Notificación enviada a ${inviteSent.email} dentro de TASKLYN.`
                      : `Correo de invitación enviado a ${inviteSent.email}.`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Members list */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Miembros ({list.members.length})
          </p>
          <div className="space-y-1">
            {list.members.map((member) => {
              const isOwnerMember = member.role === "owner";
              const isSelf = member.userId === user.id;
              const displayName = memberNames[member.userId] || "Unknown";
              const hasCustomName = !!list.customNames[member.userId];
              const isEditing = editingUserId === member.userId;

              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Avatar name={displayName} size="sm" />

                  {/* Name area */}
                  {isEditing ? (
                    <InlineNameEditor
                      currentName={
                        list.customNames[member.userId] || displayName
                      }
                      originalName={displayName}
                      onSave={(name) =>
                        handleSaveCustomName(member.userId, name)
                      }
                      onCancel={() => setEditingUserId(null)}
                    />
                  ) : (
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {displayName}
                          {isSelf && (
                            <span className="text-gray-400 ml-1">(you)</span>
                          )}
                        </p>
                        {hasCustomName && (
                          <p className="text-[11px] text-gray-400 truncate">
                            Original:{" "}
                            {originalNames[member.userId] || "Unknown"}
                          </p>
                        )}
                      </div>
                      {isOwner && !isOwnerMember && (
                        <button
                          onClick={() => setEditingUserId(member.userId)}
                          className="flex-shrink-0 p-1 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit display name for this list"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Role / actions (only show when NOT editing) */}
                  {!isEditing && (
                    <>
                      {isOwnerMember ? (
                        <Badge variant="blue">
                          <Shield size={10} className="mr-1" />
                          Owner
                        </Badge>
                      ) : canManageRoles && !isSelf ? (
                        <div className="flex items-center gap-2">
                          <Select
                            options={roleOptions}
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.userId, e.target.value)
                            }
                            className="!h-8 !text-xs"
                          />
                          {canRemove && (
                            <button
                              onClick={() => handleRemoveMember(member.userId)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <Badge variant={roleBadgeVariant[member.role]}>
                          {member.role}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
