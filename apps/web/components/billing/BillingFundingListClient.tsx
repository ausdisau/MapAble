"use client";

import type { BillingFundingSource } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  ndis_plan_managed: "NDIS plan-managed",
  ndis_self_managed: "NDIS self-managed",
  private_card: "Private card",
  organisation_invoice: "Organisation invoice",
  grant: "Grant",
  other: "Other",
};

export function BillingFundingListClient() {
  const [sources, setSources] = useState<BillingFundingSource[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/billing/funding-sources");
    const data = await res.json();
    setSources(data.fundingSources ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Funding sources</h1>
          <p className="text-sm text-muted-foreground">
            How your services may be paid. This is not proof of available NDIS
            budget.
          </p>
        </div>
        <Link
          href="/dashboard/billing/funding/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Add funding source
        </Link>
      </header>

      {loading ? (
        <p aria-busy="true" className="text-muted-foreground">
          Loading funding sources…
        </p>
      ) : sources.length === 0 ? (
        <p role="status">You have no funding sources yet.</p>
      ) : (
        <ul className="space-y-3">
          {sources.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/billing/funding/${s.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="font-medium">{s.label}</p>
                <p className="text-sm text-muted-foreground">
                  {TYPE_LABELS[s.type] ?? s.type}
                  {s.isDefault ? " · Default" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
