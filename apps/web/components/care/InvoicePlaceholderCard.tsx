"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function InvoicePlaceholderCard({ careBookingId }: { careBookingId: string }) {
  const [link, setLink] = useState<{
    externalInvoiceRef?: string;
    pricingPlaceholder?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="rounded-xl border p-4" aria-labelledby="inv-heading">
      <h2 id="inv-heading" className="font-semibold">
        Invoice (placeholder)
      </h2>
      <p className="text-sm text-muted-foreground">
        Pricing is a placeholder until NDIS Pricing Intelligence is connected. Not NDIS
        funding approval.
      </p>
      {link ? (
        <p className="mt-2 text-sm">
          Reference: {link.externalInvoiceRef} — {link.pricingPlaceholder}
        </p>
      ) : (
        <Button
          type="button"
          className="mt-3"
          variant="outline"
          size="default"
          onClick={async () => {
            setError(null);
            const res = await fetch(
              `/api/care/bookings/${careBookingId}/invoice-placeholder`,
              { method: "POST" }
            );
            const d = await res.json();
            if (!res.ok) {
              setError(d.error ?? "Cannot generate");
              return;
            }
            setLink(d.invoiceLink);
          }}
        >
          Generate invoice placeholder
        </Button>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
