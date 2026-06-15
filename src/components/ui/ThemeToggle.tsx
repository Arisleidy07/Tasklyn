"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
  variant?: "segment" | "icon";
  className?: string;
}

export function ThemeToggle({
  size = "md",
  variant = "segment",
  className,
}: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useUIStore();

  const sizeClasses = {
    sm: {
      container: "p-0.5 rounded-md",
      button: "px-2 py-1 text-[10px] gap-1",
      icon: 12,
    },
    md: {
      container: "p-1 rounded-lg",
      button: "px-3 py-1.5 text-xs gap-1.5",
      icon: 14,
    },
    lg: {
      container: "p-1.5 rounded-xl",
      button: "px-4 py-2 text-sm gap-2",
      icon: 16,
    },
  };

  const s = sizeClasses[size];

  if (variant === "segment") {
    return (
      <div
        className={cn(
          "flex items-center backdrop-blur-sm",
          s.container,
          className,
        )}
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center rounded-md font-medium transition-all duration-300",
            s.button,
          )}
          style={{
            backgroundColor:
              theme === "light" ? "var(--bg-card)" : "transparent",
            color: theme === "light" ? "#2563eb" : "var(--text-secondary)",
            boxShadow: theme === "light" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <Sun size={s.icon} />
          <span>Claro</span>
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center rounded-md font-medium transition-all duration-300",
            s.button,
          )}
          style={{
            backgroundColor:
              theme === "dark" ? "var(--bg-card)" : "transparent",
            color: theme === "dark" ? "#2563eb" : "var(--text-secondary)",
            boxShadow: theme === "dark" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <Moon size={s.icon} />
          <span>Oscuro</span>
        </button>
      </div>
    );
  }

  // Icon variant - simple toggle button
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex items-center justify-center rounded-lg transition-all duration-300",
        size === "sm" && "w-8 h-8",
        size === "md" && "w-10 h-10",
        size === "lg" && "w-12 h-12",
        className,
      )}
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
      }}
      aria-label={
        theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
    >
      {theme === "dark" ? (
        <Sun size={s.icon} style={{ color: "#f59e0b" }} />
      ) : (
        <Moon size={s.icon} style={{ color: "#64748b" }} />
      )}
    </button>
  );
}
