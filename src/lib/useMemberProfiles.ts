"use client";

import { useState, useEffect } from "react";
import { subscribeToUser } from "@/lib/firestore";
import type { User } from "@/types";

export function useMemberProfiles(userIds: string[]): Record<string, User> {
  const [profiles, setProfiles] = useState<Record<string, User>>({});

  const key = userIds.slice().sort().join(",");

  useEffect(() => {
    if (!userIds.length) return;

    const unsubscribes = userIds.map((userId) =>
      subscribeToUser(userId, (user) => {
        if (user) {
          setProfiles((prev) => ({ ...prev, [userId]: user }));
        }
      }),
    );

    return () => unsubscribes.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return profiles;
}
