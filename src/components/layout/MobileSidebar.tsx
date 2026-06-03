"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  LogOut,
  Crown,
  Plus,
  Settings,
  Sparkles,
  User,
  Bell,
  X,
  Users,
  BarChart3,
  Trophy,
  Calendar,
  History,
  Activity,
  UserSquare2,
} from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";
import Logo from "@/components/shared/Logo";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import CreateListModal from "@/components/lists/CreateListModal";
import { cn } from "@/lib/utils";

export default function MobileSidebar() {
  const { sidebarOpen, closeSidebar } = useUIStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const { user, logout } = useAuthStore();
  const { getUserLists } = useListStore();
  const { unreadCount } = useNotificationStore();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  if (!user) return null;

  const allLists = getUserLists(user.id);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const mainNav = [
    { name: "Panel de control", href: "/dashboard", icon: LayoutDashboard },
    { name: "Actividad", href: "/activity", icon: Activity },
    { name: "Equipos", href: "/teams", icon: Users },
    { name: "Panel de Equipo", href: "/team-dashboard", icon: BarChart3 },
    { name: "Ranking", href: "/ranking", icon: Trophy },
    { name: "Clientes", href: "/clients", icon: UserSquare2 },
    { name: "Calendario", href: "/calendar", icon: Calendar },
    { name: "Historial", href: "/history", icon: History },
    {
      name: "Notificaciones",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden"
              onClick={closeSidebar}
            />

            {/* Sidebar Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 left-0 z-[9999] w-[280px] max-w-[85vw] flex flex-col md:hidden",
                "bg-white border-r border-gray-200",
                "dark:bg-slate-900 dark:border-slate-800",
              )}
            >
              {/* Header */}
              <div
                className={cn(
                  "h-16 flex items-center justify-between px-4 border-b flex-shrink-0",
                  "border-gray-200 bg-white",
                  "dark:bg-slate-900 dark:border-slate-800",
                )}
              >
                <Link
                  href="/dashboard"
                  onClick={closeSidebar}
                  className="flex items-center"
                >
                  <Logo size="md" showText />
                </Link>
                <button
                  onClick={closeSidebar}
                  className={cn(
                    "p-2 rounded-lg transition-colors cursor-pointer",
                    "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                    "dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800",
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                {/* Main */}
                <div className="space-y-1">
                  <p
                    className={cn(
                      "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                      "text-gray-400",
                      "dark:text-slate-500",
                    )}
                  >
                    General
                  </p>
                  {mainNav.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={closeSidebar}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-200",
                          active
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25 dark:bg-blue-600/90 dark:shadow-blue-900/30"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                        )}
                      >
                        {active && <div className="sidebar-indicator" />}
                        <item.icon size={18} className="flex-shrink-0" />
                        <span className="flex-1">{item.name}</span>
                        {"badge" in item &&
                          item.badge !== undefined &&
                          item.badge > 0 && (
                            <span className="text-[11px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 bg-red-500 text-white">
                              {item.badge > 9 ? "9+" : item.badge}
                            </span>
                          )}
                      </Link>
                    );
                  })}
                </div>

                {/* Recientes */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-3 mb-2">
                    <p
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-widest",
                        "text-gray-400",
                        "dark:text-slate-500",
                      )}
                    >
                      {allLists.length > 0 ? "Recientes" : "Listas"}
                    </p>
                    <button
                      onClick={() => {
                        setShowCreateModal(true);
                        closeSidebar();
                      }}
                      className={cn(
                        "flex items-center gap-1 text-[11px] font-semibold transition-colors",
                        "text-blue-600 hover:text-blue-700",
                        "dark:text-blue-400 dark:hover:text-blue-300",
                      )}
                    >
                      <Plus size={12} />
                      Nueva
                    </button>
                  </div>
                  {allLists.slice(0, 6).map((list) => {
                    const active = pathname === `/lists/${list.id}`;
                    return (
                      <Link
                        key={list.id}
                        href={`/lists/${list.id}`}
                        onClick={closeSidebar}
                        className={cn(
                          "sidebar-item flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200",
                          active
                            ? "bg-gray-100 text-gray-900 font-medium dark:bg-slate-800 dark:text-slate-100"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300",
                        )}
                      >
                        {active && <div className="sidebar-indicator" />}
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            list.type === "shared"
                              ? "bg-blue-400"
                              : "bg-gray-400",
                          )}
                        />
                        <span className="truncate flex-1">{list.name}</span>
                      </Link>
                    );
                  })}
                  {allLists.length === 0 && (
                    <p className="px-3 py-2 text-xs text-gray-400">
                      Aún no tienes listas
                    </p>
                  )}
                </div>

                {/* Cuenta */}
                <div className="space-y-1">
                  <p
                    className={cn(
                      "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                      "text-gray-400",
                      "dark:text-slate-500",
                    )}
                  >
                    Cuenta
                  </p>
                  <Link
                    href="/profile"
                    onClick={closeSidebar}
                    className={cn(
                      "sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-200",
                      isActive("/profile")
                        ? "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300",
                    )}
                  >
                    {isActive("/profile") && (
                      <div className="sidebar-indicator" />
                    )}
                    <User size={18} className="flex-shrink-0" />
                    <span className="flex-1">Perfil</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={closeSidebar}
                    className={cn(
                      "sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium transition-all duration-200",
                      isActive("/settings")
                        ? "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300",
                    )}
                  >
                    {isActive("/settings") && (
                      <div className="sidebar-indicator" />
                    )}
                    <Settings size={18} className="flex-shrink-0" />
                    <span className="flex-1">Configuración</span>
                  </Link>
                </div>
              </nav>

              {/* Tarjeta de actualización */}
              {user.plan === "free" && (
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
                  "border-gray-200 bg-white",
                  "dark:bg-slate-900 dark:border-slate-800",
                )}
              >
                <div className="flex items-center gap-3 p-2 rounded-xl">
                  <Avatar name={user.name} photoURL={user.photoURL} size="md" />
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
                      "p-2 rounded-lg transition-colors cursor-pointer",
                      "text-gray-400 hover:text-red-500 hover:bg-red-50",
                      "dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/30",
                    )}
                    title="Cerrar sesión"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
