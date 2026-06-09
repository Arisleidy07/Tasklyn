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

// Static type config — uses Tailwind dark: classes, no runtime isDark needed
const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: React.ElementType;
    iconClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  invitation: {
    icon: UserPlus,
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-500/15",
    borderClass: "border-blue-200 dark:border-blue-400/25",
  },
  task_assigned: {
    icon: ListTodo,
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-500/15",
    borderClass: "border-blue-200 dark:border-blue-400/25",
  },
  task_completed: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-500/15",
    borderClass: "border-emerald-200 dark:border-emerald-400/25",
  },
  task_edited: {
    icon: Edit2,
    iconClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-500/15",
    borderClass: "border-amber-200 dark:border-amber-400/25",
  },
  member_joined: {
    icon: Users,
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-500/15",
    borderClass: "border-blue-200 dark:border-blue-400/25",
  },
  list_shared: {
    icon: Share2,
    iconClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-500/15",
    borderClass: "border-amber-200 dark:border-amber-400/25",
  },
  reminder: {
    icon: Bell,
    iconClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-500/15",
    borderClass: "border-amber-200 dark:border-amber-400/25",
  },
  due_soon: {
    icon: Clock,
    iconClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-500/15",
    borderClass: "border-red-200 dark:border-red-400/25",
  },
} as const;

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
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center sm:hidden active:scale-90"
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

      <div className="p-3 sm:p-4 md:p-8 max-w-3xl mx-auto space-y-6 sm:space-y-8">
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeFilter === tab.id
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-400/30"
                  : "border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeFilter === tab.id
                      ? "bg-blue-200 dark:bg-blue-400/20 text-blue-700 dark:text-blue-200"
                      : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                  }`}
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
            <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-slate-100">
              Invitaciones Pendientes
            </h3>
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            >
              {pendingNotifications.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type];
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
                    className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-colors cursor-pointer ${
                      notif.read
                        ? "bg-white dark:bg-slate-900/60 border-gray-200 dark:border-slate-700"
                        : "bg-blue-50/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-400/30"
                    }`}
                    onClick={() => !notif.read && markRead(notif.id)}
                  >
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bgClass} ${cfg.borderClass}`}
                    >
                      <Icon size={14} className={cfg.iconClass} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            notif.read
                              ? "text-gray-700 dark:text-slate-400 font-normal"
                              : "text-gray-900 dark:text-slate-100 font-semibold"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs mt-0.5 leading-snug text-gray-500 dark:text-slate-400">
                        {notif.body}
                      </p>
                      <p className="text-[11px] mt-1.5 text-gray-400 dark:text-slate-500">
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
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 min-h-[36px]"
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
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-60 min-h-[36px]"
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
                          className="p-2 rounded-lg text-gray-300 dark:text-slate-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/15 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Archivar"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(notif.id);
                          }}
                          className="p-2 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
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
            <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-slate-100">
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
                  const cfg = TYPE_CONFIG[notif.type];
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
                      className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-colors cursor-pointer ${
                        notif.read
                          ? "bg-white dark:bg-slate-900/60 border-gray-200 dark:border-slate-700"
                          : "bg-blue-50/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-400/30"
                      }`}
                      onClick={() => !notif.read && markRead(notif.id)}
                    >
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bgClass} ${cfg.borderClass}`}
                      >
                        <Icon size={14} className={cfg.iconClass} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug ${
                              notif.read
                                ? "text-gray-700 dark:text-slate-400 font-normal"
                                : "text-gray-900 dark:text-slate-100 font-semibold"
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs mt-0.5 leading-snug text-gray-500 dark:text-slate-400">
                          {notif.body}
                        </p>
                        <p className="text-[11px] mt-1.5 text-gray-400 dark:text-slate-500">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archive(notif.id);
                          }}
                          className="p-2 rounded-lg text-gray-300 dark:text-slate-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/15 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Archivar"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(notif.id);
                          }}
                          className="p-2 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
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
            <h3 className="text-sm font-semibold mb-3 text-emerald-700 dark:text-emerald-400">
              Invitaciones Aceptadas
            </h3>
            <div className="space-y-2">
              {acceptedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-emerald-200 dark:border-emerald-400/30 bg-emerald-50/30 dark:bg-emerald-500/10"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-500/20">
                    <CheckCircle2
                      size={18}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      {notif.title}
                    </p>
                    <p className="text-xs mt-1 text-emerald-600 dark:text-emerald-400/80">
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
            <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-slate-400">
              Invitaciones Rechazadas
            </h3>
            <div className="space-y-2">
              {rejectedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-slate-700">
                    <X
                      size={18}
                      className="text-gray-500 dark:text-slate-400"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                      {notif.title}
                    </p>
                    <p className="text-xs mt-1 text-gray-500 dark:text-slate-400">
                      Rechazaste esta invitación
                    </p>
                  </div>
                  <button
                    onClick={() => remove(notif.id)}
                    className="p-1.5 rounded-lg transition-colors text-gray-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15"
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
                <Archive
                  size={16}
                  className="text-gray-400 dark:text-slate-400"
                />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  Archivados
                </h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                  {archivedNotifications.length}
                </span>
              </div>
              <div className="space-y-2 pt-3">
                {archivedNotifications.map((notif) => {
                  const cfg = TYPE_CONFIG[notif.type];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50"
                    >
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bgClass} ${cfg.borderClass}`}
                      >
                        <Icon size={14} className={cfg.iconClass} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug text-gray-600 dark:text-slate-300">
                          {notif.title}
                        </p>
                        <p className="text-xs mt-0.5 leading-snug text-gray-500 dark:text-slate-400">
                          {notif.body}
                        </p>
                        <p className="text-[11px] mt-1.5 text-gray-400 dark:text-slate-500">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => unarchive(notif.id)}
                          className="p-2 rounded-lg text-gray-300 dark:text-slate-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/15 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Desarchivar"
                        >
                          <Archive size={14} className="rotate-180" />
                        </button>
                        <button
                          onClick={() => remove(notif.id)}
                          className="p-2 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
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
