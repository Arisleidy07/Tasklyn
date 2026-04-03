"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Logo from "@/components/shared/Logo";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  ListTodo,
  Users,
  Shield,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, login, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header simple */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <Button onClick={login} isLoading={isLoading} size="sm">
            Iniciar sesión
          </Button>
        </div>
      </header>

      {/* Hero Section - Estilo minimalista */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo grande */}
            <div className="flex justify-center mb-8">
              <Logo size="xl" showText={false} />
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-6">
              Organiza tus tareas.
              <br />
              <span className="text-blue-600">Simplifica tu vida.</span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              TASKLYN te ayuda a gestionar tus proyectos, colaborar con tu
              equipo y completar tu trabajo más rápido.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={login}
                isLoading={isLoading}
                size="lg"
                icon={<ArrowRight size={18} />}
              >
                Comenzar gratis
              </Button>
              <p className="text-sm text-gray-500">
                Gratis para siempre. Sin tarjeta de crédito.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Preview - Mockup simple */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative"
          >
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 shadow-xl">
              <div className="bg-white rounded-xl overflow-hidden">
                {/* Mock UI simple */}
                <div className="flex h-[280px]">
                  <div className="w-56 bg-gray-50 border-r border-gray-100 p-4 hidden sm:block">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">
                        TASKLYN
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                        Dashboard
                      </div>
                      <div className="px-3 py-2 text-gray-500 rounded-lg text-sm">
                        Mis Listas
                      </div>
                      <div className="px-3 py-2 text-gray-500 rounded-lg text-sm">
                        Compartidas
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Mis Tareas
                      </h3>
                      <div className="w-24 h-8 bg-blue-600 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="w-5 h-5 rounded-full border-2 border-blue-500" />
                          <div className="flex-1 h-3 bg-gray-200 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features - Grid simple */}
      <section className="py-20 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ListTodo size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Listas ilimitadas
                </h3>
                <p className="text-gray-600 text-sm">
                  Crea todas las listas que necesites para organizar tu trabajo
                  personal y profesional.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Trabajo en equipo
                </h3>
                <p className="text-gray-600 text-sm">
                  Colabora en tiempo real con tu equipo. Comparte listas y
                  asigna tareas fácilmente.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Control total
                </h3>
                <p className="text-gray-600 text-sm">
                  Define quién puede ver, editar o administrar cada lista con
                  permisos granulares.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Zap size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Rápido y simple
                </h3>
                <p className="text-gray-600 text-sm">
                  Interfaz limpia y rápida. Sin complicaciones. Empieza a
                  trabajar en segundos.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Listo para ser más productivo?
            </h2>
            <p className="text-gray-600 mb-8">
              Únete a miles de personas que usan TASKLYN para organizar su vida.
            </p>
            <Button
              onClick={login}
              isLoading={isLoading}
              size="lg"
              icon={<ArrowRight size={18} />}
            >
              Crear cuenta gratis
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer simple */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} TASKLYN. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
