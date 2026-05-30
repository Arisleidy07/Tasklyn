"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  minRows?: number;
  maxRows?: number;
}

export default function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  autoFocus,
  className,
  minRows = 1,
  maxRows = 8,
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 20;
    const maxHeight = maxRows * lineHeight;
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
  }, [value, maxRows]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      rows={minRows}
      className={cn(
        "w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none overflow-hidden",
        className,
      )}
    />
  );
}
