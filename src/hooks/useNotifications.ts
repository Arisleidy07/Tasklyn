"use client";

import { useEffect, useCallback, useState } from "react";
import {
  subscribeToToasts,
  getToastQueue,
  removeToast,
  showInAppNotification,
} from "@/lib/notifications";
import { useNotificationStore } from "@/stores/notificationStore";

/**
 * Hook principal de notificaciones.
 * - Registra FCM foreground handler
 * - Maneja toasts in-app
 * - Solicita permisos al montar
 */
export function useNotifications() {
  const [toasts, setToasts] = useState(getToastQueue());

  useEffect(() => {
    const unsub = subscribeToToasts(() => {
      setToasts(getToastQueue());
    });
    return unsub;
  }, []);

  const dismissToast = useCallback((id: number) => {
    removeToast(id);
  }, []);

  return { toasts, dismissToast };
}

/**
 * Hook para contador de notificaciones no leídas (badge).
 */
export function useUnreadCount() {
  const { notifications } = useNotificationStore();
  return notifications.filter((n) => !n.read).length;
}

/**
 * Trigger a notification with sound and in-app toast.
 * Use this from stores or event handlers.
 */
export function notify(title: string, body: string) {
  showInAppNotification(title, body);
}
