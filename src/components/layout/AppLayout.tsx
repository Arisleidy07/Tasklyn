"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
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
      {/* Premium animated background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div className="animate-glow-drift absolute top-[10%] right-[5%] w-96 h-96 rounded-full bg-blue-500/8 blur-3xl" />
        <div className="animate-glow-drift-2 absolute bottom-[15%] left-[8%] w-80 h-80 rounded-full bg-blue-400/6 blur-3xl" />
        <div className="animate-float-slow absolute top-[25%] left-[12%] w-3 h-3 rounded-full bg-blue-400/25" />
        <div className="animate-float-slow-reverse absolute top-[40%] right-[15%] w-2 h-2 rounded-full bg-blue-500/20" />
        <div className="animate-float-gentle absolute bottom-[30%] right-[25%] w-2 h-2 rounded-full bg-blue-300/30" />
      </div>

      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar />

      {/* Main content */}
      <main
        className="relative z-10 min-h-screen transition-[margin-left] duration-300 ease-in-out pb-16 md:pb-0"
        style={
          mounted
            ? { marginLeft: sidebarCollapsed ? "72px" : "264px" }
            : undefined
        }
      >
        <motion.div
          key="page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom nav — visible only on mobile */}
      <MobileNav />
    </div>
  );
}
