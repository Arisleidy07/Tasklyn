"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Volume2 } from "lucide-react";

const INTRO_SHOWN_KEY = "tasklyn-intro-shown";

export default function StartupIntro({
  children,
}: {
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pathname = usePathname();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);

  useEffect(() => {
    const isHome = pathname === "/";
    const alreadyShown = sessionStorage.getItem(INTRO_SHOWN_KEY) === "true";
    const show = isHome && !alreadyShown;
    const raf = requestAnimationFrame(() => setIsPlaying(show));
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  useEffect(() => {
    if (!isPlaying) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPlaying]);

  // Replay the intro with sound once the browser has a real user gesture.
  const enableSound = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setSoundBlocked(false);
    video.muted = false;
    try {
      video.currentTime = 0;
    } catch {
      // Ignore seek errors; unmuting alone is still an improvement.
    }
    video.play().catch(() => {
      // Still blocked — keep playing muted so the animation continues.
      video.muted = true;
      video.play().catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const startPlayback = async () => {
      // Try with sound first; browsers may allow it after prior interaction.
      video.muted = false;
      try {
        await video.play();
        return;
      } catch {
        // Autoplay with sound blocked — fall back to muted playback so the
        // animation always plays, and offer a gesture to enable sound.
        if (cancelled) return;
        video.muted = true;
        try {
          await video.play();
          if (!cancelled) setSoundBlocked(true);
        } catch {
          if (!cancelled) setIsPlaying(false);
        }
      }
    };

    void startPlayback();
    return () => {
      cancelled = true;
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [isPlaying]);

  // First user gesture unlocks the audio (browser autoplay policy compliant).
  useEffect(() => {
    if (!isPlaying || !soundBlocked) return;
    const handler = () => enableSound();
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [isPlaying, soundBlocked, enableSound]);

  const markIntroShown = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(INTRO_SHOWN_KEY, "true");
    }
  };

  const finishIntro = () => {
    setIsLeaving(true);
    markIntroShown();
    window.setTimeout(() => setIsPlaying(false), 220);
  };

  return (
    <>
      {children}
      {isPlaying && (
        <div
          className={`fixed inset-0 z-[2147483647] flex min-h-dvh w-screen items-center justify-center overflow-hidden bg-white transition-opacity duration-200 ${
            isLeaving ? "opacity-0" : "opacity-100"
          }`}
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingRight: "env(safe-area-inset-right)",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: "env(safe-area-inset-left)",
          }}
        >
          <video
            ref={videoRef}
            src="/ANIMACION-TASKLYN-WHITE.mp4"
            autoPlay
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            onEnded={finishIntro}
            onError={() => {
              markIntroShown();
              setIsPlaying(false);
            }}
            className="block h-auto max-h-[58dvh] w-[min(84vw,360px)] object-contain sm:max-h-[62dvh] sm:w-[min(72vw,560px)] lg:max-h-[66dvh] lg:w-[min(58vw,680px)]"
          />
          {soundBlocked && (
            <button
              type="button"
              onClick={enableSound}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <Volume2 size={14} className="text-blue-600" aria-hidden="true" />
              Toca para activar el sonido
            </button>
          )}
        </div>
      )}
    </>
  );
}
