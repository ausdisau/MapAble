"use client";

import { useState } from "react";

import type { RehabilitationPlanStatus } from "@prisma/client";

import { PlanStatusBadge } from "@/components/moves/GoalsPanel";

type PlanSummary = {
  id: string;
  title: string;
  status: RehabilitationPlanStatus;
  versions?: { id: string; version: number }[];
};

interface PlanPausePanelProps {
  plans: PlanSummary[];
}

export function PlanPausePanel({ plans }: PlanPausePanelProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activePlans = plans.filter((p) => p.status === "active");

  async function handlePause(planId: string) {
    setSubmitting(planId);
    setMessage(null);
    try {
      const res = await fetch("/api/participant/moves/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause_plan", planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not pause plan");
        return;
      }
      setMessage("Plan paused. Contact your clinician before resuming.");
      window.location.reload();
    } catch {
      setMessage("Network error — please try again");
    } finally {
      setSubmitting(null);
    }
  }

  if (activePlans.length === 0) return null;

  return (
    <section
      aria-labelledby="moves-pause-heading"
      className="rounded-xl border border-dashed p-4"
    >
      <h2 id="moves-pause-heading" className="font-heading text-lg font-semibold">
        Pause your plan
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        You can pause an active plan at any time. Pausing does not change your clinical
        treatment — speak with your clinician before resuming.
      </p>

      {message ? (
        <p className="mt-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {activePlans.map((plan) => (
          <li
            key={plan.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
          >
            <span>
              {plan.title} <PlanStatusBadge status={plan.status} />
            </span>
            <button
              type="button"
              className="rounded-md border px-3 py-1 text-sm"
              disabled={submitting === plan.id}
              onClick={() => handlePause(plan.id)}
            >
              {submitting === plan.id ? "Pausing…" : "Pause plan"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
