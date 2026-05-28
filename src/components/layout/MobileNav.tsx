"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Bell,
  User,
  Settings,
} from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  const items = [
    { name: "Panel", href: "/dashboard", icon: LayoutDashboard },
    { name: "Listas", href: "/dashboard?view=personal", icon: FolderOpen },
    { name: "Alertas", href: "/notifications", icon: Bell, badge: unreadCount },
    { name: "Perfil", href: "/profile", icon: User },
    { name: "Config", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard" && !href.includes("?")) {
      return pathname === "/dashboard";
    }
    if (href.includes("?view=personal")) {
      return (
        pathname === "/dashboard" &&
        typeof window !== "undefined" &&
        window.location.search.includes("view=personal")
      );
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors",
                active ? "text-blue-600" : "text-gray-400"
              )}
            >
              <div className="relative">
                <item.icon size={22} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-blue-600" : "text-gray-400"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
