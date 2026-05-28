"use client";

import React from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useUIStore } from "@/stores/uiStore";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content — responds to sidebar width on desktop */}
      <main
        className="min-h-screen transition-all duration-300 ease-in-out pb-16 md:pb-0"
        style={{
          marginLeft: `var(--sidebar-offset, 0px)`,
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            :root { --sidebar-offset: ${sidebarCollapsed ? "72px" : "264px"}; }
          }
          @media (max-width: 767px) {
            :root { --sidebar-offset: 0px; }
          }
        `}</style>
        {children}
      </main>

      {/* Bottom nav — visible only on mobile */}
      <MobileNav />
    </div>
  );
}
