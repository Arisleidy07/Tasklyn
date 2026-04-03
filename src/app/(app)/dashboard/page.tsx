"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import Header from "@/components/layout/Header";
import ListCard from "@/components/lists/ListCard";
import CreateListModal from "@/components/lists/CreateListModal";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  Plus,
  ListTodo,
  FolderOpen,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { PLAN_LIMITS } from "@/types";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") as "personal" | "shared" | null;
  const { user } = useAuthStore();
  const { getPersonalLists, getSharedLists, getUserLists } = useListStore();
  const { tasks } = useTaskStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!user) return null;

  const personalLists = getPersonalLists(user.id);
  const sharedLists = getSharedLists(user.id);
  const allLists = getUserLists(user.id);
  const limits = PLAN_LIMITS[user.plan];
  const canCreate = allLists.length < limits.maxLists;

  const allListIds = new Set(allLists.map((l) => l.id));
  const userTasks = tasks.filter((t) => allListIds.has(t.listId));
  const completedTasks = userTasks.filter((t) => t.status === "completed");
  const pendingTasks = userTasks.filter((t) => t.status === "pending");
  const completionRate =
    userTasks.length > 0
      ? Math.round((completedTasks.length / userTasks.length) * 100)
      : 0;

  const stats = [
    {
      label: "Listas totales",
      value: allLists.length,
      icon: FolderOpen,
      color: "blue",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Compartidas",
      value: sharedLists.length,
      icon: Users,
      color: "blue",
      bg: "bg-gray-100",
      text: "text-gray-600",
    },
    {
      label: "Completadas",
      value: completedTasks.length,
      icon: CheckCircle2,
      color: "blue",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Pendientes",
      value: pendingTasks.length,
      icon: Clock,
      color: "gray",
      bg: "bg-gray-100",
      text: "text-gray-600",
    },
  ];

  return (
    <>
      <Header
        title={
          view === "personal"
            ? "Mis listas"
            : view === "shared"
              ? "Listas compartidas"
              : "Panel de control"
        }
        description={
          view === "personal"
            ? `Tienes ${personalLists.length} lista${personalLists.length === 1 ? "" : "s"} personal${personalLists.length === 1 ? "" : "es"}`
            : view === "shared"
              ? `Tienes ${sharedLists.length} lista${sharedLists.length === 1 ? "" : "s"} compartida${sharedLists.length === 1 ? "" : "s"}`
              : `Bienvenido de nuevo, ${user.name.split(" ")[0]}. Aquí está tu resumen.`
        }
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            disabled={!canCreate}
          >
            Nueva lista
          </Button>
        }
      />

      <div className="p-8 space-y-10 max-w-[1200px]">
        {/* Stats - solo mostrar en vista general */}
        {!view && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="group relative p-5 rounded-xl border border-gray-200 bg-white hover:shadow-md hover:shadow-gray-200/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.text}`}
                  >
                    <stat.icon size={18} />
                  </div>
                  {stat.label === "Completed" && userTasks.length > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                      <TrendingUp size={12} />
                      {completionRate}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Listas personales - solo mostrar si no hay filtro o es personal */}
        {(!view || view === "personal") && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FolderOpen size={16} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {view === "personal"
                      ? "Tus listas personales"
                      : "Mis listas"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {personalLists.length}{" "}
                    {personalLists.length === 1 ? "lista" : "listas"}
                  </p>
                </div>
              </div>
              {personalLists.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus size={14} />}
                >
                  Añadir lista
                </Button>
              )}
            </div>
            {personalLists.length === 0 ? (
              <EmptyState
                icon={<ListTodo size={24} />}
                title="Aún no tienes listas personales"
                description="Crea tu primera lista personal para empezar a organizar tus tareas."
                action={
                  <Button
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus size={14} />}
                  >
                    Crear lista
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalLists.map((list, i) => (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <ListCard list={list} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Listas compartidas - solo mostrar si no hay filtro o es shared */}
        {(!view || view === "shared") && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Users size={16} className="text-gray-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {view === "shared"
                      ? "Tus listas compartidas"
                      : "Listas compartidas"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {sharedLists.length}{" "}
                    {sharedLists.length === 1 ? "lista" : "listas"}
                  </p>
                </div>
              </div>
              {sharedLists.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus size={14} />}
                >
                  Añadir lista
                </Button>
              )}
            </div>
            {sharedLists.length === 0 ? (
              <EmptyState
                icon={<Users size={24} />}
                title="Aún no tienes listas compartidas"
                description="Crea una lista compartida o acepta una invitación para colaborar con otros."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus size={14} />}
                  >
                    Crear lista compartida
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sharedLists.map((list, i) => (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <ListCard list={list} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Crear primera lista - solo mostrar en vista general */}
        {!view && allLists.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-xl border-2 border-dashed border-gray-200 text-center"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Plus size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Crea tu primera lista
            </h3>
            <p className="text-sm text-gray-500 mt-1.5 max-w-sm mx-auto">
              Empieza creando una lista personal o compartida para organizar tus
              tareas.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<ArrowRight size={16} />}
              >
                Comenzar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Aviso de límite del plan - solo mostrar en vista general */}
        {!view && !canCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 rounded-xl bg-gray-50 border border-gray-200"
          >
            <p className="text-sm text-gray-700 font-semibold">
              Has alcanzado el límite de {limits.maxLists} listas en el plan{" "}
              {user.plan}.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Actualiza a PRO para listas ilimitadas, tareas y miembros del
              equipo.
            </p>
          </motion.div>
        )}
      </div>

      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
