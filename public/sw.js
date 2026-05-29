const CACHE_NAME = "tasklyn-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/T.PNG",
  "/TA.PNG",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

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
      ),
  );
  self.clients.claim();
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
        return caches.match(event.request);
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
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        self.clients.openWindow("/");
      }
    }),
  );
});
