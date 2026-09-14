// ============================================
// TASKLYN — Load PayPal plan IDs from backend
// ============================================
"use client";

import { useEffect, useState } from "react";

export function usePayPalPlans() {
  const [plans, setPlans] = useState<{
    pro: string;
    business: string;
    productId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/paypal/plans");
        if (!res.ok) throw new Error("Failed to load PayPal plans");
        const data = (await res.json()) as {
          pro: string;
          business: string;
          productId: string;
        };
        if (!cancelled) setPlans(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, error, loading };
}
