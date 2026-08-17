"use client";

import { useCallback, useState } from "react";

import { cn } from "@/app/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapableEyebrowBadgeClass, mapableSectionCardClass } from "@/lib/brand/styles";

type ClaimRow = {
  id: string;
  status: string;
  legacyInvoiceId: string | null;
  billingInvoiceId: string | null;
  externalClaimId: string | null;
  createdAt: string;
};

export function ProviderNdiaClaimsClient({
  organisationId,
}: {
  organisationId: string;
}) {
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [useBilling, setUseBilling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/provider/ndia-claims?organisationId=${organisationId}`
    );
    const data = await res.json();
    setClaims(data.claims ?? []);
  }, [organisationId]);

  async function createDraft() {
    if (!invoiceId.trim()) return;
    setBusy(true);
    setMessage(null);
    const body = useBilling
      ? { organisationId, billingInvoiceId: invoiceId.trim() }
      : { organisationId, legacyInvoiceId: invoiceId.trim() };
    const res = await fetch("/api/provider/ndia-claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) setMessage(data.error);
    else {
      setMessage(
        `Draft claim ${data.claim?.id?.slice(0, 8)}… — ${data.findings?.length ?? 0} findings (${data.adapterMode} adapter)`
      );
      void load();
    }
    setBusy(false);
  }

  async function runAction(claimId: string, action: "validate" | "dry-run" | "submit") {
    setBusy(true);
    const res = await fetch(`/api/provider/ndia-claims/${claimId}/${action}`, {
      method: "POST",
    });
    const data = await res.json();
    setMessage(data.message ?? data.disclaimer ?? data.error ?? `${action} complete`);
    void load();
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className={cn(mapableSectionCardClass, "p-5")}>
        <p className="text-sm text-muted-foreground">
          Registered provider claiming for <strong>agency-managed</strong> NDIS
          participants. Plan-managed invoices must go to the plan manager, not this
          pathway. Enable <code className="text-xs">NDIS_CLAIM_SUBMISSION_ENABLED</code>{" "}
          in your environment.
        </p>
      </div>

      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="font-heading text-lg">New claim draft</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useBilling}
              onChange={(e) => setUseBilling(e.target.checked)}
            />
            Billing invoice (Core) instead of legacy invoice
          </label>
          <div>
            <label htmlFor="invoice-id" className="text-sm font-medium">
              Invoice ID
            </label>
            <input
              id="invoice-id"
              className="mt-1 min-h-11 w-full rounded-lg border border-input px-3"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={busy}
            onClick={() => void createDraft()}
          >
            Build claim draft
          </Button>
        </CardContent>
      </Card>

      {message && (
        <p role="status" aria-live="polite" className="rounded-lg bg-muted/50 p-4 text-sm">
          {message}
        </p>
      )}

      <section aria-labelledby="claims-list-heading">
        <h2 id="claims-list-heading" className="font-heading text-lg font-semibold">
          Claims
        </h2>
        <ul className="mt-4 space-y-3">
          {claims.map((c) => (
            <li key={c.id} className={cn(mapableSectionCardClass, "p-4")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs">{c.id.slice(0, 12)}…</span>
                <Badge variant="outline" className={mapableEyebrowBadgeClass}>
                  {c.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void runAction(c.id, "validate")}
                >
                  Validate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void runAction(c.id, "dry-run")}
                >
                  Dry run
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={busy}
                  onClick={() => void runAction(c.id, "submit")}
                >
                  Submit
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
