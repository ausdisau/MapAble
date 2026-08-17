"use client";

import { useCallback, useState } from "react";

import { cn } from "@/app/lib/utils";
import { BillingStatusBadge } from "@/components/billing/BillingStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type AdminInvoice = {
  id: string;
  userId: string;
  providerId: string | null;
  status: string;
  totalCents: number;
  serviceType: string;
  createdAt: string;
  payments: { status: string }[];
};

export function AdminBillingClient() {
  const [status, setStatus] = useState("");
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [flagged, setFlagged] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/billing/invoices?${params}`);
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    setFlagged(data.flagged ?? []);
    setLoading(false);
  }, [status]);

  return (
    <div className="space-y-8">
      <Card variant="gradient">
        <CardContent className="flex flex-wrap items-end gap-4 p-6">
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="status-filter" className="block text-sm font-medium">
              Status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3 shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All</option>
              <option value="failed">Failed</option>
              <option value="pending_payment">Pending payment</option>
              <option value="paid">Paid</option>
              <option value="exported">Exported</option>
            </select>
          </div>
          <Button type="button" variant="default" onClick={() => void search()} disabled={loading} size="lg">
            Search invoices
          </Button>
        </CardContent>
      </Card>

      {flagged.length > 0 && (
        <section aria-labelledby="flagged-heading">
          <h2
            id="flagged-heading"
            className="font-heading text-lg font-semibold text-destructive"
          >
            Flagged ({flagged.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {flagged.map((inv) => (
              <li
                key={inv.id}
                className={cn(
                  mapableSectionCardClass,
                  "flex flex-wrap items-center justify-between gap-2 border-destructive/30 p-4 text-sm"
                )}
              >
                <span className="font-mono text-xs">{inv.id.slice(0, 12)}…</span>
                <BillingStatusBadge status={inv.status} />
                <span className="font-semibold text-primary">
                  ${(inv.totalCents / 100).toFixed(2)} AUD
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="results-heading">
        <h2 id="results-heading" className="font-heading text-lg font-semibold">
          Results {loading ? "(loading…)" : `(${invoices.length})`}
        </h2>
        <div className={cn(mapableSectionCardClass, "mt-4 overflow-x-auto")}>
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Billing invoices</caption>
            <thead className="border-b border-border/60 bg-muted/30">
              <tr>
                <th scope="col" className="p-3 font-medium">
                  Invoice
                </th>
                <th scope="col" className="p-3 font-medium">
                  User
                </th>
                <th scope="col" className="p-3 font-medium">
                  Status
                </th>
                <th scope="col" className="p-3 font-medium text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border/40">
                  <td className="p-3 font-mono text-xs">{inv.id.slice(0, 10)}…</td>
                  <td className="p-3">{inv.userId.slice(0, 8)}…</td>
                  <td className="p-3">
                    <BillingStatusBadge status={inv.status} />
                  </td>
                  <td className="p-3 text-right font-medium text-primary">
                    ${(inv.totalCents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
