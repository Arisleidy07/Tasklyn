"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUIStore } from "@/stores/uiStore";
import AppLayout from "@/components/layout/AppLayout";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, user } = useAuthStore();
  const { subscribeToLists, unsubscribeFromLists } = useListStore();
  const { subscribe: subscribeNotifs, unsubscribe: unsubscribeNotifs } =
    useNotificationStore();
  const { theme } = useUIStore();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isAuthReady, router]);

  // Subscribe to lists when user is authenticated
  useEffect(() => {
    if (user?.id) {
      subscribeToLists(user.id);
      return () => {
        unsubscribeFromLists();
      };
    }
  }, [user?.id, subscribeToLists, unsubscribeFromLists]);

  // Subscribe to notifications
  useEffect(() => {
    if (user?.id) {
      subscribeNotifs(user.id);
      return () => {
        unsubscribeNotifs();
      };
    }
  }, [user?.id, subscribeNotifs, unsubscribeNotifs]);

  if (!isAuthReady || !isAuthenticated) {
    return (
      <div
        className={
          theme === "dark"
            ? "min-h-screen flex items-center justify-center bg-slate-950 text-slate-50"
            : "min-h-screen flex items-center justify-center bg-gray-50 text-gray-900"
        }
      >
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
