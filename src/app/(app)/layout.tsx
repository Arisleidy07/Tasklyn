"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import AppLayout from "@/components/layout/AppLayout";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, user } = useAuthStore();
  const { subscribeToLists, unsubscribeFromLists } = useListStore();

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

  if (!isAuthReady || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
