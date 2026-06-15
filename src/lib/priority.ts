import type { Task } from "@/types";

export type PriorityLevel = NonNullable<Task["priority"]>;

export interface PriorityConfig {
  label: string;
  emoji: string;
  dot: string;           // Tailwind bg color for dot
  text: string;          // Tailwind text color
  textDark: string;
  bg: string;            // Tailwind bg for badge (light)
  bgDark: string;
  border: string;        // Tailwind border color
  borderDark: string;
  cardBorder: string;    // left border for task cards
  cardBg: string;        // subtle bg for task cards
  cardBgDark: string;
}

export const PRIORITY_CONFIG: Record<PriorityLevel, PriorityConfig> = {
  urgent: {
    label: "Crítica",
    emoji: "🔴",
    dot: "bg-red-500",
    text: "text-red-600",
    textDark: "dark:text-red-400",
    bg: "bg-red-50",
    bgDark: "dark:bg-red-950/30",
    border: "border-red-200",
    borderDark: "dark:border-red-800/50",
    cardBorder: "border-l-red-500",
    cardBg: "bg-red-50/40",
    cardBgDark: "dark:bg-red-950/10",
  },
  high: {
    label: "Alta",
    emoji: "🟠",
    dot: "bg-orange-500",
    text: "text-orange-600",
    textDark: "dark:text-orange-400",
    bg: "bg-orange-50",
    bgDark: "dark:bg-orange-950/30",
    border: "border-orange-200",
    borderDark: "dark:border-orange-800/50",
    cardBorder: "border-l-orange-500",
    cardBg: "bg-orange-50/40",
    cardBgDark: "dark:bg-orange-950/10",
  },
  medium: {
    label: "Media",
    emoji: "🟡",
    dot: "bg-yellow-500",
    text: "text-yellow-600",
    textDark: "dark:text-yellow-400",
    bg: "bg-yellow-50",
    bgDark: "dark:bg-yellow-950/30",
    border: "border-yellow-200",
    borderDark: "dark:border-yellow-800/50",
    cardBorder: "border-l-yellow-500",
    cardBg: "bg-yellow-50/40",
    cardBgDark: "dark:bg-yellow-950/10",
  },
  low: {
    label: "Baja",
    emoji: "🟢",
    dot: "bg-green-500",
    text: "text-green-600",
    textDark: "dark:text-green-400",
    bg: "bg-green-50",
    bgDark: "dark:bg-green-950/30",
    border: "border-green-200",
    borderDark: "dark:border-green-800/50",
    cardBorder: "border-l-green-500",
    cardBg: "bg-green-50/40",
    cardBgDark: "dark:bg-green-950/10",
  },
};

export const NO_PRIORITY: PriorityConfig = {
  label: "Sin prioridad",
  emoji: "⚪",
  dot: "bg-gray-300",
  text: "text-gray-500",
  textDark: "dark:text-slate-500",
  bg: "bg-gray-50",
  bgDark: "dark:bg-slate-800/50",
  border: "border-gray-200",
  borderDark: "dark:border-slate-700",
  cardBorder: "border-l-gray-300",
  cardBg: "bg-transparent",
  cardBgDark: "dark:bg-transparent",
};

export function getPriorityConfig(priority: Task["priority"]): PriorityConfig {
  if (!priority) return NO_PRIORITY;
  return PRIORITY_CONFIG[priority] ?? NO_PRIORITY;
}
