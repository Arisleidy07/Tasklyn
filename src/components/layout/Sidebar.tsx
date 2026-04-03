"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Crown,
  FolderOpen,
  Users,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import Avatar from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import CreateListModal from "@/components/lists/CreateListModal";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { getUserLists, getPersonalLists, getSharedLists } = useListStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!user) return null;

  const allLists = getUserLists(user.id);
  const personalLists = getPersonalLists(user.id);
  const sharedLists = getSharedLists(user.id);

  const isActive = (href: string) => {
    if (href.includes("?")) {
      return (
        pathname === "/dashboard" &&
        typeof window !== "undefined" &&
        window.location.search.includes(href.split("?")[1])
      );
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const mainNav = [
    { name: "Panel de control", href: "/dashboard", icon: LayoutDashboard },
  ];

  const listNav = [
    {
      name: "Mis listas",
      href: "/dashboard?view=personal",
      icon: FolderOpen,
      count: personalLists.length,
    },
    {
      name: "Compartidas",
      href: "/dashboard?view=shared",
      icon: Users,
      count: sharedLists.length,
    },
  ];

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white flex-shrink-0">
          <Link href="/dashboard" className="flex items-center">
            <Logo size="md" showText={!collapsed} />
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3 top-5 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm cursor-pointer transition-colors z-40"
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
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                General
              </p>
            )}
            {mainNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span className="flex-1">{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Lists */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Espacio de trabajo
              </p>
            )}
            {listNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.count !== undefined && (
                        <span
                          className={cn(
                            "text-[11px] font-semibold min-w-[20px] h-5 flex items-center justify-center rounded-md px-1.5",
                            active
                              ? "bg-white/20 text-white"
                              : "bg-gray-200 text-gray-600",
                          )}
                        >
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}

            {/* Botón crear lista */}
            <button
              onClick={() => setShowCreateModal(true)}
              title={collapsed ? "Crear lista" : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer",
                "text-blue-600 hover:bg-blue-50",
                collapsed && "justify-center px-0",
              )}
            >
              <Plus size={18} className="flex-shrink-0" />
              {!collapsed && "Crear lista"}
            </button>
          </div>

          {/* Recientes */}
          {!collapsed && allLists.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Recientes
              </p>
              {allLists.slice(0, 5).map((list) => {
                const active = pathname === `/lists/${list.id}`;
                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200",
                      active
                        ? "bg-white text-gray-900 font-medium shadow-sm"
                        : "text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm",
                    )}
                  >
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
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Cuenta
              </p>
            )}
            <Link
              href="/profile"
              title={collapsed ? "Perfil" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                isActive("/profile")
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm",
                collapsed && "justify-center px-0",
              )}
            >
              <User size={18} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1">Perfil</span>}
            </Link>
            <Link
              href="/settings"
              title={collapsed ? "Configuración" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                isActive("/settings")
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm",
                collapsed && "justify-center px-0",
              )}
            >
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
        <div className="px-3 py-3 border-t border-gray-200 bg-white flex-shrink-0">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors",
              collapsed ? "justify-center" : "",
            )}
          >
            <Avatar name={user.name} photoURL={user.photoURL} size="md" />
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
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
