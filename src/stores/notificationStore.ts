import { create } from "zustand";
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createNotification,
} from "@/lib/firestore";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Notification, NotificationType } from "@/types";
import {
  showInAppNotification,
  sendBrowserNotification,
} from "@/lib/notifications";

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  _unsubscribe: (() => void) | null;

  subscribe: (userId: string) => void;
  unsubscribe: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
  unarchive: (id: string) => Promise<void>;
  setStatus: (
    id: string,
    status: "accepted" | "rejected" | "archived" | "pending",
  ) => Promise<void>;
  create: (params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, string>;
  }) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  _unsubscribe: null,

  subscribe: (userId: string) => {
    const existing = get()._unsubscribe;
    if (existing) existing();

    set({ isLoading: true });

    // Surface each genuinely new notification exactly once, on the
    // recipient's device only. The initial snapshot is marked as seen
    // without toasting so old notifications don't replay on login.
    const seen = new Set<string>();
    let initialized = false;

    const unsub = subscribeToNotifications(userId, (notifications) => {
      const fresh = initialized
        ? notifications.filter((n) => !seen.has(n.id) && !n.read)
        : [];
      notifications.forEach((n) => seen.add(n.id));
      initialized = true;

      fresh.forEach((n) => {
        if (n.data?.silent === "1") return;
        if (
          typeof document !== "undefined" &&
          document.visibilityState === "hidden"
        ) {
          sendBrowserNotification(n.title, n.body);
        } else {
          showInAppNotification(n.title, n.body);
        }
      });

      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        isLoading: false,
      });
    });

    set({ _unsubscribe: unsub });
  },

  unsubscribe: () => {
    const unsub = get()._unsubscribe;
    if (unsub) {
      unsub();
      set({ _unsubscribe: null, notifications: [], unreadCount: 0 });
    }
  },

  markRead: async (id: string) => {
    await markNotificationRead(id);
  },

  markAllRead: async (userId: string) => {
    await markAllNotificationsRead(userId);
  },

  remove: async (id: string) => {
    await deleteNotification(id);
  },

  archive: async (id: string) => {
    const { setStatus } = get();
    await setStatus(id, "archived");
  },

  unarchive: async (id: string) => {
    const { setStatus } = get();
    await setStatus(id, "pending");
  },

  setStatus: async (id: string, status) => {
    const notifRef = doc(db, "notifications", id);
    const update: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };
    // Accepting or rejecting an invitation always clears the unread dot
    if (status === "accepted" || status === "rejected") {
      update.read = true;
    }
    await updateDoc(notifRef, update);
  },

  create: async ({ userId, type, title, body, data }) => {
    await createNotification({
      userId,
      type,
      title,
      body,
      read: false,
      status: "pending",
      data,
    });
  },
}));
