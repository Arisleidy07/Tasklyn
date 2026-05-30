"use client";

import React, { useRef, useEffect, useState } from "react";
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
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 20;
    const maxHeight = maxRows * lineHeight;
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
    setIsOverflowing(el.scrollHeight > maxHeight);
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
        "w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none overflow-x-hidden whitespace-pre-wrap break-words",
        isOverflowing ? "overflow-y-auto" : "overflow-y-hidden",
        className,
      )}
    />
  );
}
