"use client";

import { useState, useEffect, useRef } from "react";
import { getUser } from "@/lib/firestore";

export interface UserProfile {
  name: string;
  photoURL?: string;
  email?: string;
}

// Module-level cache — survives re-renders, cleared on page refresh
const profileCache = new Map<string, UserProfile>();

export function useUserProfiles(uids: string[]) {
  const fetchingRef = useRef(new Set<string>());

  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(() => {
    const initial = new Map<string, UserProfile>();
    uids.forEach((uid) => {
      if (uid && profileCache.has(uid))
        initial.set(uid, profileCache.get(uid)!);
    });
    return initial;
  });

  const uidKey = [...new Set(uids.filter(Boolean))].sort().join(",");

  useEffect(() => {
    if (!uidKey) return;
    const unique = uidKey.split(",");
    const missing = unique.filter(
      (uid) => !profileCache.has(uid) && !fetchingRef.current.has(uid),
    );

    // Seed from cache for UIDs already resolved
    const fromCache = new Map<string, UserProfile>();
    unique.forEach((uid) => {
      if (profileCache.has(uid)) fromCache.set(uid, profileCache.get(uid)!);
    });
    if (fromCache.size > 0) {
      setProfiles((prev) => {
        const merged = new Map(prev);
        fromCache.forEach((v, k) => merged.set(k, v));
        return merged;
      });
    }

    if (missing.length === 0) return;
    missing.forEach((uid) => fetchingRef.current.add(uid));

    Promise.all(
      missing.map((uid) =>
        getUser(uid)
          .then((u) => ({
            uid,
            profile: u
              ? {
                  name: u.name || "Usuario",
                  photoURL: u.photoURL || undefined,
                  email: u.email,
                }
              : { name: "Usuario" },
          }))
          .catch((error) => {
            console.error(
              `[useUserProfiles] Failed to fetch user ${uid}:`,
              error,
            );
            return { uid, profile: { name: "Usuario" } };
          }),
      ),
    ).then((results) => {
      const updated = new Map<string, UserProfile>();
      results.forEach(({ uid, profile }) => {
        profileCache.set(uid, profile);
        updated.set(uid, profile);
      });
      setProfiles((prev) => {
        const merged = new Map(prev);
        updated.forEach((v, k) => merged.set(k, v));
        return merged;
      });
    });
  }, [uidKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const getProfile = (uid: string): UserProfile =>
    profiles.get(uid) ?? profileCache.get(uid) ?? { name: "Cargando..." };

  return { profiles, getProfile };
}
