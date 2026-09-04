"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { TaskList, MemberRole } from "@/types";
import { useListStore } from "@/stores/listStore";
import { useAuthStore } from "@/stores/authStore";
import {
  getUserRole,
  canChangeRoles,
  canRemoveMembers,
} from "@/lib/permissions";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { Trash2, Check, Pencil, X as XIcon } from "lucide-react";
import { motion } from "framer-motion";

interface MembersPanelProps {
  list: TaskList;
  memberNames: Record<string, string>;
  originalNames: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
}

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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const uniqueMembers = useMemo(
    () =>
      Array.from(
        new Map(list.members.map((member) => [member.userId, member])).values(),
      ),
    [list.members],
  );

  if (!user) return null;

  const myRole = getUserRole(list, user.id);
  const isOwner = myRole === "owner";
  const canManageRoles = canChangeRoles(myRole);
  const canRemove = canRemoveMembers(myRole);

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

  const roleColors: Record<
    MemberRole,
    { bg: string; text: string; label: string }
  > = {
    owner: {
      bg: "rgba(234,179,8,0.12)",
      text: "#b45309",
      label: "Propietario",
    },
    admin: { bg: "rgba(59,130,246,0.12)", text: "#2563eb", label: "Admin" },
    editor: { bg: "rgba(16,185,129,0.12)", text: "#059669", label: "Editor" },
    viewer: {
      bg: "rgba(107,114,128,0.12)",
      text: "#6b7280",
      label: "Observador",
    },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Miembros de la lista
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              {uniqueMembers.length}{" "}
              {uniqueMembers.length === 1 ? "miembro" : "miembros"} ·{" "}
              {list.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Members list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 py-3 space-y-1.5">
            {uniqueMembers.map((member) => {
              const isOwnerMember = member.role === "owner";
              const isSelf = member.userId === user.id;
              const displayName = memberNames[member.userId] || "Cargando...";
              const hasCustomName = !!list.customNames[member.userId];
              const isEditing = editingUserId === member.userId;
              const rc = roleColors[member.role] ?? roleColors.viewer;

              return (
                <motion.div
                  key={member.userId}
                  layout
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      "var(--bg-secondary)";
                  }}
                >
                  <Avatar
                    name={displayName}
                    size="md"
                    className="flex-shrink-0"
                  />

                  {/* Name */}
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {displayName}
                        </p>
                        {isSelf && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                            style={{
                              backgroundColor: "rgba(37,99,235,0.1)",
                              color: "#2563eb",
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
                          {originalNames[member.userId]}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Role + actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isOwnerMember ? (
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: rc.bg, color: rc.text }}
                        >
                          {rc.label}
                        </span>
                      ) : canManageRoles && !isSelf ? (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.userId, e.target.value)
                            }
                            className="h-8 px-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none cursor-pointer"
                            style={{
                              border: "1px solid var(--border-input)",
                              backgroundColor: "var(--bg-input)",
                              color: "var(--text-primary)",
                            }}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Observador</option>
                            {myRole === "owner" && (
                              <option value="admin">Admin</option>
                            )}
                          </select>
                          {isOwner && (
                            <button
                              onClick={() => setEditingUserId(member.userId)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: "var(--text-tertiary)" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#2563eb";
                                e.currentTarget.style.backgroundColor =
                                  "rgba(37,99,235,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color =
                                  "var(--text-tertiary)";
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                              title="Editar nombre"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
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
                              title="Eliminar miembro"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </>
                      ) : (
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: rc.bg, color: rc.text }}
                        >
                          {rc.label}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
