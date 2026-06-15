"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, style, ...props }, ref) => {
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
        <textarea
          ref={ref}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg border text-sm transition-all resize-none focus:ring-2 focus:outline-none",
            error && "focus:ring-red-500/20",
            className,
          )}
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: error ? "var(--text-error)" : "var(--border-input)",
            color: "var(--text-primary)",
            ...style,
          }}
          {...props}
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--text-error)" }}>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
