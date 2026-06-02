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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MemberRole, NotificationType } from "@/types";

const typeConfig: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  invitation: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
  task_assigned: { icon: ListTodo, color: "text-blue-600", bg: "bg-blue-50" },
  task_completed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  member_joined: { icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  list_shared: { icon: Share2, color: "text-orange-600", bg: "bg-orange-50" },
  reminder: { icon: Bell, color: "text-amber-600", bg: "bg-amber-50" },
  due_soon: { icon: Clock, color: "text-red-600", bg: "bg-red-50" },
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
  const [showArchived, setShowArchived] = useState(false);

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

  const handleAcceptInvitation = async (
    notifId: string,
    data: Record<string, string>,
  ) => {
    console.log(`[Notifications] Accepting invitation ${notifId}`);
    setProcessingId(notifId);

    try {
      // Step 1: Get the invitation
      console.log(
        `[Notifications] Fetching invitation with token ${data.token}...`,
      );
      const invitation = await getInvitation(data.token);

      if (!invitation) {
        console.error(
          `[Notifications] Invitation not found for token ${data.token}`,
        );
        alert(
          "No se encontró la invitación. Puede haber expirado o sido eliminada.",
        );
        setProcessingId(null);
        return;
      }

      console.log(`[Notifications] Found invitation:`, {
        id: invitation.id,
        listId: invitation.listId,
        role: invitation.defaultRole,
      });

      // Step 2: Accept the invitation (adds to list, deletes invitation)
      console.log(`[Notifications] Calling acceptInvitation...`);
      await acceptInvitation(invitation, user.id, user.name);
      console.log(`[Notifications] acceptInvitation completed successfully`);

      // Step 3: Verify by fetching the updated list
      console.log(`[Notifications] Verifying list membership...`);
      const list = await getList(invitation.listId);
      const isNowMember = list?.members?.some((m) => m.userId === user.id);

      if (!isNowMember) {
        console.error(
          `[Notifications] Verification failed: user not in list members`,
        );
        throw new Error("No se pudo verificar la membresía en la lista");
      }

      console.log(
        `[Notifications] Verified: user is now member of list ${invitation.listId}`,
      );

      // Step 4: Only mark notification as accepted after successful verification
      console.log(`[Notifications] Marking notification as accepted...`);
      await setStatus(notifId, "accepted");
      await markRead(notifId);

      console.log(`[Notifications] SUCCESS: Invitation flow completed`);
    } catch (error) {
      console.error("[Notifications] Error accepting invitation:", error);
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
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-90"
              title="Archivados"
            >
              <Archive size={20} />
            </button>
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
        {/* Pending Invitations */}
        {pendingNotifications.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Invitaciones Pendientes
            </h3>
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            >
              {pendingNotifications.map((notif) => {
                const cfg = typeConfig[notif.type];
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
                        ? "bg-white border-gray-200"
                        : "bg-blue-50/50 border-blue-200"
                    }`}
                    onClick={() => !notif.read && markRead(notif.id)}
                  >
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                    >
                      <Icon size={14} className={cfg.color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            notif.read
                              ? "text-gray-700 font-normal"
                              : "text-gray-900 font-semibold"
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        {notif.body}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1.5">
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
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-60 min-h-[36px]"
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
                          className="p-2 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Archivar"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(notif.id);
                          }}
                          className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
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
        {otherNotifications.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
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
                  const cfg = typeConfig[notif.type];
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
                          ? "bg-white border-gray-200"
                          : "bg-blue-50/50 border-blue-200"
                      }`}
                      onClick={() => !notif.read && markRead(notif.id)}
                    >
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                      >
                        <Icon size={14} className={cfg.color} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug ${
                              notif.read
                                ? "text-gray-700 font-normal"
                                : "text-gray-900 font-semibold"
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                          {notif.body}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archive(notif.id);
                          }}
                          className="p-2 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Archivar"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(notif.id);
                          }}
                          className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
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
            <h3 className="text-sm font-semibold text-green-700 mb-3">
              Invitaciones Aceptadas
            </h3>
            <div className="space-y-2">
              {acceptedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-green-200 bg-green-50/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-800">
                      {notif.title}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
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
            <h3 className="text-sm font-semibold text-gray-600 mb-3">
              Invitaciones Rechazadas
            </h3>
            <div className="space-y-2">
              {rejectedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <X size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rechazaste esta invitación
                    </p>
                  </div>
                  <button
                    onClick={() => remove(notif.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Archived Notifications */}
        {archivedNotifications.length > 0 && (
          <section>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 w-full text-left group"
            >
              <div className="flex items-center gap-2 flex-1">
                <Archive size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Archivados
                </h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-500">
                  {archivedNotifications.length}
                </span>
              </div>
            </button>
            <AnimatePresence>
              {showArchived && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-3">
                    {archivedNotifications.map((notif) => {
                      const cfg = typeConfig[notif.type];
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-200 bg-gray-50/50"
                        >
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                          >
                            <Icon size={14} className={cfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 leading-snug">
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                              {notif.body}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                              {timeAgo(notif.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => unarchive(notif.id)}
                              className="p-2 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Desarchivar"
                            >
                              <Archive size={14} className="rotate-180" />
                            </button>
                            <button
                              onClick={() => remove(notif.id)}
                              className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
