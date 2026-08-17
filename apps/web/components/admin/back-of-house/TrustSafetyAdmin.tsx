"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AdminOpsShell } from "@/components/admin/back-of-house/AdminOpsShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type Item = {
  id: string;
  source: string;
  status: string;
  escalationLevel: number;
  title: string;
  summary: string | null;
  participantId: string | null;
  incidentId: string | null;
  complaintId: string | null;
};

export function TrustSafetyAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/trust-safety?sync=true");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminOpsShell
      title="Trust & safety queue"
      description="Unified queue for incidents, complaints, disputed logs, and escalation items."
      breadcrumb={[
        { label: "Operations", href: "/admin/ops" },
        { label: "Trust & safety", href: "/admin/ops/trust-safety" },
      ]}
      filters={
        <Button type="button" variant="secondary" size="default" onClick={() => void load()}>
          Sync queue
        </Button>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Loading queue…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No open items.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border/60 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{item.title}</h3>
                <StatusBadge status={item.status} />
                <span className="text-xs text-muted-foreground">
                  {item.source} · level {item.escalationLevel}
                </span>
              </div>
              {item.summary ? (
                <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {item.incidentId ? (
                  <Link
                    href="/admin/ops/safeguarding"
                    className="text-primary hover:underline"
                  >
                    View safeguarding
                  </Link>
                ) : null}
                {item.complaintId ? (
                  <Link
                    href="/admin/engagement"
                    className="text-primary hover:underline"
                  >
                    Engagement hub
                  </Link>
                ) : null}
                <Link
                  href="/admin/audit-events"
                  className="text-primary hover:underline"
                >
                  Audit timeline
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminOpsShell>
  );
}
