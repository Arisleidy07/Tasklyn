// ============================================
// TASKLYN — Firebase Cloud Messaging (FCM)
// Push notifications for reminders & due dates
// ============================================

import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

const VAPID_KEY = "BNj2Udq_8jF4k4q9d3q2m1n0b9v8c7x6z5a4s3d2f1g0h9j8k7l6m5n4o3p2q1r0s"; // Replace with your actual VAPID key from Firebase Console

/**
 * Request notification permission and get FCM token.
 * Returns the token or null if denied.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      console.log("FCM Token:", token);
      return token;
    }
    return null;
  } catch (err) {
    console.error("Error getting FCM token:", err);
    return null;
  }
}

/**
 * Register foreground message handler.
 * Call once in your app layout.
 */
export function registerForegroundHandler(
  onNotification: (payload: {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  }) => void
): void {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    onNotification({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data as Record<string, string>,
    });
  });
}

/**
 * Register service worker for FCM.
 */
export async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service Worker registered:", registration.scope);
  } catch (err) {
    console.error("Service Worker registration failed:", err);
  }
}

/**
 * Show an in-app notification (toast).
 */
export function showInAppNotification(
  title: string,
  body: string
): void {
  // Simple toast using existing UI or alert fallback
  if (typeof window !== "undefined") {
    // Check if there's a toast system, otherwise use console
    console.log(`[Notification] ${title}: ${body}`);
  }
}
