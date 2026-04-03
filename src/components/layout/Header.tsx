"use client";

import React from "react";

interface HeaderProps {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export default function Header({
  title,
  description,
  actions,
  badge,
}: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center justify-between px-8 py-5 max-w-full">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 truncate tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
