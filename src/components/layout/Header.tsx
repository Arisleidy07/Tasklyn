"use client";

import React from "react";
import { Menu, ArrowLeft } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  showMenuButton?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function Header({
  title,
  description,
  actions,
  badge,
  showMenuButton = false,
  showBackButton = false,
  onBackClick,
}: HeaderProps) {
  const { openSidebar } = useUIStore();

  return (
    <header
      className={cn(
        "border-b sticky top-0 z-20 safe-top backdrop-blur-xl",
        "border-gray-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95",
      )}
    >
      <div className="flex items-center gap-2 px-3 md:px-8 py-3 md:py-5 max-w-full min-h-[60px] md:min-h-[72px]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className={cn(
                "p-2 rounded-xl transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0 active:scale-90",
                "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                "dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800",
              )}
              title="Volver"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          {showMenuButton && (
            <button
              onClick={openSidebar}
              className={cn(
                "p-2 rounded-xl transition-colors cursor-pointer md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0 active:scale-90",
                "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                "dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              <Menu size={22} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg md:text-xl font-bold truncate tracking-tight text-gray-900 dark:text-slate-100">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-xs md:text-sm truncate mt-0.5 text-gray-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
