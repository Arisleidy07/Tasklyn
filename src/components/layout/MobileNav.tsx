"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const section = searchParams.get("section");
  const { unreadCount } = useNotificationStore();

  const items = [
    { name: "Inicio", href: "/dashboard", icon: LayoutDashboard },
    { name: "Listas", href: "/dashboard?section=lists", icon: FolderOpen },
    { name: "Alertas", href: "/notifications", icon: Bell, badge: unreadCount },
    { name: "Perfil", href: "/profile", icon: User },
    { name: "Config", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      // "Inicio" activo solo cuando no hay section/view params
      return pathname === "/dashboard" && !section && !view;
    }
    if (href === "/dashboard?section=lists") {
      // "Listas" activo cuando en dashboard con section/view o dentro de una lista
      return (
        (pathname === "/dashboard" && (!!section || !!view)) ||
        pathname?.startsWith("/lists/")
      );
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/80 mobile-nav-safe shadow-[0_-1px_0_0_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-all duration-200 active:scale-90",
                active ? "text-blue-600" : "text-gray-400",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-600" />
              )}
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-8 rounded-xl transition-colors",
                  active ? "bg-blue-50" : "",
                )}
              >
                <item.icon size={22} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-blue-600" : "text-gray-400",
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
