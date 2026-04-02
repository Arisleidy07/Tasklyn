'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 'w-7 h-7', text: 'text-lg' },
  md: { icon: 'w-8 h-8', text: 'text-xl' },
  lg: { icon: 'w-10 h-10', text: 'text-2xl' },
};

export default function Logo({ size = 'md', className, showText = true }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          s.icon,
          'rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20'
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-[60%] h-[60%]"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            s.text,
            'font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent'
          )}
        >
          TASKLYN
        </span>
      )}
    </div>
  );
}
