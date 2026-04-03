"use client";

import React from "react";
import Sidebar from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-[264px] min-h-screen transition-all duration-300 ease-in-out">
        {children}
      </main>
    </div>
  );
}
