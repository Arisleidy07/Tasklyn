"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTaskStore } from "@/stores/taskStore";
import Header from "@/components/layout/Header";
import ListCard from "@/components/lists/ListCard";
import CreateListModal from "@/components/lists/CreateListModal";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
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
  const router = useRouter();
  const view = searchParams.get("view") as "personal" | "shared" | null;
  const section = searchParams.get("section");
  const isListsSection = section === "lists" || view !== null;
  const activeTab: "personal" | "shared" =
    view === "shared" ? "shared" : "personal";
  const { user } = useAuthStore();
  const { getPersonalLists, getSharedLists, getUserLists } = useListStore();
  const { tasks } = useTaskStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!user) return null;

  const handleTabChange = (tab: "personal" | "shared") => {
    router.replace(`/dashboard?section=lists&view=${tab}`);
  };

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
        title={isListsSection ? "Mis listas" : "Panel de control"}
        description={
          isListsSection
            ? activeTab === "personal"
              ? `${personalLists.length} lista${personalLists.length !== 1 ? "s" : ""} personal${personalLists.length !== 1 ? "es" : ""}`
              : `${sharedLists.length} lista${sharedLists.length !== 1 ? "s" : ""} compartida${sharedLists.length !== 1 ? "s" : ""}`
            : `Bienvenido, ${user.name.split(" ")[0]}`
        }
        showMenuButton={true}
        actions={
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
            disabled={!canCreate}
          >
            <span className="hidden sm:inline">Nueva lista</span>
          </Button>
        }
      />

      {/* Tab bar — Personales / Compartidas */}
      {isListsSection && (
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="flex max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8">
            {(["personal", "shared"] as const).map((tab) => {
              const isTabActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`relative flex items-center gap-2 py-3.5 px-4 sm:px-5 text-sm font-medium transition-all duration-200 ${
                    isTabActive
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab === "personal" ? (
                    <FolderOpen size={14} />
                  ) : (
                    <Users size={14} />
                  )}
                  <span>
                    {tab === "personal" ? "Personales" : "Compartidas"}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-semibold transition-colors ${
                      isTabActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab === "personal"
                      ? personalLists.length
                      : sharedLists.length}
                  </span>
                  {isTabActive && (
                    <motion.span
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4 md:p-8 space-y-6 sm:space-y-8 md:space-y-10 max-w-[1400px] mx-auto">
        {/* Stats - solo mostrar en vista general */}
        {!isListsSection && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 20px 40px -12px rgba(59,130,246,0.2)",
                }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-white hover:border-blue-200 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/0 group-hover:to-blue-50/20 transition-all duration-500 pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                      i % 2 === 0
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25"
                        : "bg-gradient-to-br from-gray-700 to-gray-900 shadow-gray-500/20"
                    }`}
                  >
                    <stat.icon size={18} className="text-white" />
                  </div>
                  {stat.label === "Completadas" && userTasks.length > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <TrendingUp size={10} />
                      {completionRate}%
                    </span>
                  )}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight tabular-nums">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Listas personales */}
        {(!isListsSection || activeTab === "personal") && (
          <section>
            {!isListsSection && (
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FolderOpen size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Mis listas
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
            )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

        {/* Listas compartidas */}
        {(!isListsSection || activeTab === "shared") && (
          <section>
            {!isListsSection && (
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Users size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Listas compartidas
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
            )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
        {!isListsSection && allLists.length === 0 && (
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

        {/* Aviso de límite del plan */}
        {!isListsSection && !canCreate && (
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
