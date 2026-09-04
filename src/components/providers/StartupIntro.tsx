"use client";

import { useEffect, useRef, useState } from "react";

export default function StartupIntro({
  children,
}: {
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPlaying]);

  const finishIntro = () => {
    setIsLeaving(true);
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
            src="/ANIMACION-TASKLYN.mp4"
            autoPlay
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            onEnded={finishIntro}
            onError={() => setIsPlaying(false)}
            className="block h-auto max-h-[34dvh] w-[min(54vw,210px)] object-contain sm:max-h-[38dvh] sm:w-[min(34vw,300px)] lg:w-[300px]"
          />
        </div>
      )}
    </>
  );
}
