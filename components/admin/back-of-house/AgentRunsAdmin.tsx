"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AdminOpsShell } from "@/components/admin/back-of-house/AdminOpsShell";
import { AiRecommendationPanel } from "@/components/admin/back-of-house/AiRecommendationPanel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type Row = {
  id: string;
  kind: string;
  title: string;
  status: string;
  needsReview: boolean;
  plainLanguageReason?: string;
  technicalDetail?: string;
  aiGenerated: boolean;
  href?: string;
};

export function AgentRunsAdmin() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [atRiskOnly, setAtRiskOnly] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (atRiskOnly) params.set("atRiskOnly", "true");
    const res = await fetch(`/api/admin/agent-runs?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, [atRiskOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminOpsShell
      title="Agent runs"
      description="Care transformer audits, AI match runs, fairness checks, and pending match decisions."
      breadcrumb={[
        { label: "Operations", href: "/admin/ops" },
        { label: "Agent runs", href: "/admin/ops/agent-runs" },
      ]}
      filters={
        <>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={atRiskOnly}
              onChange={(e) => setAtRiskOnly(e.target.checked)}
              className="h-4 w-4"
            />
            Needs review only
          </label>
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => void load()}
          >
            Refresh
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          No agent runs in this filter.
        </p>
      ) : (
        <ul className="space-y-6">
          {items.map((row) => (
            <li key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{row.title}</p>
                  <p className="text-sm text-muted-foreground">{row.kind}</p>
                </div>
                <StatusBadge status={row.status} />
              </div>
              {row.aiGenerated && row.plainLanguageReason ? (
                <div className="mt-4">
                  <AiRecommendationPanel
                    plainLanguage={row.plainLanguageReason}
                    technicalDetail={row.technicalDetail}
                  />
                </div>
              ) : row.plainLanguageReason ? (
                <p className="mt-3 text-sm">{row.plainLanguageReason}</p>
              ) : null}
              {row.href ? (
                <Link
                  href={row.href}
                  className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Open detail
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AdminOpsShell>
  );
}
