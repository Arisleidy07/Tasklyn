"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 48, text: "text-lg" },
  md: { icon: 64, text: "text-xl" },
  lg: { icon: 80, text: "text-2xl" },
  xl: { icon: 120, text: "text-3xl" },
};

export default function Logo({
  size = "md",
  className,
  showText = true,
}: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/T.PNG"
        alt="TASKLYN"
        width={s.icon}
        height={s.icon}
        className="rounded-2xl object-contain"
        priority
      />
      {showText && (
        <span className={cn(s.text, "font-bold tracking-tight text-gray-900")}>
          TASKLYN
        </span>
      )}
    </div>
  );
}
