"use client";

import React, { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import type { AppTheme } from "@/stores/uiStore";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  FolderOpen,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  Bell,
} from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";
import Logo from "@/components/shared/Logo";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import CreateListModal from "@/components/lists/CreateListModal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { getUserLists } = useListStore();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const section = searchParams.get("section");
  const { sidebarCollapsed: collapsed, toggleSidebar, theme } = useUIStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { unreadCount } = useNotificationStore();

  if (!user) return null;

  const allLists = getUserLists(user.id);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" && !view && !section;
    }
    if (href === "/dashboard?section=lists") {
      return (
        (pathname === "/dashboard" && (section === "lists" || !!view)) ||
        (pathname?.startsWith("/lists/") ?? false)
      );
    }
    return pathname === href || (pathname?.startsWith(href + "/") ?? false);
  };

  const mainNav = [
    { name: "Panel de control", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Notificaciones",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount,
    },
  ];

  return (
    <>
      <aside
        className={cn(
          "sidebar-bg fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out",
          "bg-gray-50/80 border-r border-gray-200",
          "dark:bg-slate-900/90 dark:border-slate-800",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "h-16 flex items-center justify-between px-4 border-b flex-shrink-0",
            "border-gray-200 bg-white/90",
            "dark:bg-slate-900/90 dark:border-slate-800",
          )}
        >
          <Link href="/dashboard" className="flex items-center">
            <Logo size="md" showText={!collapsed} />
          </Link>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
                "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                "dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {collapsed && (
            <button
              onClick={toggleSidebar}
              className={cn(
                "absolute -right-3 top-5 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors z-40",
                "bg-white border border-gray-200 text-gray-400 hover:text-gray-600 shadow-sm",
                "dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-300",
              )}
            >
              <ChevronRight size={12} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Main */}
          <div className="space-y-1">
            {!collapsed && (
              <p
                className={cn(
                  "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                  "text-gray-400",
                  "dark:text-slate-500",
                )}
              >
                General
              </p>
            )}
            {mainNav.map((item) => {
              const active = isActive(item.href);
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ x: active ? 0 : 2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Link
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "sidebar-item relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                      active
                        ? "sidebar-item-active bg-blue-600 text-white shadow-sm shadow-blue-600/25 dark:bg-blue-600/90 dark:shadow-blue-900/30"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {active && <div className="sidebar-indicator" />}
                    <item.icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {"badge" in item &&
                          item.badge !== undefined &&
                          item.badge > 0 && (
                            <span className="text-[11px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 bg-red-500 text-white">
                              {item.badge > 9 ? "9+" : item.badge}
                            </span>
                          )}
                      </>
                    )}
                    {collapsed &&
                      "badge" in item &&
                      item.badge !== undefined &&
                      item.badge > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
                      )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Workspace */}
          <div className="space-y-1">
            {!collapsed && (
              <p
                className={cn(
                  "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                  "text-gray-400",
                  "dark:text-slate-500",
                )}
              >
                Workspace
              </p>
            )}
            {(() => {
              const active = isActive("/dashboard?section=lists");
              return (
                <motion.div
                  whileHover={{ x: active ? 0 : 2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Link
                    href="/dashboard?section=lists"
                    title={collapsed ? "Listas" : undefined}
                    className={cn(
                      "sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                      active
                        ? "sidebar-item-active bg-blue-600 text-white shadow-sm shadow-blue-600/25 dark:bg-blue-600/90 dark:shadow-blue-900/30"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {active && <div className="sidebar-indicator" />}
                    <FolderOpen size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">Listas</span>
                        <span
                          className={cn(
                            "text-[11px] font-semibold min-w-[20px] h-5 flex items-center justify-center rounded-md px-1.5",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
                          )}
                        >
                          {allLists.length}
                        </span>
                      </>
                    )}
                  </Link>
                </motion.div>
              );
            })()}

            {/* Nueva lista */}
            <motion.button
              onClick={() => setShowCreateModal(true)}
              title={collapsed ? "Nueva lista" : undefined}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer",
                "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30",
                collapsed && "justify-center px-0",
              )}
            >
              <Plus size={18} className="flex-shrink-0" />
              {!collapsed && "Nueva lista"}
            </motion.button>
          </div>

          {/* Recientes */}
          {!collapsed && allLists.length > 0 && (
            <div className="space-y-1">
              <p
                className={cn(
                  "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                  "text-gray-400",
                  "dark:text-slate-500",
                )}
              >
                Recientes
              </p>
              {allLists.slice(0, 5).map((list) => {
                const active = pathname === `/lists/${list.id}`;
                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className={cn(
                      "sidebar-item flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200",
                      active
                        ? "bg-white text-gray-900 font-medium shadow-sm dark:bg-slate-800 dark:text-slate-100"
                        : "text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300",
                    )}
                  >
                    {active && <div className="sidebar-indicator" />}
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        list.type === "shared" ? "bg-blue-400" : "bg-gray-400",
                      )}
                    />
                    <span className="truncate flex-1">{list.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Cuenta */}
          <div className="space-y-1">
            {!collapsed && (
              <p
                className={cn(
                  "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                  "text-gray-400",
                  "dark:text-slate-500",
                )}
              >
                Cuenta
              </p>
            )}
            <Link
              href="/profile"
              title={collapsed ? "Perfil" : undefined}
              className={cn(
                "sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                isActive("/profile")
                  ? "sidebar-item-active bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                  : "text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300",
                collapsed && "justify-center px-0",
              )}
            >
              {isActive("/profile") && <div className="sidebar-indicator" />}
              <User size={18} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1">Perfil</span>}
            </Link>
            <Link
              href="/settings"
              title={collapsed ? "Configuración" : undefined}
              className={cn(
                "sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                isActive("/settings")
                  ? "sidebar-item-active bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                  : "text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300",
                collapsed && "justify-center px-0",
              )}
            >
              {isActive("/settings") && <div className="sidebar-indicator" />}
              <Settings size={18} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1">Configuración</span>}
            </Link>
          </div>
        </nav>

        {/* Tarjeta de actualización */}
        {!collapsed && user.plan === "FREE" && (
          <div className="px-3 pb-3 flex-shrink-0">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-blue-100" />
                  <span className="text-xs font-bold text-white">
                    Actualizar a PRO
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 leading-relaxed">
                  Listas ilimitadas, tareas y miembros del equipo.
                </p>
                <button className="mt-3 w-full h-8 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-white/30">
                  Más información
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User section */}
        <div
          className={cn(
            "px-3 py-3 border-t flex-shrink-0",
            "border-gray-200 bg-white/90",
            "dark:bg-slate-900/90 dark:border-slate-800",
          )}
        >
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl transition-colors",
              "hover:bg-gray-50 dark:hover:bg-slate-800",
              collapsed ? "justify-center" : "",
            )}
          >
            <Avatar name={user.name} photoURL={user.photoURL} size="md" />
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate dark:text-slate-200">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate dark:text-slate-400">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    "text-gray-400 hover:text-red-500 hover:bg-red-50",
                    "dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/30",
                  )}
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </Link>
        </div>
      </aside>

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
