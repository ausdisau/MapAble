"use client";

import { useEffect, useState } from "react";

import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminHighRiskList } from "@/components/admin/back-of-house/AdminHighRiskList";
import { AdminOpsShell } from "@/components/admin/back-of-house/AdminOpsShell";
import type { CommandCentreResponse } from "@/server/admin/adminSchemas";

export function AdminDashboard() {
  const [data, setData] = useState<CommandCentreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/command-centre");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed (${res.status})`);
        }
        const json = (await res.json()) as CommandCentreResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load command centre");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const m = data?.metrics;

  return (
    <AdminOpsShell
      title="Operations command centre"
      description="High-risk queues and operational metrics across participants, bookings, safeguarding, billing, and AI-assisted workflows."
    >
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-muted-foreground">Loading command centre…</p>
      ) : m ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminMetricCard
              title="Pending participant confirmations"
              value={m.pendingParticipantConfirmations}
              href="/admin/ops/participants"
              description="Draft requests, shift approvals, transformer reviews"
            />
            <AdminMetricCard
              title="Bookings at risk"
              value={m.bookingsAtRisk}
              href="/admin/ops/bookings"
            />
            <AdminMetricCard
              title="Worker credential alerts"
              value={m.workerCredentialExpiries}
              href="/admin/ops/workers"
            />
            <AdminMetricCard
              title="Billing exceptions"
              value={m.billingExceptions}
              href="/admin/ops/billing"
            />
            <AdminMetricCard
              title="Unresolved complaints"
              value={m.unresolvedComplaints}
              href="/admin/ops/trust-safety"
            />
            <AdminMetricCard
              title="Safeguarding alerts"
              value={m.safeguardingAlerts}
              href="/admin/ops/safeguarding"
            />
            <AdminMetricCard
              title="Guardrail blocks (7d)"
              value={m.guardrailBlocks}
              href="/admin/ops/agent-runs"
            />
            <AdminMetricCard
              title="Agent runs needing review"
              value={m.agentRunsNeedingReview}
              href="/admin/ops/agent-runs"
            />
          </div>
          <section className="mt-8">
            <h2 className="text-lg font-semibold">High-risk queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prioritised items requiring human review. Severity is also described in text for
              screen readers.
            </p>
            <div className="mt-4">
              <AdminHighRiskList items={data?.highRiskItems ?? []} />
            </div>
          </section>
        </>
      ) : null}
    </AdminOpsShell>
  );
}
