"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
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
  X,
  Lock,
} from "lucide-react";
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
  const gradient = getTeamGradient(team.id);

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
      whileHover={{ y: -4, boxShadow: "0 24px 48px -12px rgba(0,0,0,0.15)" }}
      className="group relative bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-blue-200/80 dark:hover:border-blue-500/30 transition-all duration-300"
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg text-white text-lg font-bold flex-shrink-0",
                gradient,
              )}
            >
              {team.icon || team.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 leading-tight">
                  {team.name}
                </h3>
                {team.isPersonal && (
                  <Lock
                    size={12}
                    className="text-gray-400 dark:text-slate-500 flex-shrink-0"
                  />
                )}
              </div>
              {team.description && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {team.description}
                </p>
              )}
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 flex-shrink-0">
            <RoleIcon size={10} />
            {roleLabel}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: Users, label: "Miembros", value: team.members.length },
            { icon: FolderOpen, label: "Listas", value: listCount },
            { icon: ClipboardList, label: "Tareas", value: taskCount },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50"
            >
              <s.icon size={14} className="text-gray-400 dark:text-slate-500" />
              <span className="text-lg font-bold text-gray-900 dark:text-slate-100 tabular-nums leading-none">
                {s.value}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 size={11} />
              Progreso
            </span>
            <span className="font-semibold text-gray-700 dark:text-slate-300">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                gradient,
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Members avatars + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {team.members.slice(0, 5).map((m, i) => (
              <div
                key={m.userId}
                className={cn(
                  "w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[10px] font-bold shadow-sm bg-gradient-to-br",
                  gradient,
                )}
                style={{ zIndex: 10 - i }}
              >
                {m.userId.charAt(0).toUpperCase()}
              </div>
            ))}
            {team.members.length > 5 && (
              <div
                className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 text-[10px] font-medium"
                style={{ zIndex: 0 }}
              >
                +{team.members.length - 5}
              </div>
            )}
          </div>

          <Link
            href={`/teams/${team.id}`}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
              "bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900",
              "hover:opacity-90 active:scale-95 shadow-sm",
            )}
          >
            Ver equipo
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Create Team Modal ────────────────────────────────────────────────────────
function CreateTeamModal({
  onClose,
  onSubmit,
  loading,
}: {
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
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200/80 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                  Nuevo equipo
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Configura tu espacio de trabajo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Marketing, Ventas, Desarrollo..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                autoFocus
                maxLength={60}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Descripción{" "}
                <span className="text-gray-400 dark:text-slate-500 font-normal">
                  (opcional)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Para qué es este equipo?"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none transition-all"
                maxLength={200}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={onClose}
                type="button"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creando...
                  </span>
                ) : (
                  "Crear equipo"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </>,
    document.body,
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
    } catch (err) {
      console.error("Failed to create team:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header
        title="Equipos"
        description={`${workTeams.length} equipo${workTeams.length !== 1 ? "s" : ""} de trabajo`}
        showMenuButton={true}
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
          >
            Nuevo equipo
          </Button>
        }
      />

      <div className="p-3 sm:p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 pb-24 md:pb-8">
        {/* Personal workspace card */}
        {personalTeam && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">
              Espacio personal
            </p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-600" />
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base shadow-lg">
                    👤
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        Personal
                      </h3>
                      <Lock
                        size={11}
                        className="text-gray-400 dark:text-slate-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Tu espacio privado ·{" "}
                      {getTeamStats(personalTeam.id).listCount} listas ·{" "}
                      {getTeamStats(personalTeam.id).taskCount} tareas
                    </p>
                  </div>
                </div>
                <Link
                  href={`/teams/${personalTeam.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors flex-shrink-0"
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
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
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
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
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Users
                  size={28}
                  className="text-gray-400 dark:text-slate-500"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                Sin equipos de trabajo
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
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
              <p className="text-sm text-gray-500 dark:text-slate-400">
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

      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTeam}
          loading={loading}
        />
      )}
    </>
  );
}
