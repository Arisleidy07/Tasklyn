"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTeamStore } from "@/stores/teamStore";
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
  const { subscribeToTeams, unsubscribeFromTeams } = useTeamStore();
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

  // Subscribe to teams when user is authenticated
  useEffect(() => {
    if (user?.id) {
      subscribeToTeams(user.id);
      return () => {
        unsubscribeFromTeams();
      };
    }
  }, [user?.id, subscribeToTeams, unsubscribeFromTeams]);

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
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
