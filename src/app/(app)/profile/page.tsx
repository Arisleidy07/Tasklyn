"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import Header from "./header";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  Mail,
  Calendar,
  LogOut,
  Crown,
  Shield,
  CheckCircle2,
  FolderOpen,
  Users,
  Clock,
  TrendingUp,
  Settings,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { lists } = useListStore();
  const { tasks } = useTaskStore();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const joinDate = new Date(user.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  });

  const createdLists = lists.filter((l) => l.owner === user.id);
  const sharedLists = lists.filter(
    (l) => l.owner !== user.id && l.members.some((m) => m.userId === user.id),
  );
  const userTasks = tasks.filter((t) => lists.some((l) => l.id === t.listId));
  const completedTasks = userTasks.filter((t) => t.status === "completed");
  const pendingTasks = userTasks.filter((t) => t.status === "pending");
  const completionRate =
    userTasks.length > 0
      ? Math.round((completedTasks.length / userTasks.length) * 100)
      : 0;

  const stats = [
    {
      label: "Listas creadas",
      value: createdLists.length,
      icon: FolderOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Listas compartidas",
      value: sharedLists.length,
      icon: Users,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
    {
      label: "Tareas completadas",
      value: completedTasks.length,
      icon: CheckCircle2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Tareas pendientes",
      value: pendingTasks.length,
      icon: Clock,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 md:pt-8 pb-20 sm:pb-20 md:pb-12 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6"
        >
          <div className="px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-center sm:justify-start">
                <Avatar
                  name={user.name}
                  photoURL={user.photoURL}
                  size="xl"
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24 text-2xl ring-4 ring-white shadow-lg flex-shrink-0"
                />
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:gap-2 mb-2">
                  <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    {user.name}
                  </h1>
                  <div className="flex justify-center sm:justify-start">
                    <Badge variant={user.plan === "PRO" ? "blue" : "default"}>
                      {user.plan === "PRO" ? "PRO" : "Gratis"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} />
                    {user.email}
                  </div>
                </div>
                <p className="text-gray-400 flex items-center justify-center sm:justify-start gap-1.5 text-xs mt-1">
                  <Calendar size={12} />
                  Miembro desde {joinDate}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                {user.plan === "FREE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Crown size={14} />}
                    className="w-full sm:w-auto"
                  >
                    Actualizar a PRO
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                  icon={<LogOut size={14} />}
                >
                  Salir
                </Button>
              </div>
            </div>

            {/* Stats row */}
            <motion.div
              className="grid grid-cols-2 gap-3 sm:gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.1 },
                },
              }}
            >
              {stats.map((s) => (
                <motion.div
                  key={s.label}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{
                    y: -2,
                    boxShadow: "0 4px 16px -4px rgba(59,130,246,0.12)",
                  }}
                  className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100 transition-colors hover:border-blue-100"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}
                  >
                    <s.icon size={16} className={s.color} />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Barra de progreso de tareas */}
          {userTasks.length > 0 && (
            <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <TrendingUp size={12} />
                  Progreso general de tareas
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {completionRate}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Secciones inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Mis listas */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen size={16} className="text-blue-600" />
                Mis listas recientes
              </h2>
              <Link
                href="/dashboard?view=personal"
                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Ver todas <ChevronRight size={12} />
              </Link>
            </div>
            {createdLists.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Sin listas todavía
              </p>
            ) : (
              <div className="space-y-2">
                {createdLists.slice(0, 4).map((list) => (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FolderOpen size={14} className="text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium truncate flex-1 group-hover:text-gray-900">
                      {list.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {list.members.length} miembro
                      {list.members.length !== 1 ? "s" : ""}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Cuenta y plan */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Shield size={16} className="text-blue-600" />
              Cuenta
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Mail size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      Correo electrónico
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[160px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <CheckCircle2
                  size={14}
                  className="text-blue-500 flex-shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Crown size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      Plan actual
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.plan === "PRO"
                        ? "Acceso ilimitado"
                        : "5 listas · 20 tareas"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={user.plan === "PRO" ? "blue" : "default"}
                  className="text-[10px]"
                >
                  {user.plan === "PRO" ? "PRO" : "Gratis"}
                </Badge>
              </div>

              <Link
                href="/settings"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Settings size={14} className="text-gray-500" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    Configuración
                  </p>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
