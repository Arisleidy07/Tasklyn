"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useInvitationStore } from "@/stores/invitationStore";
import { getList } from "@/lib/firestore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  Bell,
  CheckCheck,
  Trash2,
  Users,
  CheckCircle2,
  ListTodo,
  UserPlus,
  Share2,
  Check,
  X,
  Archive,
  Clock,
  Edit2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NotificationType } from "@/types";

// Dynamic type config — uses CSS variables for theming
const TYPE_STYLES: Record<
  NotificationType,
  {
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  invitation: {
    icon: UserPlus,
    iconColor: "#2563eb",
    bgColor: "rgba(37,99,235,0.1)",
    borderColor: "rgba(37,99,235,0.25)",
  },
  task_assigned: {
    icon: ListTodo,
    iconColor: "#2563eb",
    bgColor: "rgba(37,99,235,0.1)",
    borderColor: "rgba(37,99,235,0.25)",
  },
  task_completed: {
    icon: CheckCircle2,
    iconColor: "#10b981",
    bgColor: "rgba(16,185,129,0.1)",
    borderColor: "rgba(16,185,129,0.25)",
  },
  task_edited: {
    icon: Edit2,
    iconColor: "#f59e0b",
    bgColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.25)",
  },
  member_joined: {
    icon: Users,
    iconColor: "#2563eb",
    bgColor: "rgba(37,99,235,0.1)",
    borderColor: "rgba(37,99,235,0.25)",
  },
  list_shared: {
    icon: Share2,
    iconColor: "#f59e0b",
    bgColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.25)",
  },
  reminder: {
    icon: Bell,
    iconColor: "#f59e0b",
    bgColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.25)",
  },
  due_soon: {
    icon: Clock,
    iconColor: "#ef4444",
    bgColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.25)",
  },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    remove,
    archive,
    unarchive,
    setStatus,
  } = useNotificationStore();
  const { getInvitation, acceptInvitation, rejectInvitation } =
    useInvitationStore();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "unread" | "invitations" | "archived"
  >("all");

  if (!user) return null;

  const handleMarkAll = () => markAllRead(user.id);

  // Filter notifications by status
  const pendingNotifications = notifications.filter(
    (n) => n.type === "invitation" && (!n.status || n.status === "pending"),
  );
  const acceptedNotifications = notifications.filter(
    (n) => n.type === "invitation" && n.status === "accepted",
  );
  const rejectedNotifications = notifications.filter(
    (n) => n.type === "invitation" && n.status === "rejected",
  );
  const archivedNotifications = notifications.filter(
    (n) => n.status === "archived",
  );
  const otherNotifications = notifications.filter(
    (n) => n.type !== "invitation" && (!n.status || n.status === "pending"),
  );
  const unreadNotifications = notifications.filter(
    (n) => !n.read && n.status !== "archived",
  );

  // Determine which sections to show based on active filter
  const showInvitations =
    activeFilter === "all" || activeFilter === "invitations";
  const showUnread = activeFilter === "all" || activeFilter === "unread";
  const showArchived = activeFilter === "all" || activeFilter === "archived";
  const showOther = activeFilter === "all" || activeFilter === "unread";

  const handleAcceptInvitation = async (
    notifId: string,
    data: Record<string, string>,
  ) => {
    setProcessingId(notifId);
    try {
      const invitation = await getInvitation(data.token);
      if (!invitation) {
        alert(
          "No se encontró la invitación. Puede haber expirado o sido eliminada.",
        );
        setProcessingId(null);
        return;
      }
      await acceptInvitation(invitation, user.id, user.name);
      const list = await getList(invitation.listId);
      const isNowMember = list?.members?.some((m) => m.userId === user.id);
      if (!isNowMember) {
        throw new Error("No se pudo verificar la membresía en la lista");
      }
      await setStatus(notifId, "accepted");
      await markRead(notifId);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert("Error al aceptar la invitación. Por favor, inténtalo de nuevo.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineInvitation = async (
    notifId: string,
    data?: Record<string, string>,
  ) => {
    setProcessingId(notifId);
    try {
      if (data?.token) {
        const invitation = await getInvitation(data.token);
        if (invitation) {
          await rejectInvitation(invitation, user.id, user.name);
        }
      }

      // Mark notification as rejected and read
      await setStatus(notifId, "rejected");
      await markRead(notifId);
    } catch (error) {
      console.error("Error declining invitation:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Header
        title="Notificaciones"
        description={
          unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"
        }
        showMenuButton={true}
        actions={
          <>
            {unreadCount > 0 ? (
              <>
                <button
                  onClick={handleMarkAll}
                  className="p-2 rounded-xl transition-colors flex items-center justify-center sm:hidden active:scale-90"
                  style={{ color: "var(--text-tertiary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Marcar todo como leído"
                >
                  <CheckCheck size={20} />
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAll}
                  icon={<CheckCheck size={16} />}
                  className="hidden sm:flex"
                >
                  Marcar todo como leído
                </Button>
              </>
            ) : undefined}
          </>
        }
      />

      <div
        className="p-3 sm:p-4 md:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "all", label: "Todas", count: notifications.length },
            { id: "unread", label: "No leídas", count: unreadCount },
            {
              id: "invitations",
              label: "Invitaciones",
              count: pendingNotifications.length,
            },
            {
              id: "archived",
              label: "Archivadas",
              count: archivedNotifications.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
              style={
                activeFilter === tab.id
                  ? {
                      backgroundColor: "rgba(37,99,235,0.12)",
                      color: "var(--text-link)",
                      borderColor: "rgba(37,99,235,0.3)",
                    }
                  : {
                      borderColor: "transparent",
                      color: "var(--text-secondary)",
                    }
              }
              onMouseEnter={(e) => {
                if (activeFilter !== tab.id) {
                  e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== tab.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={
                    activeFilter === tab.id
                      ? {
                          backgroundColor: "rgba(37,99,235,0.2)",
                          color: "var(--text-link)",
                        }
                      : {
                          backgroundColor: "var(--bg-tertiary)",
                          color: "var(--text-tertiary)",
                        }
                  }
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pending Invitations */}
        {showInvitations && pendingNotifications.length > 0 && (
          <section>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Invitaciones Pendientes
            </h3>
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            >
              {pendingNotifications.map((notif) => {
                const cfg = TYPE_STYLES[notif.type];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 14, scale: 0.98 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    exit={{ opacity: 0, x: -16, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{
                      y: -1,
                      boxShadow: "0 6px 24px -4px rgba(0,0,0,0.08)",
                    }}
                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer"
                    style={
                      notif.read
                        ? {
                            backgroundColor: "var(--bg-card)",
                            borderColor: "var(--border-color)",
                            boxShadow: "var(--shadow-card)",
                          }
                        : {
                            backgroundColor: "rgba(37,99,235,0.06)",
                            borderColor: "rgba(37,99,235,0.25)",
                            boxShadow: "var(--shadow-card)",
                          }
                    }
                    onClick={() => !notif.read && markRead(notif.id)}
                  >
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                      style={{
                        backgroundColor: cfg.bgColor,
                        borderColor: cfg.borderColor,
                      }}
                    >
                      <Icon size={14} style={{ color: cfg.iconColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-sm leading-snug"
                          style={{
                            color: notif.read
                              ? "var(--text-secondary)"
                              : "var(--text-primary)",
                            fontWeight: notif.read ? 400 : 600,
                          }}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p
                        className="text-xs mt-0.5 leading-snug"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {notif.body}
                      </p>
                      <p
                        className="text-[11px] mt-1.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {timeAgo(notif.createdAt)}
                      </p>

                      {/* Accept / Decline for invitations */}
                      {notif.type === "invitation" && notif.data?.listId && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptInvitation(notif.id, notif.data!);
                            }}
                            disabled={processingId === notif.id}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 min-h-[36px]"
                            style={{ color: "var(--text-on-accent)" }}
                          >
                            <Check size={12} />
                            Aceptar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeclineInvitation(notif.id, notif.data);
                            }}
                            disabled={processingId === notif.id}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 min-h-[36px]"
                            style={{
                              backgroundColor: "var(--bg-secondary)",
                              color: "var(--text-primary)",
                            }}
                          >
                            <X size={12} />
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>

                    {notif.type !== "invitation" && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archive(notif.id);
                          }}
                          className="p-2 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
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
                          title="Archivar"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(notif.id);
                          }}
                          className="p-2 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
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
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        )}

        {/* Other Notifications */}
        {showOther && otherNotifications.length > 0 && (
          <section>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Otras Notificaciones
            </h3>
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            >
              <AnimatePresence mode="popLayout">
                {otherNotifications.map((notif) => {
                  const cfg = TYPE_STYLES[notif.type];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, y: 14, scale: 0.98 },
                        visible: { opacity: 1, y: 0, scale: 1 },
                      }}
                      exit={{ opacity: 0, x: -16, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{
                        y: -1,
                        boxShadow: "0 6px 24px -4px rgba(0,0,0,0.08)",
                      }}
                      className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer"
                      style={
                        notif.read
                          ? {
                              backgroundColor: "var(--bg-card)",
                              borderColor: "var(--border-color)",
                              boxShadow: "var(--shadow-card)",
                            }
                          : {
                              backgroundColor: "rgba(37,99,235,0.06)",
                              borderColor: "rgba(37,99,235,0.25)",
                              boxShadow: "var(--shadow-card)",
                            }
                      }
                      onClick={() => !notif.read && markRead(notif.id)}
                    >
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                        style={{
                          backgroundColor: cfg.bgColor,
                          borderColor: cfg.borderColor,
                        }}
                      >
                        <Icon size={14} style={{ color: cfg.iconColor }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-sm leading-snug"
                            style={{
                              color: notif.read
                                ? "var(--text-secondary)"
                                : "var(--text-primary)",
                              fontWeight: notif.read ? 400 : 600,
                            }}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p
                          className="text-xs mt-0.5 leading-snug"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {notif.body}
                        </p>
                        <p
                          className="text-[11px] mt-1.5"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archive(notif.id);
                          }}
                          className="p-2 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
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
                          title="Archivar"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(notif.id);
                          }}
                          className="p-2 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
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
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </section>
        )}

        {/* Accepted Invitations */}
        {acceptedNotifications.length > 0 && (
          <section>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-success, #059669)" }}
            >
              Invitaciones Aceptadas
            </h3>
            <div className="space-y-2">
              {acceptedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-4 rounded-xl border"
                  style={{
                    borderColor: "rgba(16,185,129,0.3)",
                    backgroundColor: "var(--bg-card)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
                  >
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs mt-1 text-emerald-500">
                      Ya tienes acceso a este espacio
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rejected Invitations */}
        {rejectedNotifications.length > 0 && (
          <section>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              Invitaciones Rechazadas
            </h3>
            <div className="space-y-2">
              {rejectedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-4 rounded-xl border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-card)",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <X size={18} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {notif.title}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Rechazaste esta invitación
                    </p>
                  </div>
                  <button
                    onClick={() => remove(notif.id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.backgroundColor =
                        "rgba(239,68,68,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-tertiary)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Archived Notifications */}
        {(activeFilter === "all" || activeFilter === "archived") &&
          archivedNotifications.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Archive size={16} style={{ color: "var(--text-tertiary)" }} />
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Archivados
                </h3>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {archivedNotifications.length}
                </span>
              </div>
              <div className="space-y-2 pt-3">
                {archivedNotifications.map((notif) => {
                  const cfg = TYPE_STYLES[notif.type];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--bg-card)",
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                        style={{
                          backgroundColor: cfg.bgColor,
                          borderColor: cfg.borderColor,
                        }}
                      >
                        <Icon size={14} style={{ color: cfg.iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm leading-snug"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {notif.title}
                        </p>
                        <p
                          className="text-xs mt-0.5 leading-snug"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {notif.body}
                        </p>
                        <p
                          className="text-[11px] mt-1.5"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => unarchive(notif.id)}
                          className="p-2 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
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
                          title="Desarchivar"
                        >
                          <Archive size={14} className="rotate-180" />
                        </button>
                        <button
                          onClick={() => remove(notif.id)}
                          className="p-2 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
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
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

        {/* Empty State */}
        {pendingNotifications.length === 0 &&
          otherNotifications.length === 0 &&
          acceptedNotifications.length === 0 &&
          rejectedNotifications.length === 0 && (
            <EmptyState
              icon={<Bell size={32} />}
              title="Sin notificaciones"
              description="Aquí aparecerán tus alertas de tareas, invitaciones y más."
            />
          )}
      </div>
    </>
  );
}
