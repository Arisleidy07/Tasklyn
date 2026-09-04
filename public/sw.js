const CACHE_NAME = "tasklyn-v6";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/ranking",
  "/teams",
  "/profile",
  "/settings",
  "/notifications",
  "/manifest.json",
  "/T.PNG",
  "/TA.PNG",
  "/ANIMACION-TASKLYN-WHITE.mp4",
];

// Force skip waiting on install — activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("firestore.googleapis.com")) return;
  if (event.request.url.includes("identitytoolkit.googleapis.com")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a simple 404 response if nothing found in cache
          return new Response("Not found in cache", {
            status: 404,
            statusText: "Not Found",
            headers: { "Content-Type": "text/plain" },
          });
        });
      }),
  );
});

// Firebase Cloud Messaging
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
);
importScripts(
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
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Tasklyn", {
    body: body || "",
    icon: icon || "/T.PNG",
    badge: "/T.PNG",
    tag: payload.data?.taskId || "tasklyn",
    data: payload.data,
  });
});

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
