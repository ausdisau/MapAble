"use client";

import type { BillingFundingSource, BillingInvoice } from "@prisma/client";
import { format } from "date-fns";

import { BillingStatusBadge } from "@/components/billing/BillingStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

type InvoiceWithFunding = BillingInvoice & {
  fundingSource: BillingFundingSource | null;
};

function formatAud(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function BillingInvoiceCard({
  invoice,
  onPay,
  onPlanManager,
  onDownload,
  onStatus,
  busy,
}: {
  invoice: InvoiceWithFunding;
  onPay: () => void;
  onPlanManager: () => void;
  onDownload: () => void;
  onStatus: () => void;
  busy?: boolean;
}) {
  const planManaged = invoice.fundingSource?.type === "ndis_plan_managed";
  const canPay =
    !planManaged &&
    ["draft", "issued", "pending_payment", "failed"].includes(invoice.status);

  return (
    <Card
      variant="gradient"
      className="h-full"
      aria-labelledby={`invoice-title-${invoice.id}`}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-2">
          <BillingStatusBadge status={invoice.status} />
          <h2
            id={`invoice-title-${invoice.id}`}
            className="font-heading text-lg font-semibold capitalize tracking-tight"
          >
            {invoice.serviceType} invoice
          </h2>
        </div>
        <p
          className="font-heading text-2xl font-bold text-primary"
          aria-label={`Total ${formatAud(invoice.totalCents)}`}
        >
          {formatAud(invoice.totalCents)}
        </p>
      </CardHeader>

      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-muted-foreground">Funding</dt>
            <dd className="mt-0.5">{invoice.fundingSource?.label ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Due</dt>
            <dd className="mt-0.5">
              {invoice.dueAt
                ? format(new Date(invoice.dueAt), "d MMM yyyy")
                : "—"}
            </dd>
          </div>
        </dl>
      </CardContent>

      <CardFooter
        className="flex flex-wrap gap-3"
        role="group"
        aria-label={`Actions for ${invoice.serviceType} invoice`}
      >
        {canPay && (
          <Button type="button" variant="default" onClick={onPay} disabled={busy} size="lg">
            Pay now
          </Button>
        )}
        {planManaged && (
          <Button
            type="button"
            variant="outline"
            onClick={onPlanManager}
            disabled={busy}
            size="lg"
          >
            Send to plan manager
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onDownload}
          disabled={busy}
          size="lg"
        >
          Download invoice
        </Button>
        <Button type="button" variant="outline" onClick={onStatus} size="lg">
          View payment status
        </Button>
      </CardFooter>
    </Card>
  );
}
