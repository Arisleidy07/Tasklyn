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
  const [icon, setIcon] = useState(list.icon || "");
  const [backgroundImage, setBackgroundImage] = useState(
    list.backgroundImage || "",
  );
  const [color, setColor] = useState(list.color || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab ?? "details");
      setName(list.name);
      setDescription(list.description || "");
      setTeamId(list.teamId || "");
      setIcon(list.icon || "");
      setBackgroundImage(list.backgroundImage || "");
      setColor(list.color || "");
      setSaved(false);
      setConfirmRemove(null);
    }
  }, [
    isOpen,
    defaultTab,
    list.name,
    list.description,
    list.teamId,
    list.icon,
    list.backgroundImage,
    list.color,
  ]);

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
        icon: icon || undefined,
        backgroundImage: backgroundImage || undefined,
        color: color || undefined,
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
    <Modal isOpen={isOpen} onClose={onClose} title="" size="task">
      <div className="space-y-5">
        {/* Header con emoji y nombre */}
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            {icon || "📋"}
          </div>
          <div className="flex-1 min-w-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la lista"
              disabled={!canEdit}
              className="w-full text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ color: "var(--text-primary)" }}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              disabled={!canEdit}
              rows={1}
              className="w-full text-sm bg-transparent border-none focus:outline-none focus:ring-0 resize-none disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{ color: "var(--text-secondary)" }}
            />
          </div>
        </div>

        {/* Emoji selector */}
        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-tertiary)" }}
          >
            Emoji
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              "📋",
              "🏠",
              "💼",
              "🎯",
              "⭐",
              "🔥",
              "💡",
              "🚀",
              "📚",
              "🎨",
              "🎵",
              "🎮",
            ].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                disabled={!canEdit}
                className="w-10 h-10 rounded-xl text-xl hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor:
                    icon === emoji
                      ? "var(--bg-tertiary)"
                      : "var(--bg-secondary)",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Color selector para círculo del sidebar */}
        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-tertiary)" }}
          >
            Color del círculo
          </label>
          <div className="flex gap-2">
            {[
              { value: "#3b82f6", label: "🔵" },
              { value: "#8b5cf6", label: "🟣" },
              { value: "#22c55e", label: "🟢" },
              { value: "#f97316", label: "🟠" },
              { value: "#ef4444", label: "🔴" },
              { value: "#eab308", label: "🟡" },
              { value: "#1f2937", label: "⚫" },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setColor(value)}
                disabled={!canEdit}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: value,
                  border:
                    color === value
                      ? "2px solid white"
                      : "2px solid transparent",
                  boxShadow:
                    color === value ? "0 0 0 2px var(--border-color)" : "none",
                }}
                title={label}
              />
            ))}
          </div>
        </div>

        {/* Imagen de fondo */}
        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-tertiary)" }}
          >
            Imagen de fondo
          </label>
          <input
            value={backgroundImage}
            onChange={(e) => setBackgroundImage(e.target.value)}
            placeholder="https://..."
            disabled={!canEdit}
            className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
          {backgroundImage && (
            <div
              className="w-full h-20 rounded-xl bg-cover bg-center mt-2"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            />
          )}
          <details className="mt-2">
            <summary
              className="text-xs font-medium cursor-pointer hover:underline"
              style={{ color: "var(--text-link)" }}
            >
              Ver fondos sugeridos
            </summary>
            <div className="mt-3 space-y-4">
              {/* Paisajes */}
              <div>
                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Paisajes
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
                    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
                    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
                  ].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setBackgroundImage(url)}
                      disabled={!canEdit}
                      className="w-full h-16 rounded-lg bg-cover bg-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage: `url(${url})`,
                        border:
                          backgroundImage === url
                            ? "2px solid #2563eb"
                            : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Naturaleza */}
              <div>
                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Naturaleza
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
                    "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&q=80",
                    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
                  ].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setBackgroundImage(url)}
                      disabled={!canEdit}
                      className="w-full h-16 rounded-lg bg-cover bg-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage: `url(${url})`,
                        border:
                          backgroundImage === url
                            ? "2px solid #2563eb"
                            : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Montañas */}
              <div>
                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Montañas
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
                    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
                    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80",
                  ].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setBackgroundImage(url)}
                      disabled={!canEdit}
                      className="w-full h-16 rounded-lg bg-cover bg-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage: `url(${url})`,
                        border:
                          backgroundImage === url
                            ? "2px solid #2563eb"
                            : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Ciudad */}
              <div>
                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Ciudad
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
                    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
                    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
                  ].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setBackgroundImage(url)}
                      disabled={!canEdit}
                      className="w-full h-16 rounded-lg bg-cover bg-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage: `url(${url})`,
                        border:
                          backgroundImage === url
                            ? "2px solid #2563eb"
                            : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Minimalismo */}
              <div>
                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Minimalismo
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&q=80",
                    "https://images.unsplash.com/photo-1507643179173-442f06a5d9b9?w=800&q=80",
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
                  ].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setBackgroundImage(url)}
                      disabled={!canEdit}
                      className="w-full h-16 rounded-lg bg-cover bg-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage: `url(${url})`,
                        border:
                          backgroundImage === url
                            ? "2px solid #2563eb"
                            : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Oficina */}
              <div>
                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Oficina
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
                    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80",
                    "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80",
                  ].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setBackgroundImage(url)}
                      disabled={!canEdit}
                      className="w-full h-16 rounded-lg bg-cover bg-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage: `url(${url})`,
                        border:
                          backgroundImage === url
                            ? "2px solid #2563eb"
                            : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Tecnología */}
              <div>
                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Tecnología
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
                    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
                    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
                  ].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setBackgroundImage(url)}
                      disabled={!canEdit}
                      className="w-full h-16 rounded-lg bg-cover bg-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundImage: `url(${url})`,
                        border:
                          backgroundImage === url
                            ? "2px solid #2563eb"
                            : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Gradientes */}
              <div>
                <p
                  className="text-[11px] mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Gradientes
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                  ].map((gradient) => (
                    <button
                      key={gradient}
                      type="button"
                      onClick={() => setBackgroundImage(gradient)}
                      disabled={!canEdit}
                      className="w-full h-16 rounded-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: gradient,
                        border:
                          backgroundImage === gradient
                            ? "2px solid #2563eb"
                            : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-between pt-4 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            {myRole === "owner" && (
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm("¿Eliminar esta lista permanentemente?")) {
                    // Handle delete
                    onClose();
                  }
                }}
                className="text-sm"
              >
                Eliminar
              </Button>
            )}
            <Button
              onClick={handleSaveDetails}
              disabled={!name.trim() || isSaving}
              isLoading={isSaving}
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
