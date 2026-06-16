"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import {
  Users,
  Plus,
  Search,
  Crown,
  Shield,
  User,
  ChevronRight,
  FolderOpen,
  CheckCircle2,
  ClipboardList,
  Lock,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { canCreateMoreTeams } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { Team } from "@/types";

// ── Team color palette ──────────────────────────────────────────────────────
const TEAM_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

function getTeamGradient(teamId: string) {
  const idx = teamId.charCodeAt(0) % TEAM_GRADIENTS.length;
  return TEAM_GRADIENTS[idx];
}

// ── Team Card ────────────────────────────────────────────────────────────────
interface TeamCardProps {
  team: Team;
  userRole: "owner" | "admin" | "member";
  listCount: number;
  taskCount: number;
  completedCount: number;
  index: number;
}

function TeamCard({
  team,
  userRole,
  listCount,
  taskCount,
  completedCount,
  index,
}: TeamCardProps) {
  const progress =
    taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  const roleLabel =
    userRole === "owner"
      ? "Propietario"
      : userRole === "admin"
        ? "Admin"
        : "Miembro";
  const RoleIcon =
    userRole === "owner" ? Crown : userRole === "admin" ? Shield : User;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -2 }}
      className="group relative rounded-2xl p-5 transition-all duration-300"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
            style={{
              backgroundColor: "var(--text-primary)",
              color: "var(--text-on-accent)",
              opacity: 0.9,
            }}
          >
            {team.icon || team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className="text-sm font-semibold leading-tight truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {team.name}
              </h3>
              {team.isPersonal && (
                <Lock
                  size={11}
                  className="flex-shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                />
              )}
            </div>
            {team.description && (
              <p
                className="text-[11px] mt-0.5 line-clamp-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {team.description}
              </p>
            )}
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium flex-shrink-0"
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-secondary)",
          }}
        >
          <RoleIcon size={9} />
          {roleLabel}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4">
        {[
          { icon: Users, label: "Miembros", value: team.members.length },
          { icon: FolderOpen, label: "Listas", value: listCount },
          { icon: ClipboardList, label: "Tareas", value: taskCount },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <s.icon size={13} style={{ color: "var(--text-tertiary)" }} />
            <span
              className="text-sm font-semibold tabular-nums leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              {s.value}
            </span>
            <span
              className="text-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span
            className="flex items-center gap-1"
            style={{ color: "var(--text-secondary)" }}
          >
            <CheckCircle2 size={10} />
            Progreso
          </span>
          <span
            className="font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {progress}%
          </span>
        </div>
        <div
          className="h-1 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--text-primary)",
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* Members avatars + CTA */}
      <div
        className="flex items-center justify-between pt-3 border-t"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="flex -space-x-1.5">
          {team.members.slice(0, 4).map((m, i) => (
            <div
              key={m.userId}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold shadow-sm flex-shrink-0"
              style={{
                zIndex: 10 - i,
                borderColor: "var(--bg-card)",
                backgroundColor: "var(--text-primary)",
                color: "var(--text-on-accent)",
                opacity: 0.8,
              }}
            >
              {m.userId.charAt(0).toUpperCase()}
            </div>
          ))}
          {team.members.length > 4 && (
            <div
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-medium flex-shrink-0"
              style={{
                borderColor: "var(--bg-card)",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-secondary)",
                zIndex: 0,
              }}
            >
              +{team.members.length - 4}
            </div>
          )}
        </div>

        <Link
          href={`/teams/${team.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
          style={{
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
          }}
        >
          Ver
          <ChevronRight size={11} />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Create Team Modal ────────────────────────────────────────────────────────
function CreateTeamModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del equipo es requerido.");
      return;
    }
    setError("");
    await onSubmit({ name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo equipo"
      description="Configura tu espacio de trabajo"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Marketing, Ventas, Desarrollo..."
            className="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
            autoFocus
            maxLength={60}
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-sm font-medium"
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
            placeholder="¿Para qué es este equipo?"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl text-sm resize-none transition-all outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              border: "1px solid var(--border-input)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
            maxLength={200}
          />
        </div>

        {error && (
          <p
            className="text-sm flex items-center gap-1.5"
            style={{ color: "#dc2626" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            className="flex-1"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={loading}
            disabled={loading || !name.trim()}
          >
            {loading ? "Creando..." : "Crear equipo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TeamsPage() {
  const { user } = useAuthStore();
  const { teams, createTeam } = useTeamStore();
  const { lists } = useListStore();
  const { tasks } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const workTeams = teams.filter((t) => !t.isPersonal);
  const personalTeam = teams.find((t) => t.isPersonal && t.owner === user.id);

  const filtered = workTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getTeamStats = (teamId: string) => {
    const teamLists = lists.filter((l) => l.teamId === teamId);
    const teamTasks = tasks.filter((tk) =>
      teamLists.some((l) => l.id === tk.listId),
    );
    return {
      listCount: teamLists.length,
      taskCount: teamTasks.length,
      completedCount: teamTasks.filter((tk) => tk.status === "completed")
        .length,
    };
  };

  const handleCreateTeam = async (data: {
    name: string;
    description: string;
  }) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await createTeam({ ...data, owner: user.id }, user.id);
      setShowCreateModal(false);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleNewTeamClick = () => {
    if (!canCreateMoreTeams(workTeams.length, user.plan)) {
      setShowUpgradeModal(true);
    } else {
      setShowCreateModal(true);
    }
  };

  return (
    <>
      <Header
        title="Equipos"
        description={`${workTeams.length} equipo${workTeams.length !== 1 ? "s" : ""} de trabajo`}
        showMenuButton={true}
        actions={
          <Button onClick={handleNewTeamClick} icon={<Plus size={16} />}>
            Nuevo equipo
          </Button>
        }
      />

      <div className="p-3 sm:p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 pb-24 md:pb-8">
        {/* Personal workspace card */}
        {personalTeam && (
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              Espacio personal
            </p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base shadow-lg"
                    style={{ color: "var(--text-on-accent)" }}
                  >
                    👤
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Personal
                      </h3>
                      <Lock
                        size={11}
                        style={{ color: "var(--text-tertiary)" }}
                      />
                    </div>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Tu espacio privado ·{" "}
                      {getTeamStats(personalTeam.id).listCount} listas ·{" "}
                      {getTeamStats(personalTeam.id).taskCount} tareas
                    </p>
                  </div>
                </div>
                <Link
                  href={`/teams/${personalTeam.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex-shrink-0"
                  style={{ color: "var(--text-link)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "rgba(37,99,235,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent";
                  }}
                >
                  Ver <ChevronRight size={13} />
                </Link>
              </div>
            </motion.div>
          </div>
        )}

        {/* Work teams */}
        <div>
          {workTeams.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-tertiary)" }}
              >
                Equipos de trabajo
              </p>
              {workTeams.length > 3 && (
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar equipos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                    style={{
                      border: "1px solid var(--border-input)",
                      backgroundColor: "var(--bg-input)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {workTeams.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "var(--bg-secondary)" }}
              >
                <Users size={28} style={{ color: "var(--text-tertiary)" }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Sin equipos de trabajo
              </h3>
              <p
                className="text-sm mb-6 max-w-xs mx-auto"
                style={{ color: "var(--text-secondary)" }}
              >
                Crea un equipo para colaborar con otros miembros en tareas y
                proyectos.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={16} />}
              >
                Crear equipo
              </Button>
            </motion.div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No se encontraron equipos para "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((team, index) => {
                const userRole =
                  (team.members.find((m) => m.userId === user.id)?.role as
                    | "owner"
                    | "admin"
                    | "member") || "member";
                const stats = getTeamStats(team.id);
                return (
                  <TeamCard
                    key={team.id}
                    team={team}
                    userRole={userRole}
                    listCount={stats.listCount}
                    taskCount={stats.taskCount}
                    completedCount={stats.completedCount}
                    index={index}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTeam}
        loading={loading}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="equipos de trabajo"
        description="Tu plan Free incluye 1 equipo de trabajo. Actualiza a Pro para crear equipos ilimitados."
      />
    </>
  );
}
