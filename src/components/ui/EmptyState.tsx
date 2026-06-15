"use client";

import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
        style={{
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text-tertiary)",
        }}
      >
        {icon}
      </div>
      <h3
        className="text-base font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="mt-1.5 text-sm max-w-xs leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
