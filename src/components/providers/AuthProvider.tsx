"use client";

import { useEffect } from "react";
import { initAuthListener } from "@/stores/authStore";
import { isDevPreview, seedDevPreview } from "@/lib/devPreview";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (isDevPreview()) {
      seedDevPreview();
      return;
    }
    initAuthListener();
  }, []);

  return <>{children}</>;
}
