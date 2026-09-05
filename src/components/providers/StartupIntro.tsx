"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isHome = pathname === "/";
    const alreadyShown = sessionStorage.getItem(INTRO_SHOWN_KEY) === "true";
    if (isHome && !alreadyShown) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isPlaying) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const startPlayback = async () => {
      video.muted = false;
      try {
        await video.play();
      } catch {
        if (cancelled) return;
        video.muted = true;
        try {
          await video.play();
        } catch {
          if (!cancelled) setIsPlaying(false);
        }
      }
    };

    void startPlayback();
    return () => {
      cancelled = true;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [isPlaying]);

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
        </div>
      )}
    </>
  );
}
