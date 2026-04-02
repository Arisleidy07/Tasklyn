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
  Link2,
  Copy,
  Check,
  Shield,
  Pencil,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const roleBadgeVariant: Record<MemberRole, "violet" | "blue" | "default"> = {
  owner: "violet",
  editor: "blue",
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
        className="flex-1 min-w-0 h-7 px-2 rounded-md border border-violet-300 dark:border-violet-500/40 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
      />
      <button
        type="submit"
        className="p-1 rounded-md text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
  const { createInvitation } = useInvitationStore();
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  if (!user) return null;

  const myRole = getUserRole(list, user.id);
  const isOwner = myRole === "owner";
  const canManageRoles = canChangeRoles(myRole);
  const canRemove = canRemoveMembers(myRole);
  const canInvite = canInviteMembers(myRole);

  const handleGenerateLink = () => {
    const invitation = createInvitation(list.id, user.id, "viewer");
    const link = `${window.location.origin}/invite/${invitation.token}`;
    setInviteLink(link);
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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
      title="Members"
      description={`Manage who has access to "${list.name}"`}
      size="md"
    >
      <div className="space-y-5">
        {/* Invite section */}
        {canInvite && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Invite link
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateLink}
                icon={<Link2 size={14} />}
              >
                Generate link
              </Button>
            </div>
            {inviteLink && (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 truncate font-mono">
                  {inviteLink}
                </div>
                <Button
                  size="sm"
                  variant={copied ? "primary" : "outline"}
                  onClick={handleCopyLink}
                  icon={copied ? <Check size={14} /> : <Copy size={14} />}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Members ({list.members.length})
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
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
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
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {displayName}
                          {isSelf && (
                            <span className="text-zinc-400 ml-1">(you)</span>
                          )}
                        </p>
                        {hasCustomName && (
                          <p className="text-[11px] text-zinc-400 truncate">
                            Original:{" "}
                            {originalNames[member.userId] || "Unknown"}
                          </p>
                        )}
                      </div>
                      {isOwner && !isOwnerMember && (
                        <button
                          onClick={() => setEditingUserId(member.userId)}
                          className="flex-shrink-0 p-1 rounded-md text-zinc-300 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
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
                        <Badge variant="violet">
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
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
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
