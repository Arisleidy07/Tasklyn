"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useListStore } from "@/stores/listStore";
import { useTeamStore } from "@/stores/teamStore";
import { useTaskStore } from "@/stores/taskStore";
import AppLayout from "@/components/layout/AppLayout";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, user } = useAuthStore();
  const { lists, subscribeToLists, unsubscribeFromLists } = useListStore();
  const { subscribeToList, unsubscribeFromList, unsubscribeAll } =
    useTaskStore();
  const { subscribeToTeams, unsubscribeFromTeams } = useTeamStore();

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

  useEffect(() => {
    const activeIds = new Set(lists.map((list) => list.id));
    lists.forEach((list) => subscribeToList(list.id));
    useTaskStore.getState().taskUnsubscribes.forEach((_unsubscribe, listId) => {
      if (!activeIds.has(listId)) unsubscribeFromList(listId);
    });
  }, [lists, subscribeToList, unsubscribeFromList]);

  useEffect(() => () => unsubscribeAll(), [unsubscribeAll]);

  // Subscribe to teams when user is authenticated
  useEffect(() => {
    if (user?.id) {
      subscribeToTeams(user.id);
      return () => {
        unsubscribeFromTeams();
      };
    }
  }, [user?.id, subscribeToTeams, unsubscribeFromTeams]);

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
