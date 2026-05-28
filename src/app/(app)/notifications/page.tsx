"use client";

import React from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NotificationType } from "@/types";

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
  const { notifications, unreadCount, markRead, markAllRead, remove } =
    useNotificationStore();

  if (!user) return null;

  const handleMarkAll = () => markAllRead(user.id);

  return (
    <>
      <Header
        title="Notificaciones"
        description={
          unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"
        }
        actions={
          unreadCount > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarkAll}
              icon={<CheckCheck size={16} />}
            >
              Marcar todo como leído
            </Button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={32} />}
            title="Sin notificaciones"
            description="Aquí aparecerán tus alertas de tareas, invitaciones y más."
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {notifications.map((notif) => {
                const cfg = typeConfig[notif.type];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                      notif.read
                        ? "bg-white border-gray-200"
                        : "bg-blue-50/50 border-blue-200"
                    }`}
                    onClick={() => !notif.read && markRead(notif.id)}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                    >
                      <Icon size={18} className={cfg.color} />
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

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(notif.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
