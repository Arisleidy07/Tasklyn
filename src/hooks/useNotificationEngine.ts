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

  // Subscribe to user notifications on mount
  useEffect(() => {
    if (!user) return;
    subscribe(user.id);
    return () => unsubscribe();
  }, [user, subscribe, unsubscribe]);

  // Register service worker & FCM on mount
  useEffect(() => {
    registerServiceWorker();
    registerForegroundHandler((payload) => {
      if (payload.title && payload.body) {
        showInAppNotification(payload.title, payload.body);
      }
    });
    requestNotificationPermission();
  }, []);

  // Periodic check for reminders and due dates
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const checkRemindersAndDueDates = () => {
      const now = new Date();
      const nowStr = now.toISOString();

      tasks.forEach((task) => {
        if (task.status === "completed") return;

        // Check reminders
        if (task.reminders) {
          task.reminders.forEach((reminder) => {
            if (reminder.sent) return;
            const reminderTime = new Date(reminder.at);
            if (reminderTime <= now) {
              notifyReminder(
                user.id,
                task.title,
                task.id,
                task.listId
              );
              // Mark reminder as sent (would need a Firestore update in real app)
            }
          });
        }

        // Check due dates (notify 24h before and at due time)
        if (task.dueDate) {
          const due = new Date(
            task.dueTime ? `${task.dueDate}T${task.dueTime}` : `${task.dueDate}T23:59:59`
          );
          const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

          // Due within 24 hours and not yet notified
          if (diffHours > 0 && diffHours <= 24 && diffHours > 23) {
            notifyDueSoon(
              user.id,
              task.title,
              task.dueTime ? `${task.dueDate} · ${task.dueTime}` : task.dueDate,
              task.id,
              task.listId
            );
          }

          // Exact due time
          if (diffHours <= 0 && diffHours > -0.1) {
            notifyDueSoon(
              user.id,
              task.title,
              "Ahora",
              task.id,
              task.listId
            );
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
