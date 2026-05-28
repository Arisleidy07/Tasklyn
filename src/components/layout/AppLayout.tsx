"use client";

import React, { useEffect, useState } from "react";
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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content — offset only after client mount to avoid hydration mismatch */}
      <main
        className="min-h-screen transition-all duration-300 ease-in-out pb-16 md:pb-0"
        style={
          mounted
            ? { marginLeft: sidebarCollapsed ? "72px" : "264px" }
            : undefined
        }
      >
        {children}
      </main>

      {/* Bottom nav — visible only on mobile */}
      <MobileNav />
    </div>
  );
}
