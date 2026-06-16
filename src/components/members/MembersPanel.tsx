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
        className="flex-1 min-w-0 h-7 px-2 rounded-md border border-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        style={{
          backgroundColor: "var(--bg-input)",
          color: "var(--text-primary)",
        }}
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
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Miembros
          </h2>
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {list.members.length}
          </span>
        </div>

        {/* Email invite section */}
        {canInvite && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendInvitation()}
                placeholder="Invitar por correo..."
                className="flex-1 h-10 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                style={{
                  border: "1px solid var(--border-input)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              <Button
                size="sm"
                onClick={handleSendInvitation}
                isLoading={isSending}
                className="h-10 px-4"
              >
                Invitar
              </Button>
            </div>
            <AnimatePresence>
              {inviteError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-red-500"
                >
                  {inviteError}
                </motion.p>
              )}
              {inviteSent && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-green-600"
                >
                  Invitación enviada
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Members list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {list.members.map((member) => {
            const isOwnerMember = member.role === "owner";
            const isSelf = member.userId === user.id;
            const displayName = memberNames[member.userId] || "Cargando...";
            const hasCustomName = !!list.customNames[member.userId];
            const isEditing = editingUserId === member.userId;

            return (
              <div
                key={member.userId}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                style={{ backgroundColor: "var(--bg-card)" }}
              >
                <Avatar name={displayName} size="md" />

                {/* Name area */}
                {isEditing ? (
                  <InlineNameEditor
                    currentName={list.customNames[member.userId] || displayName}
                    originalName={displayName}
                    onSave={(name) => handleSaveCustomName(member.userId, name)}
                    onCancel={() => setEditingUserId(null)}
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {displayName}
                      </p>
                      {isSelf && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: "rgba(37,99,235,0.1)",
                            color: "var(--text-link)",
                          }}
                        >
                          Tú
                        </span>
                      )}
                    </div>
                    {hasCustomName && (
                      <p
                        className="text-[11px] truncate"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {originalNames[member.userId] || "Usuario"}
                      </p>
                    )}
                  </div>
                )}

                {/* Role / actions */}
                {!isEditing && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOwnerMember ? (
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: "rgba(59,130,246,0.1)",
                          color: "#3b82f6",
                        }}
                      >
                        Owner
                      </span>
                    ) : canManageRoles && !isSelf ? (
                      <>
                        <Select
                          options={roleOptions}
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.userId, e.target.value)
                          }
                          className="!h-8 !text-xs w-24"
                        />
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: "var(--text-tertiary)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#ef4444";
                              e.currentTarget.style.backgroundColor =
                                "rgba(239,68,68,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color =
                                "var(--text-tertiary)";
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    ) : (
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full capitalize"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {member.role}
                      </span>
                    )}
                    {isOwner && !isOwnerMember && !isEditing && (
                      <button
                        onClick={() => setEditingUserId(member.userId)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--text-link)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-tertiary)";
                        }}
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
