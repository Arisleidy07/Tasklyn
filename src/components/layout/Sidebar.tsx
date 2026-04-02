"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Crown } from "lucide-react";
import Logo from "@/components/shared/Logo";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-zinc-100 dark:border-zinc-800">
        <Link href="/dashboard">
          <Logo size="md" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
              )}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      <div className="px-3 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 border border-violet-100 dark:border-violet-500/20">
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
              {user.plan} Plan
            </span>
          </div>
          {user.plan === "FREE" && (
            <p className="mt-1 text-[11px] text-violet-600/70 dark:text-violet-400/60">
              Upgrade to PRO for unlimited access
            </p>
          )}
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 px-2">
          <Avatar name={user.name} photoURL={user.photoURL} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {user.name}
            </p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
