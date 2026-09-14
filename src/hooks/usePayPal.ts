// ============================================
// TASKLYN — PayPal Subscriptions SDK hook
// ============================================
"use client";

import { useEffect, useState } from "react";
import { loadPayPalSdk } from "@/lib/paypal/client";

type UsePayPalReturn =
  | {
      isLoading: true;
      error: null;
      paypal: null;
    }
  | {
      isLoading: false;
      error: Error | null;
      paypal: typeof window.paypal | null;
    };

export function usePayPal(): UsePayPalReturn {
  const [paypal, setPaypal] = useState<typeof window.paypal | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const paypal = await loadPayPalSdk();
        if (!cancelled) {
          setPaypal(paypal);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return { isLoading: true, error: null, paypal: null };
  }

  return { isLoading: false, error, paypal };
}
