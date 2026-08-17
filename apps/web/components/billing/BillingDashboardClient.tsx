"use client";

import type { BillingFundingSource, BillingInvoice } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";
import { BillingInvoiceCard } from "@/components/billing/BillingInvoiceCard";
import { Card, CardContent } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type InvoiceRow = BillingInvoice & { fundingSource: BillingFundingSource | null };

export function BillingDashboardClient() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/billing/invoices");
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function payNow(invoiceId: string) {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    if (data.checkout?.instruction) {
      setMessage(data.checkout.instruction);
    } else if (data.error) {
      setMessage(data.error);
    }
    setBusy(false);
  }

  async function planManagerExport(invoiceId: string) {
    setBusy(true);
    const res = await fetch("/api/billing/invoices/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, format: "plan_manager" }),
    });
    const data = await res.json();
    if (data.payload) {
      setMessage(
        `Ready for plan manager (${data.payload.planManager?.email ?? "add email in funding source"}).`
      );
    }
    setBusy(false);
    void load();
  }

  async function downloadCsv(invoiceId: string) {
    setBusy(true);
    const res = await fetch("/api/billing/invoices/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, format: "csv" }),
    });
    const data = await res.json();
    if (data.content) {
      const blob = new Blob([data.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setBusy(false);
    void load();
  }

  function viewStatus(invoice: InvoiceRow) {
    setMessage(
      `Payment status: ${invoice.status.replace(/_/g, " ")}. Paid only when confirmed by Stripe webhook.`
    );
  }

  return (
    <div className="space-y-8">
      <div
        className={cn(mapableSectionCardClass, "p-5 sm:p-6")}
        role="note"
        aria-label="NDIS billing guidance"
      >
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Plan-managed NDIS</span> invoices are
          exported to your plan manager — not charged on card.{" "}
          <span className="font-semibold text-secondary">Self-managed</span> and private pay use
          secure Stripe Checkout.
        </p>
      </div>

      {message && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-sm" role="status" aria-live="polite">
            {message}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p aria-busy="true" className="text-muted-foreground">
          Loading invoices…
        </p>
      ) : invoices.length === 0 ? (
        <Card variant="gradient">
          <CardContent className="p-8 text-center text-muted-foreground">
            No invoices yet. Book a service or ask your provider to issue an invoice.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-6" aria-label="Your invoices">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <BillingInvoiceCard
                invoice={inv}
                busy={busy}
                onPay={() => void payNow(inv.id)}
                onPlanManager={() => void planManagerExport(inv.id)}
                onDownload={() => void downloadCsv(inv.id)}
                onStatus={() => viewStatus(inv)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
