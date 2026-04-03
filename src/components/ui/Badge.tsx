"use client";

import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "blue"
  | "sky";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-blue-50 text-blue-700",
  warning: "bg-gray-100 text-gray-600",
  danger: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  sky: "bg-blue-50 text-blue-600",
};

export default function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
