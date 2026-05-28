import { create } from "zustand";
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createNotification,
} from "@/lib/firestore";
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
    // Archive is just marking as read for now, could add archived field later
    await markNotificationRead(id);
  },

  create: async ({ userId, type, title, body, data }) => {
    await createNotification({ userId, type, title, body, read: false, data });
  },
}));
