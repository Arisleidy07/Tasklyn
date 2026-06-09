"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import MobileNav from "./MobileNav";
import ToastOverlay from "@/components/ui/ToastOverlay";
import { useNotificationEngine } from "@/hooks/useNotificationEngine";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  useNotificationEngine();
  const { sidebarCollapsed, theme } = useUIStore();
  const { user } = useAuthStore();
  const { ensurePersonalTeam } = useTeamStore();
  const [mounted] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (user?.id) {
      ensurePersonalTeam(user.id).catch(() => {});
    }
  }, [user?.id]);

  return (
    <div
      className={cn(
        "min-h-screen relative overflow-x-hidden",
        theme === "dark" && "app-theme-dark bg-slate-950 text-slate-50",
        theme === "light" && "app-theme-light bg-gray-50 text-gray-900",
      )}
    >
      {/* Premium animated background — only shown in dark theme */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-0 overflow-hidden",
          theme === "light" && "opacity-0",
        )}
        aria-hidden
      >
        {/* Primary large glow orbs */}
        <div className="animate-glow-drift absolute top-[5%] right-[3%] w-[520px] h-[520px] rounded-full bg-blue-500/[0.07] blur-[80px]" />
        <div className="animate-glow-drift-2 absolute bottom-[10%] left-[5%] w-[440px] h-[440px] rounded-full bg-indigo-500/[0.06] blur-[72px]" />
        <div className="animate-glow-drift-3 absolute top-[45%] left-[35%] w-[360px] h-[360px] rounded-full bg-blue-400/[0.05] blur-[64px]" />
        {/* Accent smaller orbs */}
        <div className="animate-glow-drift absolute bottom-[35%] right-[20%] w-48 h-48 rounded-full bg-violet-400/[0.06] blur-3xl" />
        <div className="animate-glow-drift-2 absolute top-[30%] right-[40%] w-32 h-32 rounded-full bg-blue-300/[0.08] blur-2xl" />
        {/* Floating particles */}
        <div className="animate-float-slow absolute top-[22%] left-[14%] w-2.5 h-2.5 rounded-full bg-blue-400/30" />
        <div className="animate-float-slow-reverse absolute top-[38%] right-[16%] w-2 h-2 rounded-full bg-indigo-500/25" />
        <div className="animate-float-gentle absolute bottom-[28%] right-[28%] w-2 h-2 rounded-full bg-blue-300/35" />
        <div className="animate-float-slow absolute bottom-[20%] left-[30%] w-1.5 h-1.5 rounded-full bg-violet-400/25" />
        <div className="animate-float-gentle absolute top-[60%] left-[8%] w-2 h-2 rounded-full bg-blue-500/20" />
        {/* Subtle mesh grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar />

      {/* Main content */}
      <main
        className={cn(
          "relative z-10 min-h-screen transition-[margin-left] duration-300 ease-in-out pb-20 md:pb-0",
          mounted
            ? sidebarCollapsed
              ? "md:ml-[72px]"
              : "md:ml-[264px]"
            : "md:ml-[264px]",
        )}
      >
        <motion.div
          key="page"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom nav — visible only on mobile */}
      <MobileNav />

      {/* In-app toast notifications */}
      <ToastOverlay />
    </div>
  );
}
