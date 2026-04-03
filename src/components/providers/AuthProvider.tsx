"use client";

import { useEffect } from "react";
import { initAuthListener } from "@/stores/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAuthListener();
  }, []);

  return <>{children}</>;
}
