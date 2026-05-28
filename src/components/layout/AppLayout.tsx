"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useUIStore } from "@/stores/uiStore";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
      {/* Premium ambient background — subtle floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="animate-glow-drift absolute top-[5%] left-[20%] w-[480px] h-[480px] rounded-full bg-blue-500/5 blur-3xl" />
        <div className="animate-glow-drift-2 absolute top-[40%] right-[5%] w-[360px] h-[360px] rounded-full bg-blue-400/5 blur-3xl" />
        <div className="animate-glow-drift-3 absolute bottom-[10%] left-[40%] w-[300px] h-[300px] rounded-full bg-blue-600/4 blur-3xl" />
      </div>

      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        className="relative z-10 min-h-screen transition-all duration-300 ease-in-out pb-16 md:pb-0"
        style={
          mounted
            ? { marginLeft: sidebarCollapsed ? "72px" : "264px" }
            : undefined
        }
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
    </div>
  );
}
