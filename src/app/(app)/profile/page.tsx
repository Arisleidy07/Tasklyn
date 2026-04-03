"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import Header from "@/components/layout/Header";
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
} from "lucide-react";
import { motion } from "framer-motion";

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
    day: "numeric",
  });

  // Estadísticas
  const createdLists = lists.filter((l) => l.owner === user.id);
  const sharedLists = lists.filter(
    (l) => l.owner !== user.id && l.members.some((m) => m.userId === user.id),
  );
  const userTasks = tasks.filter((t) => lists.some((l) => l.id === t.listId));
  const completedTasks = userTasks.filter((t) => t.status === "completed");
  const pendingTasks = userTasks.filter((t) => t.status === "pending");

  return (
    <>
      <Header
        title="Perfil"
        description="Gestiona la configuración de tu cuenta"
      />

      <div className="p-6 max-w-2xl">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-500" />

          {/* Avatar & Info */}
          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-4">
              <Avatar
                name={user.name}
                photoURL={user.photoURL}
                size="xl"
                className="w-32 h-32 text-3xl ring-4 ring-white"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <Badge variant={user.plan === "PRO" ? "blue" : "default"}>
                  {user.plan}
                </Badge>
              </div>
              <p className="text-gray-500 flex items-center gap-2">
                <Mail size={14} />
                {user.email}
              </p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <p className="text-sm text-gray-500">Miembro desde</p>
                <p className="font-medium text-gray-900 flex items-center justify-center gap-2 mt-1">
                  <Calendar size={14} className="text-gray-400" />
                  {joinDate}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium text-gray-900 flex items-center justify-center gap-2 mt-1">
                  {user.plan === "PRO" ? (
                    <>
                      <Crown size={14} className="text-blue-500" />
                      PRO
                    </>
                  ) : (
                    <>
                      <Shield size={14} className="text-gray-400" />
                      Gratis
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Estadísticas de listas y tareas */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-xl font-bold text-blue-600">
                  {createdLists.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Listas creadas</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-xl font-bold text-purple-600">
                  {sharedLists.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Listas compartidas</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">
                  {completedTasks.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tareas completadas</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-xl font-bold text-orange-600">
                  {pendingTasks.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tareas pendientes</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 mt-6">
              {user.plan === "FREE" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  icon={<Crown size={16} />}
                  onClick={() => {}}
                >
                  Actualizar a PRO
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                icon={<LogOut size={16} />}
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configuración de la cuenta
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Mail size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    Correo electrónico
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <CheckCircle2 size={16} className="text-blue-500" />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Crown size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Plan</p>
                  <p className="text-xs text-gray-500">
                    {user.plan} —{" "}
                    {user.plan === "PRO"
                      ? "Acceso ilimitado"
                      : "5 listas, 20 tareas por lista"}
                  </p>
                </div>
              </div>
              {user.plan === "PRO" ? (
                <Badge variant="blue">Activo</Badge>
              ) : (
                <Button size="sm" variant="ghost">
                  Actualizar
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
