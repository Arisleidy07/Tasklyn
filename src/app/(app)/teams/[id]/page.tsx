"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { useTaskStore } from "@/stores/taskStore";
import { useListStore } from "@/stores/listStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
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
  ArrowLeft,
  FolderOpen,
  Star,
  Edit3,
  X,
  Check,
  Activity,
  Trophy,
  Medal,
  Zap,
  Target,
  Lock,
  Copy,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getUser,
  subscribeToTeamActivity,
  type TeamActivityEntry,
} from "@/lib/firestore";
import type { User as UserType } from "@/types";

interface MemberProfile extends UserType {
  role: "owner" | "admin" | "member";
  joinedAt: string;
  completedTasks: number;
  totalTasks: number;
}

type TabId = "panel" | "lists" | "members" | "activity" | "ranking" | "config";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "panel", label: "Panel", icon: BarChart3 },
  { id: "lists", label: "Listas", icon: FolderOpen },
  { id: "members", label: "Miembros", icon: Users },
  { id: "activity", label: "Actividad", icon: Activity },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "config", label: "Config.", icon: Settings },
];

function getRoleIcon(role: string) {
  if (role === "owner") return <Crown size={12} className="text-yellow-500" />;
  if (role === "admin") return <Shield size={12} className="text-blue-500" />;
  return <User size={12} className="text-gray-400 dark:text-slate-500" />;
}
function getRoleLabel(role: string) {
  if (role === "owner") return "Propietario";
  if (role === "admin") return "Admin";
  return "Miembro";
}
function getRoleBadge(role: string) {
  if (role === "owner")
    return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800";
  if (role === "admin")
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
  return "bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { user } = useAuthStore();
  const { getTeamById, removeTeamMember, updateTeamMemberRole, updateTeam } =
    useTeamStore();
  const { tasks } = useTaskStore();
  const { lists } = useListStore();

  const [activeTab, setActiveTab] = useState<TabId>("panel");
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [activityLog, setActivityLog] = useState<TeamActivityEntry[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const team = getTeamById(teamId);

  // Load member profiles
  useEffect(() => {
    if (!team) return;
    setNewTeamName(team.name);
    setLoadingProfiles(true);
    Promise.all(
      team.members.map(async (member) => {
        const profile = await getUser(member.userId);
        const memberTasks = tasks.filter(
          (t) =>
            t.assignedTo === member.userId || t.createdBy === member.userId,
        );
        return {
          id: member.userId,
          name: profile?.name || "Usuario",
          email: profile?.email || "",
          photoURL: profile?.photoURL || "",
          plan: profile?.plan || "free",
          createdAt: profile?.createdAt || "",
          role: member.role,
          joinedAt: member.joinedAt,
          completedTasks: memberTasks.filter((t) => t.status === "completed")
            .length,
          totalTasks: memberTasks.length,
        } as MemberProfile;
      }),
    ).then((profiles) => {
      setMemberProfiles(profiles);
      setLoadingProfiles(false);
    });
  }, [team?.id, tasks.length]);

  // Subscribe to team activity
  useEffect(() => {
    if (!teamId) return;
    const unsub = subscribeToTeamActivity(teamId, setActivityLog, 40);
    return () => unsub();
  }, [teamId]);

  if (!user || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-gray-400 dark:text-slate-500" />
          </div>
          <p className="text-gray-500 dark:text-slate-400 mb-4">
            Equipo no encontrado
          </p>
          <Button variant="ghost" onClick={() => router.push("/teams")}>
            <ArrowLeft size={16} className="mr-2" /> Volver
          </Button>
        </div>
      </div>
    );
  }

  const userRole = (team.members.find((m) => m.userId === user.id)?.role ||
    "member") as "owner" | "admin" | "member";
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";
  const teamLists = lists.filter((l) => l.teamId === teamId);
  const teamTasks = tasks.filter((t) =>
    teamLists.some((l) => l.id === t.listId),
  );
  const completedCount = teamTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const pendingCount = teamTasks.filter((t) => t.status === "pending").length;
  const overdueCount = teamTasks.filter(
    (t) =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed",
  ).length;
  const completionRate =
    teamTasks.length > 0
      ? Math.round((completedCount / teamTasks.length) * 100)
      : 0;

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
    role: "owner" | "admin" | "member",
  ) => {
    if (userRole !== "owner") return;
    setActionLoading(memberId);
    try {
      await updateTeamMemberRole(teamId, memberId, role);
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

  const handleCopyInviteLink = async () => {
    const link = `${window.location.origin}/invite/${teamId}`;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        return;
      }

      // Fallback: use execCommand for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        console.error("Copy failed");
        alert(
          "No se pudo copiar el enlace. Por favor cópialo manualmente: " + link,
        );
      }
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      // Show the link to user so they can copy it manually
      alert("No se pudo copiar automáticamente. Enlace: " + link);
    }
  };

  const handleDeleteTeam = async () => {
    if (!team || userRole !== "owner") return;
    setDeleteLoading(true);
    try {
      await useTeamStore.getState().deleteTeam(teamId);
      router.push("/teams");
    } catch (error) {
      console.error("Failed to delete team:", error);
      alert("Error al eliminar el equipo. Intenta nuevamente.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  // ── Ranking data: real, unbiased ─────────────────────────────────────────
  const rankingData = memberProfiles
    .map((m) => {
      const score = m.completedTasks * 3 + m.totalTasks;
      return { ...m, score };
    })
    .sort((a, b) => b.score - a.score);

  const medalFor = (idx: number) => {
    if (idx === 0) return { emoji: "🥇", color: "text-yellow-500" };
    if (idx === 1) return { emoji: "🥈", color: "text-gray-400" };
    if (idx === 2) return { emoji: "🥉", color: "text-amber-600" };
    return null;
  };

  return (
    <>
      <Header
        title={team.name}
        description={`${team.members.length} miembro${team.members.length !== 1 ? "s" : ""} · ${completionRate}% completado`}
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
            {isOwnerOrAdmin && !team.isPersonal && (
              <Button
                size="sm"
                onClick={() => setShowInviteModal(true)}
                icon={<Plus size={14} />}
              >
                Invitar
              </Button>
            )}
          </div>
        }
      />

      <div className="p-3 sm:p-4 md:p-8 max-w-[1200px] mx-auto pb-24 md:pb-8">
        {/* ── Tab bar ── */}
        <div className="flex items-center gap-0.5 p-1 bg-gray-100 dark:bg-slate-800/80 rounded-xl w-full overflow-x-auto mb-8 scrollbar-none">
          {TABS.filter(
            (t) =>
              !(team.isPersonal && (t.id === "ranking" || t.id === "activity")),
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0",
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300",
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══ TAB: PANEL ══════════════════════════════════════════════════════ */}
        {activeTab === "panel" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Total tareas",
                  value: teamTasks.length,
                  Icon: BarChart3,
                  color: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-500/10",
                },
                {
                  label: "Completadas",
                  value: completedCount,
                  Icon: CheckCircle2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 dark:bg-emerald-500/10",
                },
                {
                  label: "Pendientes",
                  value: pendingCount,
                  Icon: Clock,
                  color: "text-amber-600",
                  bg: "bg-amber-50 dark:bg-amber-500/10",
                },
                {
                  label: "Vencidas",
                  value: overdueCount,
                  Icon: AlertTriangle,
                  color: "text-red-600",
                  bg: "bg-red-50 dark:bg-red-500/10",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
                      s.bg,
                    )}
                  >
                    <s.Icon size={17} className={s.color} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <span className="font-semibold text-gray-900 dark:text-slate-100">
                    Productividad del equipo
                  </span>
                </div>
                <span className="text-2xl font-bold text-blue-600 tabular-nums">
                  {completionRate}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                />
              </div>
              <div className="flex items-center gap-5 mt-3 text-xs text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {completedCount} completadas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {pendingCount} pendientes
                </span>
                {overdueCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {overdueCount} vencidas
                  </span>
                )}
              </div>
            </div>

            {/* Top 3 + recent activity side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top performers preview */}
              <div className="p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                      Destacados
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("ranking")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Ver ranking →
                  </button>
                </div>
                {loadingProfiles ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-10 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  rankingData.slice(0, 3).map((m, idx) => (
                    <div key={m.id} className="flex items-center gap-3 py-2">
                      <span className="text-base w-6 text-center">
                        {["🥇", "🥈", "🥉"][idx]}
                      </span>
                      <Avatar name={m.name} photoURL={m.photoURL} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">
                          {m.completedTasks} tareas completadas
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300 tabular-nums">
                        {m.score}pts
                      </span>
                    </div>
                  ))
                )}
                {rankingData.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
                    Sin datos aún
                  </p>
                )}
              </div>

              {/* Recent activity preview */}
              <div className="p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-indigo-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                      Actividad reciente
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Ver todo →
                  </button>
                </div>
                {activityLog.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
                    Sin actividad registrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activityLog.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {entry.userPhoto ? (
                            <img
                              src={entry.userPhoto}
                              alt={entry.userName}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
                              {entry.userName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-slate-300">
                            <span className="font-medium text-gray-900 dark:text-slate-100">
                              {entry.userName}
                            </span>{" "}
                            {entry.detail}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                            {new Date(entry.createdAt).toLocaleString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ TAB: LISTAS ═════════════════════════════════════════════════════ */}
        {activeTab === "lists" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {teamLists.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
                <FolderOpen
                  size={32}
                  className="text-gray-300 dark:text-slate-600 mx-auto mb-3"
                />
                <p className="font-medium text-gray-500 dark:text-slate-400">
                  Sin listas en este equipo
                </p>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                  Crea una lista y asígnala a este equipo para que aparezca
                  aquí.
                </p>
              </div>
            ) : (
              teamLists.map((list, i) => {
                const listTasks = tasks.filter((t) => t.listId === list.id);
                const done = listTasks.filter(
                  (t) => t.status === "completed",
                ).length;
                const progress =
                  listTasks.length > 0
                    ? Math.round((done / listTasks.length) * 100)
                    : 0;
                return (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{
                        backgroundColor: (list.color || "#6366f1") + "20",
                      }}
                    >
                      {list.icon || "📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {list.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {listTasks.length} tareas · {done} completadas
                        </span>
                        <div className="flex-1 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[80px]">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => router.push(`/lists/${list.id}`)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="Abrir lista"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ══ TAB: MIEMBROS ════════════════════════════════════════════════════ */}
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
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:border-gray-300 dark:hover:border-slate-700 transition-all"
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
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                          Tú
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                      {member.email}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        {member.completedTasks} completadas
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Unido{" "}
                        {new Date(member.joinedAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border",
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
                              handleRoleChange(
                                member.id,
                                e.target.value as "owner" | "admin" | "member",
                              )
                            }
                            disabled={actionLoading === member.id}
                            className="text-xs px-2 py-1 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Miembro</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={actionLoading === member.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        >
                          {actionLoading === member.id ? (
                            <span className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin block" />
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

            {isOwnerOrAdmin && !team.isPersonal && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              >
                <Plus size={16} />
                <span className="text-sm font-medium">
                  Invitar miembro al equipo
                </span>
              </button>
            )}
          </motion.div>
        )}

        {/* ══ TAB: ACTIVIDAD ═══════════════════════════════════════════════════ */}
        {activeTab === "activity" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            {activityLog.length === 0 ? (
              <div className="text-center py-16">
                <Activity
                  size={32}
                  className="text-gray-300 dark:text-slate-600 mx-auto mb-3"
                />
                <p className="font-medium text-gray-500 dark:text-slate-400">
                  Sin actividad registrada
                </p>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                  La actividad del equipo aparecerá aquí en tiempo real.
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100 dark:bg-slate-800" />
                <div className="space-y-0">
                  {activityLog.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-4 pl-11 pr-4 py-3.5 relative hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                    >
                      <div className="absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 bg-blue-400 flex-shrink-0" />
                      {entry.userPhoto ? (
                        <img
                          src={entry.userPhoto}
                          alt={entry.userName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {entry.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-slate-300">
                          <span className="font-semibold text-gray-900 dark:text-slate-100">
                            {entry.userName}
                          </span>{" "}
                          {entry.detail}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                          {new Date(entry.createdAt).toLocaleString("es-ES", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ TAB: RANKING ═════════════════════════════════════════════════════ */}
        {activeTab === "ranking" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-amber-500" />
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Puntuación = tareas completadas × 3 + total creadas. Datos en
                tiempo real.
              </p>
            </div>
            {loadingProfiles ? (
              <div className="space-y-3">
                {team.members.map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : rankingData.length === 0 ? (
              <div className="text-center py-12">
                <Trophy
                  size={32}
                  className="text-gray-300 dark:text-slate-600 mx-auto mb-3"
                />
                <p className="text-gray-500 dark:text-slate-400">
                  Sin datos de ranking aún
                </p>
              </div>
            ) : (
              rankingData.map((member, idx) => {
                const medal = medalFor(idx);
                const maxScore = rankingData[0]?.score || 1;
                const pct = maxScore > 0 ? (member.score / maxScore) * 100 : 0;
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all",
                      idx === 0
                        ? "border-yellow-200 dark:border-yellow-800/50 bg-yellow-50/50 dark:bg-yellow-950/10"
                        : "border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900",
                    )}
                  >
                    <div className="w-8 text-center flex-shrink-0">
                      {medal ? (
                        <span className="text-xl">{medal.emoji}</span>
                      ) : (
                        <span className="text-sm font-bold text-gray-400 dark:text-slate-500">
                          #{idx + 1}
                        </span>
                      )}
                    </div>
                    <Avatar
                      name={member.name}
                      photoURL={member.photoURL}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                          {member.name}
                        </p>
                        {member.id === user.id && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: idx * 0.05,
                          }}
                          className={cn(
                            "h-full rounded-full",
                            idx === 0
                              ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600",
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-slate-500">
                        <span>{member.completedTasks} completadas</span>
                        <span>·</span>
                        <span>{member.totalTasks} total</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                        {member.score}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">
                        puntos
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ══ TAB: CONFIGURACIÓN ═══════════════════════════════════════════════ */}
        {activeTab === "config" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl space-y-5"
          >
            {/* Name */}
            <div className="p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Edit3 size={15} className="text-gray-400" /> Nombre del equipo
              </h3>
              {team.isPersonal ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <Lock size={13} />
                  El equipo Personal no puede ser renombrado.
                </div>
              ) : isOwnerOrAdmin ? (
                <div className="flex items-center gap-2">
                  {editingName ? (
                    <>
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTeamName}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingName(false);
                          setNewTeamName(team.name);
                        }}
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="flex-1 text-sm font-medium text-gray-900 dark:text-slate-100">
                        {team.name}
                      </p>
                      <button
                        onClick={() => setEditingName(true)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  {team.name}
                </p>
              )}
            </div>

            {/* Invite link */}
            {isOwnerOrAdmin && !team.isPersonal && (
              <div
                className="p-5 rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-color)",
                }}
              >
                <h3
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  <Mail size={15} style={{ color: "var(--text-secondary)" }} />{" "}
                  Invitar miembros
                </h3>
                <button
                  onClick={handleCopyInviteLink}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm w-full transition-all"
                  style={{
                    backgroundColor: copiedLink
                      ? "var(--bg-success)"
                      : "var(--bg-secondary)",
                    borderColor: copiedLink
                      ? "var(--text-success)"
                      : "var(--border-color)",
                    color: copiedLink
                      ? "var(--text-success)"
                      : "var(--text-primary)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                  }}
                >
                  <Copy
                    size={14}
                    style={{
                      color: copiedLink ? "#10b981" : "var(--text-secondary)",
                    }}
                  />
                  {copiedLink
                    ? "¡Enlace copiado!"
                    : "Copiar enlace de invitación"}
                </button>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Comparte este enlace para que nuevos miembros puedan unirse al
                  equipo.
                </p>
              </div>
            )}

            {/* Settings */}
            <div
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
              }}
            >
              <h3
                className="text-sm font-semibold mb-3 flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <Settings
                  size={15}
                  style={{ color: "var(--text-secondary)" }}
                />{" "}
                Configuración
              </h3>
              <div
                className="space-y-3 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <div
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid var(--border-divider)" }}
                >
                  <span>Invitaciones</span>
                  <span
                    style={{
                      color: team.settings.allowInvites
                        ? "#10b981"
                        : "var(--text-tertiary)",
                    }}
                  >
                    {team.settings.allowInvites ? "Activas" : "Desactivadas"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Aprobación requerida</span>
                  <span>{team.settings.requireApproval ? "Sí" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            {userRole === "owner" && !team.isPersonal && (
              <div
                className="p-5 rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-error)",
                  borderColor: "var(--text-error)",
                  borderWidth: "1px",
                }}
              >
                <h3
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: "var(--text-error)" }}
                >
                  <AlertTriangle size={15} /> Zona peligrosa
                </h3>
                <p
                  className="text-xs mb-3"
                  style={{ color: "var(--text-error)" }}
                >
                  Eliminar el equipo borrará todos sus datos permanentemente.
                  Esta acción no se puede deshacer.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="border"
                  style={{
                    color: "#dc2626",
                    borderColor: "var(--text-error)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-error)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={14} className="mr-1.5" /> Eliminar equipo
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Invite Modal ─────────────────────────────────────────────────────── */}
      {showInviteModal &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[99998] backdrop-blur-sm"
              style={{ backgroundColor: "var(--bg-modal-overlay)" }}
              onClick={() => setShowInviteModal(false)}
            />
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="rounded-2xl w-full max-w-md shadow-2xl border"
                style={{
                  backgroundColor: "var(--bg-modal)",
                  borderColor: "var(--border-color)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="flex items-center justify-between px-6 pt-5 pb-4 border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Invitar al equipo
                  </h3>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--text-primary)";
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-secondary)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label
                      className="text-sm font-medium block mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="correo@empresa.com"
                      className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-input)",
                        borderColor: "var(--border-input)",
                        color: "var(--text-primary)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium block mb-1.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Rol
                    </label>
                    <select
                      className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-input)",
                        borderColor: "var(--border-input)",
                        color: "var(--text-primary)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                    >
                      <option value="member">Miembro</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    O comparte el enlace de invitación desde la pestaña de
                    Configuración.
                  </p>
                  <div className="flex gap-3 pt-1">
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
                </div>
              </motion.div>
            </div>
          </>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="¿Eliminar equipo?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                ¿Deseas eliminar el equipo{" "}
                <strong className="text-gray-900 dark:text-white">
                  "{team?.name}"
                </strong>
                ?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <ul className="text-sm text-gray-500 dark:text-slate-400 space-y-1 ml-4 list-disc">
            <li>El equipo y todos sus miembros</li>
            <li>Estadísticas y logros</li>
            <li>Registro de actividad</li>
            <li>Metas y objetivos</li>
          </ul>

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
              onClick={handleDeleteTeam}
              disabled={deleteLoading}
              icon={
                deleteLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )
              }
            >
              {deleteLoading ? "Eliminando..." : "Eliminar equipo"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
