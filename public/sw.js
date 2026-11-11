const CACHE_NAME = "tasklyn-v11";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.svg",
  "/T.PNG",
  "/ANIMACION-TASKLYN.mp4",
  "/ANIMACION-TASKLYN-WHITE.mp4",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/splash-logo.png",
  "/icons/favicon-16.png",
  "/icons/favicon-32.png",
  "/icons/favicon-48.png",
];

// Force skip waiting on install — activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(STATIC_ASSETS).catch((err) => {
          console.error("[SW] Failed to pre-cache assets:", err);
        }),
      )
      .then(() => self.skipWaiting()),
  );
});

// Clean up ALL old caches and claim all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Allow clients to force-activate a waiting service worker
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Cache network responses for same-origin GET requests, but never intercept
// external scripts or API calls.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = event.request.url;
  if (url.includes("firestore.googleapis.com")) return;
  if (url.includes("identitytoolkit.googleapis.com")) return;
  if (url.includes("gstatic.com")) return;
  if (url.includes("googleapis.com")) return;
  if (!url.startsWith(self.location.origin)) return;

  const isNavigate =
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") || "").includes("text/html");

  // HTML navigations: network-first so users always get the latest deploy.
  // Hashed build assets and icons: cache-first (they are immutable).
  if (isNavigate) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) =>
              cached ||
              caches.match("/").then(
                (fallback) =>
                  fallback ||
                  new Response("Offline", { status: 503, statusText: "Offline" }),
              ),
          ),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch((err) => {
          console.error("[SW] Fetch failed:", err);
          return new Response("Not found in cache", {
            status: 404,
            statusText: "Not Found",
            headers: { "Content-Type": "text/plain" },
          });
        });
    }),
  );
});

// Optional: Firebase Cloud Messaging — only load if scripts are available.
// A 404 on these external scripts was spamming the console and breaking SW.
let messaging = null;
try {
  self.importScripts(
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
  );
  self.importScripts(
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js",
  );

  const firebaseConfig = {
    apiKey: "AIzaSyCKZQKXkOw2rTTuDd16hR6f9xa2m8qIQhM",
    authDomain: "tasklyn-51996.firebaseapp.com",
    projectId: "tasklyn-51996",
    storageBucket: "tasklyn-51996.firebasestorage.app",
    messagingSenderId: "594302321618",
    appId: "1:594302321618:web:8c275079dc68bcd3acfe0b",
  };

  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification || {};
    self.registration.showNotification(title || "Tasklyn", {
      body: body || "",
      icon: icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.data?.taskId || "tasklyn",
      data: payload.data,
    });
  });
} catch (swErr) {
  console.warn("[SW] Firebase messaging scripts not loaded:", swErr);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const path =
    data.actionUrl ||
    (data.listId ? `/lists/${data.listId}` : "/notifications");
  const targetUrl = new URL(path, self.location.origin).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existingClient = clientList.find((client) =>
          client.url.startsWith(self.location.origin),
        );
        if (existingClient) {
          existingClient.navigate(targetUrl);
          return existingClient.focus();
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
