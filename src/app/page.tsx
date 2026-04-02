"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Logo from "@/components/shared/Logo";
import Button from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Zap, ListTodo, Users, Shield, Share2 } from "lucide-react";

const features = [
  {
    icon: ListTodo,
    title: "Organized Lists",
    desc: "Create personal and shared task lists with ease.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    desc: "Invite members and collaborate in real time.",
  },
  {
    icon: Shield,
    title: "Role Permissions",
    desc: "Owner, editor, and viewer roles for full control.",
  },
  {
    icon: Share2,
    title: "Share via Link",
    desc: "Generate unique invite links to share lists.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleLogin = () => {
    login();
    // The useEffect above will redirect once isAuthenticated flips
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-violet-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-violet-950/20 flex flex-col">
      {/* Nav */}
      <header className="w-full border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <Button onClick={handleLogin} isLoading={isLoading} size="sm">
            Sign in
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-medium mb-6">
            <Zap size={12} />
            Professional task management for teams
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1]">
            Manage tasks.{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Ship faster.
            </span>
          </h1>

          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Create shared lists, assign tasks, control permissions, and track
            who completes every action. Built for teams that move fast.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleLogin}
              isLoading={isLoading}
              size="lg"
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              }
            >
              Continue with Google
            </Button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto w-full"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm hover:border-violet-200 dark:hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3">
                <f.icon size={18} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {f.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-800/50 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-zinc-400">
          <span>
            &copy; {new Date().getFullYear()} TASKLYN. All rights reserved.
          </span>
          <span>Built for production</span>
        </div>
      </footer>
    </div>
  );
}
