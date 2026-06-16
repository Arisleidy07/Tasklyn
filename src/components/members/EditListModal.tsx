"use client";

import React, { useState, useEffect } from "react";
import { TaskList, MemberRole } from "@/types";
import { useListStore } from "@/stores/listStore";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import {
  getUserRole,
  canChangeRoles,
  canRemoveMembers,
  canEditList,
} from "@/lib/permissions";
import Avatar from "@/components/ui/Avatar";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  Trash2,
  Users,
  Pencil,
  Save,
  Crown,
  Eye,
  Edit3,
  Mail,
  Check,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/types";

type TabId = "details" | "members";

interface EditListModalProps {
  list: TaskList;
  memberProfiles: Record<string, User>;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: TabId;
}

const roleOptions: { value: string; label: string }[] = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const roleConfig: Record<
  MemberRole,
  { label: string; icon: React.ReactNode; pill: string }
> = {
  owner: {
    label: "Owner",
    icon: <Crown size={11} />,
    pill: "bg-blue-100 text-blue-700",
  },
  admin: {
    label: "Admin",
    icon: <Crown size={11} />,
    pill: "bg-purple-100 text-purple-700",
  },
  editor: {
    label: "Editor",
    icon: <Edit3 size={11} />,
    pill: "bg-sky-100 text-sky-700",
  },
  viewer: {
    label: "Viewer",
    icon: <Eye size={11} />,
    pill: "bg-gray-100 text-gray-600",
  },
};

export default function EditListModal({
  list,
  memberProfiles,
  isOpen,
  onClose,
  defaultTab,
}: EditListModalProps) {
  const { user } = useAuthStore();
  const { updateList, updateMemberRole, removeMember } = useListStore();
  const { teams } = useTeamStore();

  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");
  const [teamId, setTeamId] = useState(list.teamId || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab ?? "details");
      setName(list.name);
      setDescription(list.description || "");
      setTeamId(list.teamId || "");
      setSaved(false);
      setConfirmRemove(null);
    }
  }, [isOpen, defaultTab, list.name, list.description, list.teamId]);

  if (!user) return null;

  const myRole = getUserRole(list, user.id);
  const canEdit = canEditList(myRole);
  const canManageRoles = canChangeRoles(myRole);
  const canRemove = canRemoveMembers(myRole);

  const handleSaveDetails = async () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await updateList(list.id, {
        name: name.trim(),
        description: description.trim(),
        teamId: teamId || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    updateMemberRole(list.id, memberId, newRole as MemberRole);
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember(list.id, memberId);
    setConfirmRemove(null);
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "details", label: "Detalles", icon: <Pencil size={13} /> },
    {
      id: "members",
      label: `Miembros (${list.members.length})`,
      icon: <Users size={13} />,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar lista"
      description={list.name}
      size="task"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
              style={
                activeTab === tab.id
                  ? {
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }
                  : { color: "var(--text-secondary)" }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Details Tab ── */}
          {activeTab === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Section: Nombre */}
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold uppercase tracking-wide block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nombre de la lista
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveDetails()}
                  placeholder="Mi lista de tareas"
                  disabled={!canEdit}
                  className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Section: Descripción */}
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold uppercase tracking-wide block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Descripción{" "}
                  <span
                    className="font-normal"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    (opcional)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el propósito de esta lista..."
                  disabled={!canEdit}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    border: "1px solid var(--border-input)",
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Section: Equipo */}
              {teams.length > 0 && (
                <div className="space-y-2">
                  <label
                    className="text-xs font-semibold uppercase tracking-wide block"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Equipo
                  </label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    disabled={!canEdit}
                    className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      border: "1px solid var(--border-input)",
                      backgroundColor: "var(--bg-input)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="">Sin equipo</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Section: Información */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Tipo
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {list.type === "shared" ? "Compartida" : "Personal"}
                  </p>
                </div>
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Tu rol
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                      myRole
                        ? roleConfig[myRole].pill
                        : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {myRole && roleConfig[myRole].icon}
                    {myRole ? roleConfig[myRole].label : "Sin rol"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {canEdit && (
                <div
                  className="flex items-center justify-end gap-3 pt-4 border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <Button variant="ghost" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveDetails}
                    isLoading={isSaving}
                    disabled={!name.trim() || isSaving}
                    icon={
                      saved ? (
                        <Check size={16} className="text-white" />
                      ) : (
                        <Save size={16} />
                      )
                    }
                  >
                    {saved ? "¡Guardado!" : "Guardar cambios"}
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Members Tab ── */}
          {activeTab === "members" && (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3"
            >
              {list.members.map((member, index) => {
                const profile = memberProfiles[member.userId];
                const isOwnerMember = member.role === "owner";
                const isSelf = member.userId === user.id;
                const displayName =
                  profile?.name || (isSelf ? user.name : "Cargando...");
                const displayEmail = profile?.email || "";
                const photoURL = profile?.photoURL || "";
                const isConfirmingRemove = confirmRemove === member.userId;

                return (
                  <motion.div
                    key={member.userId}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border transition-all duration-200 overflow-hidden"
                    style={
                      isConfirmingRemove
                        ? {
                            borderColor: "rgba(239,68,68,0.3)",
                            backgroundColor: "rgba(239,68,68,0.06)",
                          }
                        : {
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--bg-card)",
                          }
                    }
                  >
                    {isConfirmingRemove ? (
                      <div className="flex items-center gap-3 p-4">
                        <AlertTriangle
                          size={18}
                          className="text-red-500 flex-shrink-0"
                        />
                        <p
                          className="flex-1 text-sm font-medium"
                          style={{ color: "#dc2626" }}
                        >
                          ¿Eliminar a{" "}
                          <span className="font-bold">{displayName}</span>?
                        </p>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                            style={{
                              color: "var(--text-secondary)",
                              backgroundColor: "var(--bg-card)",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <Avatar
                            name={displayName}
                            photoURL={photoURL}
                            size="lg"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className="font-semibold text-sm truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {displayName}
                            </p>
                            {isSelf && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold flex-shrink-0"
                                style={{
                                  backgroundColor: "rgba(37,99,235,0.1)",
                                  color: "var(--text-link)",
                                }}
                              >
                                Tú
                              </span>
                            )}
                          </div>
                          {displayEmail && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Mail
                                size={9}
                                className="flex-shrink-0"
                                style={{ color: "var(--text-tertiary)" }}
                              />
                              <p
                                className="text-[11px] truncate"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                {displayEmail}
                              </p>
                            </div>
                          )}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                              roleConfig[member.role].pill,
                            )}
                          >
                            {roleConfig[member.role].icon}
                            {roleConfig[member.role].label}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {canManageRoles && !isOwnerMember && (
                            <Select
                              options={roleOptions}
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(member.userId, e.target.value)
                              }
                              className="!h-9 !text-xs !w-28"
                            />
                          )}
                          {canRemove && !isSelf && !isOwnerMember && (
                            <button
                              onClick={() => setConfirmRemove(member.userId)}
                              className="p-2 rounded-lg transition-colors flex items-center justify-center"
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
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {list.members.length === 0 && (
                <div
                  className="text-center py-10 text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  No hay miembros en esta lista
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
