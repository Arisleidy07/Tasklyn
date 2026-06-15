"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for updates immediately and then every 60s
          reg.update();
          setInterval(() => reg.update(), 60_000);

          // If a new SW is waiting, skip waiting to activate it now
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          reg.addEventListener("updatefound", () => {
            const newSW = reg.installing;
            newSW?.addEventListener("statechange", () => {
              if (
                newSW.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                newSW.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
