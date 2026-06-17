"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, FolderOpen, Bell, User, Users } from "lucide-react";
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
    { name: "Equipos", href: "/teams", icon: Users },
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
    <nav
      className="nav-mobile fixed bottom-0 left-0 right-0 z-50 md:hidden mobile-nav-safe border-t backdrop-blur-xl"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderColor: "var(--border-color)",
        boxShadow: "0 -1px 0 0 var(--border-color)",
      }}
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-all duration-200 active:scale-90"
              style={{ color: active ? "#2563eb" : "var(--text-tertiary)" }}
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: "#2563eb" }}
                />
              )}
              <div
                className="relative flex items-center justify-center w-10 h-8 rounded-xl transition-colors"
                style={{
                  backgroundColor: active
                    ? "rgba(37,99,235,0.1)"
                    : "transparent",
                }}
              >
                <item.icon size={22} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
