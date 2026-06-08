"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { useTaskStore } from "@/stores/taskStore";
import { useListStore } from "@/stores/listStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import {
  Users,
  Crown,
  Shield,
  User,
  Plus,
  Settings,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Mail,
  MoreVertical,
  ArrowLeft,
  FolderOpen,
  Target,
  Star,
  Edit3,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUser } from "@/lib/firestore";
import type { User as UserType } from "@/types";

interface MemberProfile extends UserType {
  role: "owner" | "admin" | "member";
  joinedAt: string;
  completedTasks: number;
  totalTasks: number;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { user } = useAuthStore();
  const { getTeamById, removeTeamMember, updateTeamMemberRole, updateTeam } =
    useTeamStore();
  const { tasks } = useTaskStore();
  const { getUserLists } = useListStore();
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "lists">(
    "overview",
  );
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const team = getTeamById(teamId);

  useEffect(() => {
    if (!team) return;
    setNewTeamName(team.name);
    const loadProfiles = async () => {
      setLoadingProfiles(true);
      const profiles = await Promise.all(
        team.members.map(async (member) => {
          const profile = await getUser(member.userId);
          const memberTasks = tasks.filter(
            (t) =>
              t.assignedTo === member.userId || t.createdBy === member.userId,
          );
          const completedTasks = memberTasks.filter(
            (t) => t.status === "completed",
          ).length;
          return {
            id: member.userId,
            name: profile?.name || "Miembro",
            email: profile?.email || "",
            photoURL: profile?.photoURL || "",
            plan: profile?.plan || "FREE",
            createdAt: profile?.createdAt || "",
            role: member.role,
            joinedAt: member.joinedAt,
            completedTasks,
            totalTasks: memberTasks.length,
          } as MemberProfile;
        }),
      );
      setMemberProfiles(profiles);
      setLoadingProfiles(false);
    };
    loadProfiles();
  }, [team, tasks]);

