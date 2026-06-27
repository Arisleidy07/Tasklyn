"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TaskCardMetaChipProps {
  icon?: React.ReactNode;
  text: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  color?: string;
  className?: string;
  title?: string;
}

export default function TaskCardMetaChip({
  icon,
  text,
  href,
  onClick,
  color = "var(--text-secondary)",
  className,
  title,
}: TaskCardMetaChipProps) {
  const inner = (
    <>
      {icon && (
        <span className="flex-shrink-0" style={{ color }}>
          {icon}
        </span>
      )}
      <span className="truncate">{text}</span>
    </>
  );

  const baseClass = cn(
    "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[var(--text-xs)] font-medium transition-colors",
    className,
  );

  const style = {
    backgroundColor: "var(--bg-chip)",
    borderColor: "var(--border-chip)",
    color: "var(--text-chip)",
  };

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        className={cn(baseClass, "hover:bg-[var(--bg-chip-hover)]")}
        style={style}
        title={title}
      >
        {inner}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={cn(baseClass, "hover:bg-[var(--bg-chip-hover)]")}
        style={style}
        title={title}
      >
        {inner}
      </button>
    );
  }

  return (
    <span className={baseClass} style={style} title={title}>
      {inner}
    </span>
  );
}
