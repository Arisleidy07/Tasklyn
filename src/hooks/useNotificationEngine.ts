"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  requestNotificationPermission,
  registerForegroundHandler,
  registerServiceWorker,
  showInAppNotification,
} from "@/lib/notifications";
import { notifyReminder, notifyDueSoon } from "@/lib/notify";
import { useTaskStore } from "@/stores/taskStore";
import { updateTask } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";

/**
 * Global notification engine.
 * Mount once in the app layout.
 * - Registers FCM foreground handler
 * - Checks for due reminders periodically
 * - Checks for upcoming due dates
 */
export function useNotificationEngine() {
  const { user } = useAuthStore();
  const { subscribe, unsubscribe } = useNotificationStore();
  const { tasks } = useTaskStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dueSoonNotifiedRef = useRef<Set<string>>(new Set());
  const dueNowNotifiedRef = useRef<Set<string>>(new Set());

  // Subscribe to user notifications on mount
  useEffect(() => {
    if (!user) return;
    subscribe(user.id);
    return () => unsubscribe();
  }, [user, subscribe, unsubscribe]);

  // Register service worker & FCM on mount
  useEffect(() => {
    void registerServiceWorker();
    const unsubscribe = registerForegroundHandler((payload) => {
      if (payload.title && payload.body) {
        showInAppNotification(payload.title, payload.body);
      }
    });

    if (
      user &&
      typeof Notification !== "undefined" &&
      Notification.permission !== "denied"
    ) {
      void requestNotificationPermission()
        .then(async (token) => {
          if (!token) return;
          await updateDoc(doc(db, "users", user.id), {
            notificationTokens: arrayUnion(token),
          });
        })
        .catch((error) => {
          console.error(
            "No se pudo registrar este dispositivo para notificaciones:",
            error,
          );
        });
    }

    return unsubscribe;
  }, [user]);

  // Periodic check for reminders and due dates
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const checkRemindersAndDueDates = () => {
      const now = new Date();

      tasks.forEach((task) => {
        if (task.status === "completed") return;

        // Check reminders
        if (task.reminders) {
          task.reminders.forEach((reminder) => {
            if (reminder.sent) return;
            const reminderTime = new Date(reminder.at);
            if (reminderTime <= now) {
              notifyReminder(user.id, task.title, task.id, task.listId);
              const updatedReminders = task.reminders?.map((r) =>
                r.id === reminder.id ? { ...r, sent: true } : r,
              );
              if (updatedReminders) {
                void updateTask(task.id, { reminders: updatedReminders });
              }
            }
          });
        }

        // Check due dates (notify 24h before and at due time)
        if (task.dueDate) {
          const due = new Date(
            task.dueTime
              ? `${task.dueDate}T${task.dueTime}`
              : `${task.dueDate}T23:59:59`,
          );
          const diffMs = due.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          // 24h antes (ventana de 10 minutos para evitar disparos múltiples por desfases)
          if (
            diffHours <= 24 &&
            diffHours > 24 - 10 / 60 &&
            !dueSoonNotifiedRef.current.has(task.id)
          ) {
            notifyDueSoon(
              user.id,
              task.title,
              task.dueTime ? `${task.dueDate} · ${task.dueTime}` : task.dueDate,
              task.id,
              task.listId,
            );
            dueSoonNotifiedRef.current.add(task.id);
          }

          // Exactamente en el vencimiento (ventana de 10 minutos)
          if (
            diffHours <= 0 &&
            diffHours > -10 / 60 &&
            !dueNowNotifiedRef.current.has(task.id)
          ) {
            notifyDueSoon(user.id, task.title, "Ahora", task.id, task.listId);
            dueNowNotifiedRef.current.add(task.id);
          }
        }
      });
    };

    // Check immediately and every 5 minutes
    checkRemindersAndDueDates();
    intervalRef.current = setInterval(checkRemindersAndDueDates, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, tasks]);
}