  if (!user || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-slate-400">
            Equipo no encontrado
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push("/teams")}
            className="mt-4"
          >
            <ArrowLeft size={16} className="mr-2" /> Volver
          </Button>
        </div>
      </div>
    );
  }

  const userRole =
    team.members.find((m) => m.userId === user.id)?.role || "member";
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";
  const teamTasks = tasks.filter((t) =>
    team.members.some(
      (m) => m.userId === t.assignedTo || m.userId === t.createdBy,
    ),
  );
  const completedTasks = teamTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const pendingTasks = teamTasks.filter((t) => t.status === "pending").length;
  const overdueTasks = teamTasks.filter(
    (t) =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed",
  ).length;
  const completionRate =
    teamTasks.length > 0
      ? Math.round((completedTasks / teamTasks.length) * 100)
      : 0;

  const allLists = getUserLists(user.id);
  const teamLists = allLists.filter((l) => l.teamId === teamId);

  const getRoleIcon = (role: string) => {
    if (role === "owner")
      return <Crown size={12} className="text-yellow-500" />;
    if (role === "admin") return <Shield size={12} className="text-blue-500" />;
    return <User size={12} className="text-gray-400" />;
  };

  const getRoleLabel = (role: string) => {
    if (role === "owner") return "Propietario";
    if (role === "admin") return "Administrador";
    return "Miembro";
  };

  const getRoleBadge = (role: string) => {
    if (role === "owner")
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800";
    if (role === "admin")
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
    return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwnerOrAdmin || memberId === user.id) return;
    setActionLoading(memberId);
    try {
      await removeTeamMember(teamId, memberId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    newRole: "owner" | "admin" | "member",
  ) => {
    if (userRole !== "owner") return;
    setActionLoading(memberId);
    try {
      await updateTeamMemberRole(teamId, memberId, newRole);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveTeamName = async () => {
    if (!newTeamName.trim() || newTeamName === team.name) {
      setEditingName(false);
      return;
    }
    try {
      await updateTeam(teamId, { name: newTeamName.trim() });
    } finally {
      setEditingName(false);
    }
  };

  return (
    <>
      <Header
        title={team.name}
        description={`${team.members.length} miembros · ${completionRate}% de cumplimiento`}
        showMenuButton={true}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/teams")}
            >
              <ArrowLeft size={14} className="mr-1.5" /> Equipos
            </Button>
            {isOwnerOrAdmin && (
              <Button
                size="sm"
                onClick={() => setShowInviteModal(true)}
                icon={<Plus size={14} />}
              >
                Agregar miembro
              </Button>
            )}
          </div>
        }
      />

      <div className="p-3 sm:p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total tareas",
              value: teamTasks.length,
              icon: BarChart3,
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-500/20",
            },
            {
              label: "Completadas",
              value: completedTasks,
              icon: CheckCircle2,
              color: "text-green-600",
              bg: "bg-green-50 dark:bg-green-500/20",
            },
            {
              label: "Pendientes",
              value: pendingTasks,
              icon: Clock,
              color: "text-yellow-600",
              bg: "bg-yellow-50 dark:bg-yellow-500/20",
            },
            {
              label: "Vencidas",
              value: overdueTasks,
              icon: AlertTriangle,
              color: "text-red-600",
              bg: "bg-red-50 dark:bg-red-500/20",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    stat.bg,
                  )}
                >
                  <stat.icon size={16} className={stat.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-slate-100">
                Progreso General del Equipo
              </span>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full"
            />
          </div>
          <div className="flex items-center gap-6 mt-3 text-sm text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {completedTasks} completadas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              {pendingTasks} pendientes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {overdueTasks} vencidas
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-fit">
          {(["overview", "members", "lists"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === tab
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300",
              )}
            >
              {tab === "overview"
                ? "Resumen"
                : tab === "members"
                  ? `Miembros (${team.members.length})`
                  : `Listas (${teamLists.length})`}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Top performers */}
            <div className="p-6 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                  Mejores Miembros
                </h3>
              </div>
              {loadingProfiles ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {memberProfiles
                    .sort((a, b) => b.completedTasks - a.completedTasks)
                    .slice(0, 5)
                    .map((member, idx) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            idx === 0
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                              : idx === 1
                                ? "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                                : idx === 2
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
                                  : "bg-gray-50 text-gray-500 dark:bg-slate-800/50 dark:text-slate-500",
                          )}
                        >
                          {idx === 0
                            ? "🥇"
                            : idx === 1
                              ? "🥈"
                              : idx === 2
                                ? "🥉"
                                : idx + 1}
                        </span>
                        <Avatar
                          name={member.name}
                          photoURL={member.photoURL}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                            {member.name}
                          </p>
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full"
                              style={{
                                width:
                                  member.totalTasks > 0
                                    ? `${(member.completedTasks / Math.max(...memberProfiles.map((m) => m.totalTasks || 1))) * 100}%`
                                    : "0%",
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 tabular-nums">
                          {member.completedTasks}
                        </span>
                      </div>
                    ))}
                  {memberProfiles.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
                      Sin datos de productividad aún
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Team info */}
            <div className="p-6 rounded-2xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                    Información del equipo
                  </h3>
                </div>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => setEditingName(!editingName)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Nombre
                  </p>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTeamName}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingName(false);
                          setNewTeamName(team.name);
                        }}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      {team.name}
                    </p>
                  )}
                </div>
                {team.description && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                      Descripción
                    </p>
                    <p className="text-sm text-gray-700 dark:text-slate-300">
                      {team.description}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Tu rol
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
                      getRoleBadge(userRole),
                    )}
                  >
                    {getRoleIcon(userRole)} {getRoleLabel(userRole)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Creado
                  </p>
                  <p className="text-sm text-gray-700 dark:text-slate-300">
                    {new Date(team.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Configuración
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full border",
                        team.settings.allowInvites
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                          : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
                      )}
                    >
                      {team.settings.allowInvites
                        ? "✓ Invitaciones activas"
                        : "✗ Invitaciones desactivadas"}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full border",
                        team.settings.requireApproval
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800"
                          : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
                      )}
                    >
                      {team.settings.requireApproval
                        ? "⚠ Requiere aprobación"
                        : "✓ Ingreso libre"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Members */}
        {activeTab === "members" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {loadingProfiles ? (
              <div className="space-y-3">
                {team.members.map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              memberProfiles.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 group"
                >
                  <Avatar
                    name={member.name}
                    photoURL={member.photoURL}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {member.name}
                      </p>
                      {member.id === user.id && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                          Tú
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                      {member.email}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-slate-500">
                      <span>{member.completedTasks} completadas</span>
                      <span>·</span>
                      <span>
                        Unido{" "}
                        {new Date(member.joinedAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border",
                        getRoleBadge(member.role),
                      )}
                    >
                      {getRoleIcon(member.role)} {getRoleLabel(member.role)}
                    </span>

                    {isOwnerOrAdmin && member.id !== user.id && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {userRole === "owner" && (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as any)
                            }
                            disabled={actionLoading === member.id}
                            className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Miembro</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={actionLoading === member.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Eliminar miembro"
                        >
                          {actionLoading === member.id ? (
                            <span className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin block" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}

            {isOwnerOrAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-600 dark:hover:text-blue-400 transition-all duration-200"
              >
                <Plus size={16} />
                <span className="text-sm font-medium">
                  Agregar miembro al equipo
                </span>
              </button>
            )}
          </motion.div>
        )}

        {/* Tab: Lists */}
        {activeTab === "lists" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {teamLists.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
                <FolderOpen
                  size={32}
                  className="text-gray-300 dark:text-slate-600 mx-auto mb-3"
                />
                <p className="text-gray-500 dark:text-slate-400 font-medium">
                  Sin listas de equipo
                </p>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                  Las listas asociadas a este equipo aparecerán aquí
                </p>
              </div>
            ) : (
              teamLists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200/80 bg-white dark:bg-slate-900 dark:border-slate-800"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <FolderOpen size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-slate-100 truncate">
                      {list.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {list.members.length} miembros
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/lists/${list.id}`)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>

      {/* Invite modal */}
      {showInviteModal &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowInviteModal(false)}
            />
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-gray-200/80 dark:border-slate-800 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    Invitar miembro
                  </h3>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="correo@empresa.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                      Rol
                    </label>
                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="member">Miembro</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    El usuario recibirá una invitación para unirse al equipo.
                  </p>
                </div>
                <div className="flex gap-3 mt-5">
                  <Button
                    variant="ghost"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button className="flex-1" icon={<Mail size={14} />}>
                    Enviar invitación
                  </Button>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
