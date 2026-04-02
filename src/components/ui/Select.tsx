'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full h-10 pl-3 pr-8 rounded-lg border bg-white text-sm text-zinc-900 appearance-none transition-colors cursor-pointer',
            'border-zinc-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none',
            'dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        />
      </div>
    </div>
  );
}
