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
              className="fixed inset-y-0 left-0 z-[9999] w-[280px] max-w-[85vw] flex flex-col md:hidden border-r"
              style={{
                backgroundColor: "var(--bg-sidebar)",
                borderColor: "var(--border-sidebar)",
              }}
            >
              {/* Header */}
              <div
                className="h-16 flex items-center justify-between px-4 border-b flex-shrink-0"
                style={{
                  backgroundColor: "var(--bg-sidebar)",
                  borderColor: "var(--border-sidebar)",
                }}
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
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.backgroundColor =
                      "var(--bg-sidebar-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                {/* Main */}
                <div className="space-y-1">
                  <p
                    className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-tertiary)" }}
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
                        className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
                        style={{
                          backgroundColor: active ? "#2563eb" : "transparent",
                          color: active ? "#ffffff" : "var(--text-sidebar)",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor =
                              "var(--bg-sidebar-hover)";
                            e.currentTarget.style.color =
                              "var(--text-sidebar-active)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = "var(--text-sidebar)";
                          }
                        }}
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
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {allLists.length > 0 ? "Recientes" : "Listas"}
                    </p>
                    <button
                      onClick={() => {
                        setShowCreateModal(true);
                        closeSidebar();
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold transition-colors text-blue-600"
                      style={{ color: "var(--text-link)" }}
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
                        className="sidebar-item flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200"
                        style={{
                          backgroundColor: active
                            ? "var(--bg-sidebar-active)"
                            : "transparent",
                          color: active
                            ? "var(--text-sidebar-active)"
                            : "var(--text-secondary)",
                          fontWeight: active ? "500" : "400",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor =
                              "var(--bg-sidebar-hover)";
                            e.currentTarget.style.color =
                              "var(--text-sidebar-active)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color =
                              "var(--text-secondary)";
                          }
                        }}
                      >
                        {active && <div className="sidebar-indicator" />}
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              list.type === "shared"
                                ? "#60a5fa"
                                : "var(--text-tertiary)",
                          }}
                        />
                        <span className="truncate flex-1">{list.name}</span>
                      </Link>
                    );
                  })}
                  {allLists.length === 0 && (
                    <p
                      className="px-3 py-2 text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Aún no tienes listas
                    </p>
                  )}
                </div>

                {/* Cuenta */}
                <div className="space-y-1">
                  <p
                    className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Cuenta
                  </p>
                  {[
                    { href: "/profile", icon: User, label: "Perfil" },
                    {
                      href: "/settings",
                      icon: Settings,
                      label: "Configuración",
                    },
                  ].map(({ href, icon: Icon, label }) => {
                    const active = isActive(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={closeSidebar}
                        className="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
                        style={{
                          backgroundColor: active
                            ? "var(--bg-sidebar-active)"
                            : "transparent",
                          color: active
                            ? "var(--text-sidebar-active)"
                            : "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor =
                              "var(--bg-sidebar-hover)";
                            e.currentTarget.style.color =
                              "var(--text-sidebar-active)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color =
                              "var(--text-secondary)";
                          }
                        }}
                      >
                        {active && <div className="sidebar-indicator" />}
                        <Icon size={18} className="flex-shrink-0" />
                        <span className="flex-1">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* Tarjeta de actualización */}
              {user.plan === "free" && (
                <div className="px-3 pb-3 flex-shrink-0">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
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
                      <Link
                        href="/pricing"
                        onClick={closeSidebar}
                        className="mt-3 block text-center w-full py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors border border-white/30"
                      >
                        Ver planes
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* User section */}
              <div
                className="px-3 py-3 border-t flex-shrink-0"
                style={{
                  backgroundColor: "var(--bg-sidebar)",
                  borderColor: "var(--border-sidebar)",
                }}
              >
                <div className="flex items-center gap-3 p-2 rounded-xl">
                  <Avatar name={user.name} photoURL={user.photoURL} size="md" />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {user.name}
                    </p>
                    <p
                      className="text-[11px] truncate"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      logout();
                    }}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.backgroundColor = "var(--bg-error)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-tertiary)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
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
