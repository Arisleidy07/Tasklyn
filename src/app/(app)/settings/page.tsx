"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  Settings,
  Bell,
  Palette,
  Shield,
  Trash2,
  Moon,
  Sun,
  Globe,
  CheckCircle2,
  AlertCircle,
  Crown,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { lists } = useListStore();
  const { tasks } = useTaskStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  if (!user) return null;

  const personalListsCount = lists.filter((l) => l.owner === user.id).length;
  const sharedListsCount = lists.filter(
    (l) => l.owner !== user.id && l.members.some((m) => m.userId === user.id)
  ).length;
  const totalTasks = tasks.filter((t) =>
    lists.some((l) => l.id === t.listId)
  ).length;

  return (
    <>
      <Header
        title="Configuración"
        description="Personaliza tu experiencia en TASKLYN"
      />

      <div className="p-6 max-w-3xl">
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

        {/* Preferencias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette size={20} className="text-gray-400" />
            Preferencias
          </h2>
          <div className="space-y-4">
            {/* Notificaciones */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell size={18} className="text-gray-500" />
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    Notificaciones
                  </p>
                  <p className="text-xs text-gray-500">
                    Recibir alertas sobre tareas y invitaciones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notifications ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    notifications ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Modo oscuro */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon size={18} className="text-gray-500" />
                ) : (
                  <Sun size={18} className="text-gray-500" />
                )}
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    Modo oscuro
                  </p>
                  <p className="text-xs text-gray-500">
                    Cambiar la apariencia de la aplicación
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  darkMode ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    darkMode ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Idioma */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-gray-500" />
                <div>
                  <p className="font-medium text-sm text-gray-900">Idioma</p>
                  <p className="text-xs text-gray-500">
                    Idioma de la interfaz
                  </p>
                </div>
              </div>
              <Badge variant="blue">Español</Badge>
            </div>
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
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {personalListsCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Listas creadas</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {sharedListsCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Listas compartidas</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{totalTasks}</p>
              <p className="text-xs text-gray-500 mt-1">Tareas totales</p>
            </div>
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
