"use client";

import React from "react";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  Settings,
  Shield,
  CheckCircle2,
  Crown,
  FolderOpen,
  Users,
  ClipboardList,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { lists } = useListStore();
  const { tasks } = useTaskStore();
  if (!user) return null;

  const personalListsCount = lists.filter((l) => l.owner === user.id).length;
  const sharedListsCount = lists.filter(
    (l) =>
      l.owner !== user.id &&
      l.members.some((m: { userId: string }) => m.userId === user.id),
  ).length;
  const totalTasks = tasks.filter((t) =>
    lists.some((l) => l.id === t.listId),
  ).length;

  return (
    <>
      <Header
        title="Configuración"
        description="Personaliza tu experiencia en TASKLYN"
        showMenuButton={true}
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        {/* Plan actual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  user.plan === "PRO" ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <Crown
                  size={24}
                  className={
                    user.plan === "PRO" ? "text-blue-600" : "text-gray-500"
                  }
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Plan {user.plan === "PRO" ? "PRO" : "Gratis"}
                </h2>
                <p className="text-sm text-gray-500">
                  {user.plan === "PRO"
                    ? "Acceso ilimitado a todas las funciones"
                    : "5 listas máximo, 20 tareas por lista"}
                </p>
              </div>
            </div>
            {user.plan === "FREE" && (
              <Button variant="outline" icon={<Crown size={16} />}>
                Actualizar a PRO
              </Button>
            )}
          </div>
        </motion.div>

        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-gray-400" />
            Tus estadísticas
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Listas creadas",
                value: personalListsCount,
                icon: FolderOpen,
              },
              {
                label: "Listas compartidas",
                value: sharedListsCount,
                icon: Users,
              },
              {
                label: "Tareas totales",
                value: totalTasks,
                icon: ClipboardList,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/25">
                  <stat.icon size={14} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {stat.value}
                </p>
                <p className="text-[10px] text-gray-500 text-center leading-tight">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Seguridad */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-gray-400" />
            Seguridad
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-500" />
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    Autenticación segura
                  </p>
                  <p className="text-xs text-gray-500">
                    Tu cuenta está protegida con Google
                  </p>
                </div>
              </div>
              <Badge variant="default">Activo</Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
