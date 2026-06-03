"use client";

import React, { useState, useEffect } from "react";
import { TaskList, MemberRole } from "@/types";
import { useListStore } from "@/stores/listStore";
import { useAuthStore } from "@/stores/authStore";
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

  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab ?? "details");
      setName(list.name);
      setDescription(list.description || "");
      setSaved(false);
      setConfirmRemove(null);
    }
  }, [isOpen, defaultTab, list.name, list.description]);

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
      size="xl"
    >
      {/* Tabs */}
      <div className="flex bg-gray-100/80 rounded-xl p-1 mb-6 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
              activeTab === tab.id
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700",
            )}
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
            className="space-y-5"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Nombre de la lista
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveDetails()}
                placeholder="Mi lista de tareas"
                disabled={!canEdit}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                Descripción{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el propósito de esta lista..."
                disabled={!canEdit}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* List meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Tipo</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {list.type === "shared" ? "Compartida" : "Personal"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Tu rol</p>
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

            {canEdit && (
              <Button
                onClick={handleSaveDetails}
                isLoading={isSaving}
                disabled={!name.trim() || isSaving}
                className="w-full"
                icon={
                  saved ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <Save size={16} />
                  )
                }
              >
                {saved ? "¡Cambios guardados!" : "Guardar cambios"}
              </Button>
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
            className="space-y-2"
          >
            {list.members.map((member, index) => {
              const profile = memberProfiles[member.userId];
              const isOwnerMember = member.role === "owner";
              const isSelf = member.userId === user.id;
              const displayName =
                profile?.name || (isSelf ? user.name : `Miembro ${index + 1}`);
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
                  className={cn(
                    "rounded-xl border transition-all duration-200 overflow-hidden",
                    isConfirmingRemove
                      ? "border-red-200 bg-red-50"
                      : "border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200 hover:shadow-sm",
                  )}
                >
                  {isConfirmingRemove ? (
                    <div className="flex items-center gap-3 p-4">
                      <AlertTriangle
                        size={18}
                        className="text-red-500 flex-shrink-0"
                      />
                      <p className="flex-1 text-sm text-red-700 font-medium">
                        ¿Eliminar a{" "}
                        <span className="font-bold">{displayName}</span>?
                      </p>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {displayName}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md font-semibold flex-shrink-0">
                              Tú
                            </span>
                          )}
                        </div>
                        {displayEmail && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail
                              size={9}
                              className="text-gray-400 flex-shrink-0"
                            />
                            <p className="text-[11px] text-gray-500 truncate">
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
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
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
              <div className="text-center py-10 text-gray-400 text-sm">
                No hay miembros en esta lista
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
