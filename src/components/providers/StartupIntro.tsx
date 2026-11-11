"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const INTRO_SHOWN_KEY = "tasklyn-intro-shown";
const INTRO_DURATION_MS = 1500;
const FADE_MS = 300;

/**
 * White startup screen with the original TASKLYN logo (green symbol, blue
 * wordmark). Shown once per session on the first page load (browser tab or
 * installed PWA). App content stays hidden until the intro finishes.
 */
export default function StartupIntro({
  children,
}: {
  children: React.ReactNode;
}) {
  // null = not decided yet (SSR / first paint), true = showing, false = done
  const [showing, setShowing] = useState<boolean | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(INTRO_SHOWN_KEY) === "true";
    } catch {
      alreadyShown = true;
    }
    // Decide on the next frame to avoid a synchronous setState in the effect.
    const raf = requestAnimationFrame(() => setShowing(!alreadyShown));
    if (alreadyShown) return () => cancelAnimationFrame(raf);
    const t1 = window.setTimeout(() => setLeaving(true), INTRO_DURATION_MS);
    const t2 = window.setTimeout(() => {
      try {
        sessionStorage.setItem(INTRO_SHOWN_KEY, "true");
      } catch {}
      setShowing(false);
    }, INTRO_DURATION_MS + FADE_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (!showing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showing]);

  return (
    <>
      {/* The opaque overlay below fully covers the app while the intro runs. */}
      {children}
      {showing !== false && (
        <div
          role="status"
          aria-label="Cargando TASKLYN"
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-white"
          style={{
            opacity: leaving ? 0 : 1,
            transition: `opacity ${FADE_MS}ms ease`,
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div
            className="flex flex-col items-center gap-5 px-8"
            style={{
              animation: showing
                ? "tasklyn-intro-in 650ms cubic-bezier(0.16,1,0.3,1) both"
                : undefined,
            }}
          >
            <Image
              src="/icons/splash-logo.png"
              alt="TASKLYN"
              width={160}
              height={160}
              priority
              unoptimized
              className="w-[clamp(150px,42vw,230px)] h-auto select-none"
              draggable={false}
            />
            <span className="text-[clamp(1.5rem,6vw,2.25rem)] font-bold tracking-[0.12em] text-blue-700 select-none">
              TASKLYN
            </span>
          </div>
          <style>{`
            @keyframes tasklyn-intro-in {
              from { opacity: 0; transform: translateY(8px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
