"use client";

import React from "react";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
      <div className="h-full flex items-center justify-between px-6">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-zinc-500 truncate">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 ml-4">{actions}</div>
        )}
      </div>
    </header>
  );
}
