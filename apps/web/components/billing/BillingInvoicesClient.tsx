"use client";

import type { BillingFundingSource, BillingInvoice } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";
import { BillingInvoiceCard } from "@/components/billing/BillingInvoiceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mapableSectionCardClass } from "@/lib/brand/styles";

type InvoiceRow = BillingInvoice & { fundingSource: BillingFundingSource | null };

export function BillingInvoicesClient() {
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setMessage(
        "Payment submitted. Your invoice will show as paid once Stripe confirms the payment."
      );
    } else if (params.get("checkout") === "cancelled") {
      setMessage("Checkout was cancelled. You can try again when ready.");
    }
  }, []);

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

  async function openCustomerPortal() {
    setBusy(true);
    const res = await fetch("/api/billing/customer-portal", { method: "POST" });
    const data = await res.json();
    if (data.portalUrl) {
      window.location.href = data.portalUrl;
      return;
    }
    setMessage(data.error ?? "Billing portal is not available for your account.");
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Invoices & payments</h1>
          <p className="text-sm text-muted-foreground">
            Stripe Checkout for self-managed and private pay. Plan-managed exports
            for your plan manager.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={busy}
          onClick={() => void openCustomerPortal()}
        >
          Manage payment methods
        </Button>
      </header>

      <div
        className={cn(mapableSectionCardClass, "p-5 sm:p-6")}
        role="note"
        aria-label="NDIS billing guidance"
      >
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Plan-managed NDIS</span>{" "}
          invoices are exported to your plan manager — not charged on card.{" "}
          <span className="font-semibold text-secondary">Self-managed</span> and
          private pay use secure Stripe Checkout.
        </p>
      </div>

      {message ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-sm" role="status" aria-live="polite">
            {message}
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <p aria-busy="true" className="text-muted-foreground">
          Loading invoices…
        </p>
      ) : invoices.length === 0 ? (
        <Card variant="gradient">
          <CardContent className="p-8 text-center text-muted-foreground">
            No invoices yet. Book a service or ask your provider to issue an
            invoice.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-6" aria-label="Your invoices">
          {invoices.map((inv) => (
            <li key={inv.id} className="space-y-2">
              <BillingInvoiceCard
                invoice={inv}
                busy={busy}
                onPay={() => void payNow(inv.id)}
                onPlanManager={() => void planManagerExport(inv.id)}
                onDownload={() => void downloadCsv(inv.id)}
                onStatus={() => viewStatus(inv)}
              />
              <Link
                href={`/dashboard/billing/invoices/${inv.id}`}
                className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                View full invoice details →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
