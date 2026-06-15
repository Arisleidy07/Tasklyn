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
  Users,
  Trophy,
  Target,
  Calendar,
  BarChart3,
  History,
  Activity,
} from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";
import Logo from "@/components/shared/Logo";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTeamStore } from "@/stores/teamStore";
import CreateListModal from "@/components/lists/CreateListModal";
import {
  SortableListContainer,
  SortableListItem,
} from "@/components/lists/SortableListContainer";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { getUserLists } = useListStore();
  const { teams } = useTeamStore();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const section = searchParams.get("section");
  const { sidebarCollapsed: collapsed, toggleSidebar, theme } = useUIStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { unreadCount } = useNotificationStore();

  const { reorderLists } = useListStore();

  if (!user) return null;

  const allLists = getUserLists(user.id);
  const sortedLists = [...allLists].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

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
      <aside
        className={cn(
          "sidebar-bg fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out",
          "border-r",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
        style={{
          backgroundColor: "var(--bg-sidebar)",
          borderColor: "var(--border-sidebar)",
        }}
      >
        {/* Logo */}
        <div
          className={cn(
            "h-16 flex items-center justify-between px-4 border-b flex-shrink-0",
          )}
          style={{
            backgroundColor: "var(--bg-sidebar)",
            borderColor: "var(--border-sidebar)",
          }}
        >
          <Link href="/dashboard" className="flex items-center">
            <Logo size="md" showText={!collapsed} />
          </Link>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              className={cn(
                "p-1.5 rounded-lg transition-colors cursor-pointer",
              )}
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--bg-sidebar-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {collapsed && (
            <button
              onClick={toggleSidebar}
              className={cn(
                "absolute -right-3 top-5 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors z-40 border shadow-sm",
              )}
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-color)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
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
                )}
                style={{ color: "var(--text-secondary)" }}
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
                        : "hover:shadow-sm",
                      collapsed && "justify-center px-0",
                    )}
                    style={{
                      color: active ? "#ffffff" : "var(--text-sidebar)",
                      backgroundColor: active ? "#2563eb" : "transparent",
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
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--text-sidebar)";
                      }
                    }}
                  >
                    {active && <div className="sidebar-indicator" />}
                    <item.icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {"badge" in item &&
                          item.badge !== undefined &&
                          item.badge > 0 && (
                            <span
                              className="text-[11px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1"
                              style={{
                                backgroundColor: "#ef4444",
                                color: "#ffffff",
                              }}
                            >
                              {item.badge > 9 ? "9+" : item.badge}
                            </span>
                          )}
                      </>
                    )}
                    {collapsed &&
                      "badge" in item &&
                      item.badge !== undefined &&
                      item.badge > 0 && (
                        <span
                          className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                          style={{ backgroundColor: "#ef4444" }}
                        />
                      )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Teams */}
          <div className="space-y-1">
            {!collapsed && (
              <p
                className={cn(
                  "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                )}
                style={{ color: "var(--text-secondary)" }}
              >
                👥 Equipos
              </p>
            )}
            {teams.slice(0, 3).map((team) => {
              const active = pathname === `/teams/${team.id}`;
              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className={cn(
                    "sidebar-item flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200",
                    active && "shadow-sm",
                  )}
                  style={{
                    backgroundColor: active ? "var(--bg-card)" : "transparent",
                    color: active
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-sidebar-hover)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  {active && <div className="sidebar-indicator" />}
                  <div className="w-2 h-2 rounded-full flex-shrink-0 bg-gradient-to-br from-blue-400 to-indigo-600" />
                  <span className="truncate flex-1">{team.name}</span>
                  {!collapsed && (
                    <span
                      className="text-[10px] font-medium min-w-[16px] h-4 flex items-center justify-center rounded px-1"
                      style={{
                        backgroundColor: active
                          ? "var(--bg-tertiary)"
                          : "var(--bg-secondary)",
                        color: active
                          ? "var(--text-secondary)"
                          : "var(--text-tertiary)",
                      }}
                    >
                      {team.members.length}
                    </span>
                  )}
                </Link>
              );
            })}
            {teams.length > 3 && (
              <Link
                href="/teams"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 hover:shadow-sm",
                )}
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--bg-sidebar-hover)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-tertiary)";
                }}
              >
                <span className="text-xs">+{teams.length - 3} más</span>
              </Link>
            )}
          </div>

          {/* Workspace */}
          <div className="space-y-1">
            {!collapsed && (
              <p
                className={cn(
                  "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                )}
                style={{ color: "var(--text-secondary)" }}
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
                      active && "shadow-sm",
                      collapsed && "justify-center px-0",
                    )}
                    style={{
                      backgroundColor: active ? "#2563eb" : "transparent",
                      color: active ? "#ffffff" : "var(--text-sidebar)",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-sidebar-hover)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--text-sidebar)";
                      }
                    }}
                  >
                    {active && <div className="sidebar-indicator" />}
                    <FolderOpen size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">Listas</span>
                        <span
                          className="text-[11px] font-semibold min-w-[20px] h-5 flex items-center justify-center rounded-md px-1.5"
                          style={{
                            backgroundColor: active
                              ? "rgba(255,255,255,0.2)"
                              : "var(--bg-secondary)",
                            color: active ? "#ffffff" : "var(--text-secondary)",
                          }}
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
                collapsed && "justify-center px-0",
              )}
              style={{ color: "#2563eb" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Plus size={18} className="flex-shrink-0" />
              {!collapsed && "Nueva lista"}
            </motion.button>
          </div>

          {/* Listas — sortable */}
          {!collapsed && sortedLists.length > 0 && (
            <div className="space-y-1">
              <p
                className={cn(
                  "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                )}
                style={{ color: "var(--text-secondary)" }}
              >
                Listas
              </p>
              <SortableListContainer
                lists={sortedLists.slice(0, 8)}
                onReorder={(newOrder) =>
                  reorderLists(newOrder.map((l) => l.id))
                }
              >
                {(list, index, total, moveUp, moveDown) => {
                  const active = pathname === `/lists/${list.id}`;
                  return (
                    <SortableListItem
                      key={list.id}
                      list={list}
                      index={index}
                      total={total}
                      onMoveUp={moveUp}
                      onMoveDown={moveDown}
                      showMoveButtons
                    >
                      <Link
                        href={`/lists/${list.id}`}
                        className={cn(
                          "sidebar-item flex items-center gap-2 px-2 py-2 rounded-xl text-[13px] transition-all duration-200 w-full",
                          active && "shadow-sm",
                        )}
                        style={{
                          backgroundColor: active
                            ? "var(--bg-card)"
                            : "transparent",
                          color: active
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor =
                              "var(--bg-sidebar-hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
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
                              list.color ||
                              (list.type === "shared" ? "#60a5fa" : "#9ca3af"),
                          }}
                        />
                        <span className="truncate flex-1">{list.name}</span>
                      </Link>
                    </SortableListItem>
                  );
                }}
              </SortableListContainer>
            </div>
          )}

          {/* Cuenta */}
          <div className="space-y-1">
            {!collapsed && (
              <p
                className={cn(
                  "px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest",
                )}
                style={{ color: "var(--text-secondary)" }}
              >
                Cuenta
              </p>
            )}
            <Link
              href="/profile"
              title={collapsed ? "Perfil" : undefined}
              className={cn(
                "sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                isActive("/profile") && "shadow-sm",
                collapsed && "justify-center px-0",
              )}
              style={{
                backgroundColor: isActive("/profile")
                  ? "var(--bg-card)"
                  : "transparent",
                color: isActive("/profile")
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/profile")) {
                  e.currentTarget.style.backgroundColor =
                    "var(--bg-sidebar-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/profile")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
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
                isActive("/settings") && "shadow-sm",
                collapsed && "justify-center px-0",
              )}
              style={{
                backgroundColor: isActive("/settings")
                  ? "var(--bg-card)"
                  : "transparent",
                color: isActive("/settings")
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/settings")) {
                  e.currentTarget.style.backgroundColor =
                    "var(--bg-sidebar-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/settings")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              {isActive("/settings") && <div className="sidebar-indicator" />}
              <Settings size={18} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1">Configuración</span>}
            </Link>
          </div>
        </nav>

        {/* Tarjeta de actualización */}
        {!collapsed && user.plan === "free" && (
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
          className={cn("px-3 py-3 border-t flex-shrink-0")}
          style={{
            backgroundColor: "var(--bg-sidebar)",
            borderColor: "var(--border-sidebar)",
          }}
        >
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl transition-colors",
              collapsed ? "justify-center" : "",
            )}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-sidebar-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Avatar name={user.name} photoURL={user.photoURL} size="md" />
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.name}
                  </p>
                  <p
                    className="text-[11px] truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
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
