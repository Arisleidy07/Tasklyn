"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export default function Select({
  label,
  options,
  className,
  style,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          className="block text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            "w-full h-10 pl-3 pr-8 rounded-lg border text-sm appearance-none transition-colors cursor-pointer focus:outline-none focus:ring-2",
            className,
          )}
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-input)",
            color: "var(--text-primary)",
            ...style,
          }}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{
                backgroundColor: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--text-tertiary)" }}
        />
      </div>
    </div>
  );
}
