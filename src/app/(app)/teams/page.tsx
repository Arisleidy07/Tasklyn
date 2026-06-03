"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Settings,
  Crown,
  Shield,
  User,
  TrendingUp,
  Activity,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  team: any;
  userRole: "owner" | "admin" | "member";
  onEdit?: () => void;
  onManage?: () => void;
}

function TeamCard({ team, userRole, onEdit, onManage }: TeamCardProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown size={14} className="text-yellow-500" />;
      case "admin":
        return <Shield size={14} className="text-blue-500" />;
      default:
        return <User size={14} className="text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800";
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        boxShadow: "0 20px 40px -12px rgba(59,130,246,0.15)",
      }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-white border border-gray-200/80 rounded-2xl p-6 hover:border-blue-200 transition-all duration-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-500/30"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/0 group-hover:to-blue-50/10 dark:to-blue-500/0 dark:group-hover:to-blue-500/5 transition-all duration-500 pointer-events-none rounded-2xl" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {team.name}
            </h3>
            {team.description && (
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {team.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border",
              getRoleColor(userRole),
            )}
          >
            {getRoleIcon(userRole)}
            {userRole === "owner"
              ? "Propietario"
              : userRole === "admin"
                ? "Administrador"
                : "Miembro"}
          </span>

          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {team.stats?.totalTasks || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Tareas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {team.stats?.completedTasks || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Completadas
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {team.members.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Miembros</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-slate-400">
            Progreso del equipo
          </span>
          <span className="font-medium text-gray-900 dark:text-slate-100">
            {team.stats?.totalTasks > 0
              ? Math.round(
                  (team.stats.completedTasks / team.stats.totalTasks) * 100,
                )
              : 0}
            %
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${
                team.stats?.totalTasks > 0
                  ? (team.stats.completedTasks / team.stats.totalTasks) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Members Preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {team.members.slice(0, 4).map((member: any, index: number) => (
              <div
                key={member.userId}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-medium shadow-sm"
                style={{ zIndex: team.members.length - index }}
              >
                {member.name?.charAt(0) || "U"}
              </div>
            ))}
            {team.members.length > 4 && (
              <div
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-gray-600 dark:text-slate-400 text-xs font-medium shadow-sm"
                style={{ zIndex: 0 }}
              >
                +{team.members.length - 4}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {team.members.length} miembro{team.members.length !== 1 ? "s" : ""}
          </span>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => (window.location.href = `/teams/${team.id}`)}
        >
          Ver equipo
        </Button>
      </div>
    </motion.div>
  );
}

interface CreateTeamModalProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
}

function CreateTeamModal({ onClose, onSubmit, loading }: CreateTeamModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200/80 dark:border-slate-800"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              Crear Equipo
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Configura tu nuevo equipo de trabajo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Nombre del equipo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Equipo Ventas, Equipo TI..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Descripción{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Para qué es este equipo?"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
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
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
  );
}

export default function TeamsPage() {
  const { user } = useAuthStore();
  const { teams, createTeam } = useTeamStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateTeam = async (teamData: any) => {
    if (!user?.id) {
      console.error("No user available to create team");
      return;
    }
    setLoading(true);
    try {
      // Simply pass team data (name, description) and ownerId
      // createTeam now handles: owner assignment, members init, settings, stats
      await createTeam(teamData, user.id);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create team:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header
        title="Equipos"
        description={`${teams.length} equipo${teams.length !== 1 ? "s" : ""} disponible${teams.length !== 1 ? "s" : ""}`}
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

      <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar equipos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Activity size={14} className="mr-2" />
              Actividad
            </Button>
            <Button variant="ghost" size="sm">
              <Target size={14} className="mr-2" />
              Metas
            </Button>
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              {searchQuery
                ? "No se encontraron equipos"
                : "Aún no tienes equipos"}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Crea tu primer equipo para colaborar con otros miembros en tareas y proyectos."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<Plus size={16} />}
              >
                Crear equipo
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team, index) => {
              const userRole =
                team.members.find((m: any) => m.userId === user.id)?.role ||
                "member";
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <TeamCard
                    team={team}
                    userRole={userRole}
                    onEdit={() => console.log("Edit team:", team.id)}
                    onManage={() => console.log("Manage team:", team.id)}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
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
