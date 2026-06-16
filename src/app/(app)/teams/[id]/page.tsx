"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { useTaskStore } from "@/stores/taskStore";
import { useListStore } from "@/stores/listStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import TeamImage from "@/components/ui/TeamImage";
import Modal from "@/components/ui/Modal";
import CreateListModal from "@/components/lists/CreateListModal";
import DeleteTeamModal from "@/components/teams/DeleteTeamModal";
import EditTeamModal from "@/components/teams/EditTeamModal";
import {
  SortableListContainer,
  SortableListItem,
} from "@/components/lists/SortableListContainer";
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
  getUserByEmail,
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
  if (role === "admin") return <Shield size={12} className="text-gray-500" />;
  return <User size={12} className="text-[var(--text-tertiary)]" />;
}
function getRoleLabel(role: string) {
  if (role === "owner") return "Propietario";
  if (role === "admin") return "Admin";
  return "Miembro";
}
function getRoleBadge(role: string) {
  if (role === "owner") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (role === "admin") return "bg-gray-100 text-gray-700 border-gray-200";
  return "border";
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { user } = useAuthStore();
  const {
    getTeamById,
    removeTeamMember,
    updateTeamMemberRole,
    updateTeam,
    addTeamMember,
  } = useTeamStore();
  const { tasks } = useTaskStore();
  const { lists } = useListStore();

  const [activeTab, setActiveTab] = useState<TabId>("panel");
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [activityLog, setActivityLog] = useState<TeamActivityEntry[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-[var(--text-tertiary)]" />
          </div>
          <p className="text-[var(--text-secondary)] mb-4">
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
  const teamLists = [...lists.filter((l) => l.teamId === teamId)].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const { reorderLists } = useListStore();
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      const foundUser = await getUserByEmail(inviteEmail.trim().toLowerCase());
      if (!foundUser) {
        setInviteError("No encontramos ningún usuario con ese correo.");
        return;
      }
      const alreadyMember = team.members.some((m) => m.userId === foundUser.id);
      if (alreadyMember) {
        setInviteError("Este usuario ya es miembro del equipo.");
        return;
      }
      await addTeamMember(teamId, foundUser.id, inviteRole);
      setInviteSuccess(true);
      setInviteEmail("");
      setTimeout(() => {
        setInviteSuccess(false);
        setShowInviteModal(false);
      }, 1500);
    } catch {
      setInviteError(
        "No se pudo enviar la invitación. Inténtalo nuevamente en unos segundos.",
      );
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!team || userRole !== "owner") return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await useTeamStore.getState().deleteTeam(teamId);
      router.push("/teams");
    } catch (error) {
      console.error("Failed to delete team:", error);
      setDeleteError(
        (error as Error).message ||
          "Error al eliminar el equipo. Intenta nuevamente.",
      );
      setDeleteLoading(false);
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
        title={
          <div className="flex items-center gap-3">
            <TeamImage
              teamId={team.id}
              name={team.name}
              photoURL={team.photoURL}
              size="md"
              color={team.color}
            />
            <div>
              <div className="flex items-center gap-2">
                <span>{team.name}</span>
                {userRole === "owner" && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-1 rounded-md transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-secondary)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-tertiary)";
                    }}
                    title="Editar equipo"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        }
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
        <div className="flex items-center gap-0.5 p-1 bg-[var(--bg-secondary)]/80 rounded-xl w-full overflow-x-auto mb-8 scrollbar-none">
          {TABS.filter(
            (t) =>
              !(team.isPersonal && (t.id === "ranking" || t.id === "activity")),
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0"
              style={{
                backgroundColor:
                  activeTab === tab.id ? "var(--bg-card)" : "transparent",
                color:
                  activeTab === tab.id
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                boxShadow:
                  activeTab === tab.id ? "0 1px 3px 0 rgba(0,0,0,0.1)" : "none",
              }}
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
                  bg: "bg-blue-50",
                },
                {
                  label: "Completadas",
                  value: completedCount,
                  Icon: CheckCircle2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Pendientes",
                  value: pendingCount,
                  Icon: Clock,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  label: "Vencidas",
                  value: overdueCount,
                  Icon: AlertTriangle,
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center mb-3",
                      s.bg,
                    )}
                  >
                    <s.Icon size={17} className={s.color} />
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {s.value}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <span className="font-semibold text-[var(--text-primary)]">
                    Productividad del equipo
                  </span>
                </div>
                <span className="text-2xl font-bold text-blue-600 tabular-nums">
                  {completionRate}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                />
              </div>
              <div className="flex items-center gap-5 mt-3 text-xs text-[var(--text-secondary)]">
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
              <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500" />
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Destacados
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("ranking")}
                    className="text-xs hover:underline"
                    style={{ color: "var(--text-link)" }}
                  >
                    Ver ranking →
                  </button>
                </div>
                {loadingProfiles ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-10 bg-[var(--bg-secondary)] rounded-lg animate-pulse"
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
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {m.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                          {m.completedTasks} tareas completadas
                        </p>
                      </div>
                      <span className="text-xs font-bold text-[var(--text-secondary)] tabular-nums">
                        {m.score}pts
                      </span>
                    </div>
                  ))
                )}
                {rankingData.length === 0 && (
                  <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                    Sin datos aún
                  </p>
                )}
              </div>

              {/* Recent activity preview */}
              <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-indigo-500" />
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Actividad reciente
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className="text-xs hover:underline"
                    style={{ color: "var(--text-link)" }}
                  >
                    Ver todo →
                  </button>
                </div>
                {activityLog.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                    Sin actividad registrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activityLog.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {entry.userPhoto ? (
                            <img
                              src={entry.userPhoto}
                              alt={entry.userName}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-[var(--text-secondary)]">
                              {entry.userName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-secondary)]">
                            <span className="font-medium text-[var(--text-primary)]">
                              {entry.userName}
                            </span>{" "}
                            {entry.detail}
                          </p>
                          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
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
            {/* Lists header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {teamLists.length} lista{teamLists.length !== 1 ? "s" : ""}
              </p>
              {isOwnerOrAdmin && (
                <Button
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setShowCreateListModal(true)}
                >
                  Nueva lista
                </Button>
              )}
            </div>

            {teamLists.length === 0 ? (
              <div
                className="text-center py-16 border-2 border-dashed rounded-2xl"
                style={{ borderColor: "var(--border-color)" }}
              >
                <FolderOpen
                  size={32}
                  className="text-[var(--text-tertiary)] mx-auto mb-3"
                />
                <p className="font-medium text-[var(--text-secondary)]">
                  Sin listas en este equipo
                </p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1 mb-4">
                  Crea una lista y asígnala a este equipo.
                </p>
                {isOwnerOrAdmin && (
                  <Button
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => setShowCreateListModal(true)}
                  >
                    Crear primera lista
                  </Button>
                )}
              </div>
            ) : (
              <SortableListContainer
                lists={teamLists}
                onReorder={(newOrder) =>
                  reorderLists(newOrder.map((l) => l.id))
                }
              >
                {(list, index, total, moveUp, moveDown) => {
                  const listTasks = tasks.filter((t) => t.listId === list.id);
                  const done = listTasks.filter(
                    (t) => t.status === "completed",
                  ).length;
                  const progress =
                    listTasks.length > 0
                      ? Math.round((done / listTasks.length) * 100)
                      : 0;
                  return (
                    <SortableListItem
                      key={list.id}
                      list={list}
                      index={index}
                      total={total}
                      onMoveUp={moveUp}
                      onMoveDown={moveDown}
                      showMoveButtons
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition-all"
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
                          <p className="font-semibold text-[var(--text-primary)] truncate">
                            {list.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {listTasks.length} tareas · {done} completadas
                            </span>
                            <div className="flex-1 h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {progress}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push(`/lists/${list.id}`)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: "var(--text-tertiary)" }}
                            title="Abrir lista"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </motion.div>
                    </SortableListItem>
                  );
                }}
              </SortableListContainer>
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
                    className="h-20 bg-[var(--bg-secondary)] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              memberProfiles.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] transition-all"
                >
                  <Avatar
                    name={member.name}
                    photoURL={member.photoURL}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">
                      {member.name}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] truncate">
                      {member.email}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
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
                            className="text-xs px-2 py-1 rounded-lg cursor-pointer outline-none"
                            style={{
                              border: "1px solid var(--border-input)",
                              backgroundColor: "var(--bg-input)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Miembro</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={actionLoading === member.id}
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
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.color = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
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
                  className="text-[var(--text-tertiary)] mx-auto mb-3"
                />
                <p className="font-medium text-[var(--text-secondary)]">
                  Sin actividad registrada
                </p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  La actividad del equipo aparecerá aquí en tiempo real.
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--bg-secondary)]" />
                <div className="space-y-0">
                  {activityLog.slice(0, 4).map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-4 pl-11 pr-4 py-3.5 relative rounded-xl transition-colors"
                      style={{ cursor: "default" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <div
                        className="absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 bg-gray-400 flex-shrink-0"
                        style={{ borderColor: "var(--bg-card)" }}
                      />
                      {entry.userPhoto ? (
                        <img
                          src={entry.userPhoto}
                          alt={entry.userName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ color: "var(--text-on-accent)" }}
                        >
                          {entry.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {entry.userName}
                          </span>{" "}
                          {entry.detail}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
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
                {activityLog.length > 4 && (
                  <button
                    className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-secondary)";
                    }}
                  >
                    Ver todas las actividades ({activityLog.length})
                  </button>
                )}
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
              <p className="text-xs text-[var(--text-secondary)]">
                Puntuación = tareas completadas × 3 + total creadas. Datos en
                tiempo real.
              </p>
            </div>
            {loadingProfiles ? (
              <div className="space-y-3">
                {team.members.map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-[var(--bg-secondary)] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : rankingData.length === 0 ? (
              <div className="text-center py-12">
                <Trophy
                  size={32}
                  className="text-[var(--text-tertiary)] mx-auto mb-3"
                />
                <p className="text-[var(--text-secondary)]">
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
                        ? "border-yellow-200 bg-yellow-50/50"
                        : "border-[var(--border-color)] bg-[var(--bg-card)]",
                    )}
                  >
                    <div className="w-8 text-center flex-shrink-0">
                      {medal ? (
                        <span className="text-xl">{medal.emoji}</span>
                      ) : (
                        <span className="text-sm font-bold text-[var(--text-tertiary)]">
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
                      <p className="font-semibold text-[var(--text-primary)] truncate">
                        {member.name}
                      </p>
                      <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
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
                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
                        <span>{member.completedTasks} completadas</span>
                        <span>·</span>
                        <span>{member.totalTasks} total</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                        {member.score}
                      </p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">
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
            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Edit3 size={15} className="text-gray-400" /> Nombre del equipo
              </h3>
              {team.isPersonal ? (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
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
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          border: "1px solid var(--border-input)",
                          backgroundColor: "var(--bg-input)",
                          color: "var(--text-primary)",
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTeamName}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: "#059669" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(16,185,129,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingName(false);
                          setNewTeamName(team.name);
                        }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-secondary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="flex-1 text-sm font-medium text-[var(--text-primary)]">
                        {team.name}
                      </p>
                      <button
                        onClick={() => setEditingName(true)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--text-link)";
                          e.currentTarget.style.backgroundColor =
                            "rgba(37,99,235,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-tertiary)";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Edit3 size={15} />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
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
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          if (!inviteLoading) {
            setShowInviteModal(false);
            setInviteEmail("");
            setInviteError(null);
            setInviteSuccess(false);
          }
        }}
        title="Agregar miembro"
        description="El usuario debe tener una cuenta en Tasklyn"
        size="sm"
      >
        <form onSubmit={handleInvite} className="p-6 space-y-4">
          {inviteSuccess ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                <Check size={22} className="text-emerald-500" />
              </div>
              <p
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                ¡Miembro agregado!
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                El usuario ya puede acceder al equipo.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                  }}
                  placeholder="correo@empresa.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-input)",
                    color: "var(--text-primary)",
                  }}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Rol
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "admin" | "member")
                  }
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-input)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {inviteError && (
                <div
                  className="flex items-start gap-2.5 p-3 rounded-xl text-sm"
                  style={{
                    backgroundColor: "var(--bg-error)",
                    color: "var(--text-error)",
                  }}
                >
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteError(null);
                  }}
                  className="flex-1"
                  disabled={inviteLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  icon={<Mail size={14} />}
                  isLoading={inviteLoading}
                  disabled={inviteLoading || !inviteEmail.trim()}
                >
                  Agregar
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Create List Modal — pre-selects this team */}
      <CreateListModal
        isOpen={showCreateListModal}
        onClose={() => setShowCreateListModal(false)}
        defaultTeamId={teamId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTeamModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!deleteLoading) {
            setShowDeleteModal(false);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteTeam}
        team={team}
        listCount={teamLists.length}
        memberCount={team.members.length}
      />

      {/* Edit Team Modal */}
      <EditTeamModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        team={team}
        onSave={async (updates) => {
          await updateTeam(teamId, updates);
        }}
      />
    </>
  );
}
