// ============================================
// TASKLYN — Invoice History (profile section)
// ============================================
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Loader2, Receipt, AlertCircle } from "lucide-react";
import type { Invoice } from "@/types/payment";

const statusLabel: Record<Invoice["status"], string> = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const statusColor: Record<Invoice["status"], string> = {
  pending: "#b45309",
  paid: "#059669",
  failed: "#b91c1c",
  cancelled: "#64748b",
  refunded: "#2563eb",
};

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }
        const token = await user.getIdToken();
        const res = await fetch("/api/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch invoices");

        const data = (await res.json()) as { invoices: Invoice[] };
        setInvoices(data.invoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }

    void fetchInvoices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-red-500">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <p
        className="text-sm text-center py-4"
        style={{ color: "var(--text-tertiary)" }}
      >
        No tienes facturas todavía.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="p-3 rounded-xl flex items-center justify-between gap-3"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(37,99,235,0.08)" }}
            >
              <Receipt size={14} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {invoice.invoiceNumber}
              </p>
              <p
                className="text-[10px] truncate"
                style={{ color: "var(--text-tertiary)" }}
              >
                {invoice.description}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              ${invoice.amount.toFixed(2)} {invoice.currency}
            </p>
            <p className="text-[10px]" style={{ color: statusColor[invoice.status] }}>
              {statusLabel[invoice.status]}
            </p>
            {invoice.paypalOrderId && (
              <p className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                PP: ...{invoice.paypalOrderId.slice(-6)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
