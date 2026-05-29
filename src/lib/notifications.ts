// ============================================
// TASKLYN — Notification Engine (FCM + Sound + Toast)
// ============================================

import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

const VAPID_KEY =
  "BNj2Udq_8jF4k4q9d3q2m1n0b9v8c7x6z5a4s3d2f1g0h9j8k7l6m5n4o3p2q1r0s";

// ── Toast in-app queue ──
let toastQueue: Array<{ title: string; body: string; id: number }> = [];
let toastListeners: Array<() => void> = [];

export function subscribeToToasts(callback: () => void) {
  toastListeners.push(callback);
  return () => {
    toastListeners = toastListeners.filter((l) => l !== callback);
  };
}

export function getToastQueue() {
  return [...toastQueue];
}

export function removeToast(id: number) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  toastListeners.forEach((l) => l());
}

/**
 * Request notification permission and get FCM token.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Register foreground message handler.
 */
export function registerForegroundHandler(
  onNotification: (payload: {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  }) => void,
): void {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
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
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    // ignore
  }
}

/**
 * Play a modern "ding" notification sound using Web Audio API.
 */
let audioCtx: AudioContext | null = null;

export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx)
      audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    const ctx = audioCtx;
    const t = ctx.currentTime;

    // Two oscillators for a pleasant major-third "ding"
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, t); // C5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, t + 0.08);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, t); // E5
    osc2.frequency.exponentialRampToValueAtTime(1318.5, t + 0.08);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.12, t + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc1.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.6);
    osc2.stop(t + 0.6);
  } catch {
    // ignore
  }
}

/**
 * Show an in-app toast notification + sound.
 */
export function showInAppNotification(title: string, body: string) {
  playNotificationSound();
  toastQueue.push({ title, body, id: Date.now() + Math.random() });
  toastListeners.forEach((l) => l());
}

// ── Browser title flash ──
let originalTitle: string | null = null;
let titleInterval: ReturnType<typeof setInterval> | null = null;

export function flashBrowserTitle(newTitle: string) {
  if (typeof document === "undefined") return;
  if (!originalTitle) originalTitle = document.title;
  if (titleInterval) clearInterval(titleInterval);
  let flash = false;
  titleInterval = setInterval(() => {
    document.title = flash ? newTitle : originalTitle!;
    flash = !flash;
  }, 1500);
  // stop after 8 seconds
  setTimeout(() => {
    if (titleInterval) clearInterval(titleInterval);
    if (originalTitle) document.title = originalTitle;
  }, 8000);
}

/**
 * Send a browser notification directly (for foreground use).
 */
export function sendBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/T.PNG",
      badge: "/T.PNG",
      tag: "tasklyn-" + Date.now(),
    });
  }
}
