"use client";

import React from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content — full width on mobile, offset on desktop */}
      <main className="md:ml-[264px] min-h-screen transition-all duration-300 ease-in-out pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — visible only on mobile */}
      <MobileNav />
    </div>
  );
}
