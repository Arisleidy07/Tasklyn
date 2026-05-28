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
  setStatus: (
    id: string,
    status: "accepted" | "rejected" | "archived",
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

    const unsub = subscribeToNotifications(userId, (notifications) => {
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

  setStatus: async (id: string, status) => {
    // Update notification status in Firestore
    const notifRef = doc(db, "notifications", id);
    await updateDoc(notifRef, { status, updatedAt: serverTimestamp() });
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
