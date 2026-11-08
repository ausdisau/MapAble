"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CalendarReadPanel } from "@/components/day/CalendarReadPanel";
import { DayContextPanel } from "@/components/day/DayContextPanel";

import {
  assessDayPlan,
  recoveryProposalsFor,
  type DayActivity,
  type DayReadiness,
} from "@/lib/day/day-planner";
import {
  makeSyntheticDayPlan,
  MAPABLE_DAY_SCENARIOS,
  type MapAbleDayScenarioId,
} from "@/lib/day/synthetic-fixtures";

const LABELS: Record<DayReadiness, string> = {
  ready: "Ready in this example",
  review: "Needs review",
  blocked: "Blocked — human review",
};

const BADGE_STYLES: Record<DayReadiness, string> = {
  ready: "border-emerald-700/30 bg-emerald-50 text-emerald-950",
  review: "border-amber-700/30 bg-amber-50 text-amber-950",
  blocked: "border-rose-700/30 bg-rose-50 text-rose-950",
};

const TYPE_LABELS: Record<DayActivity["kind"], string> = {
  care: "Care and support",
  transport: "Transport",
  appointment: "Appointment",
  participation: "Participation",
  personal: "Personal time",
};

export function MapAbleDayPreview({
  calendarReadEnabled = false,
}: {
  calendarReadEnabled?: boolean;
}) {
  const [scenarioId, setScenarioId] = useState<MapAbleDayScenarioId>("baseline");
  const [selectedActivityId, setSelectedActivityId] = useState("morning-care");
  const [preferredProposalId, setPreferredProposalId] = useState<string | null>(null);

  const plan = useMemo(() => makeSyntheticDayPlan(scenarioId), [scenarioId]);
  const assessment = useMemo(() => assessDayPlan(plan), [plan]);
  const selected = plan.activities.find((item) => item.id === selectedActivityId);
  const selectedAssessment = assessment.activities.find(
    (item) => item.activityId === selectedActivityId,
  );
  const proposals = selected ? recoveryProposalsFor(selected) : [];
  const affectedNames = selectedAssessment
    ? selectedAssessment.affectedBy.map((id) => {
        const found = plan.activities.find((item) => item.id === id);
        return found ? found.title : "An unavailable activity";
      })
    : [];

  function selectScenario(value: string) {
    const valid = MAPABLE_DAY_SCENARIOS.some((item) => item.id === value);
    if (!valid) return;
    setScenarioId(value as MapAbleDayScenarioId);
    setSelectedActivityId("morning-care");
    setPreferredProposalId(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="space-y-3">
        <div className="inline-flex rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-950">
          Synthetic scenario — no live support or booking information in the example
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          MapAble Day
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          Plan your day around what matters to you, with practical visibility
          of care, transport and appointments. You decide what changes.
        </p>
        <p className="text-sm text-muted-foreground">
          This demonstration shows an invented weekday in Sydney time. All
          names, confirmations and records are examples, not live verification.
        </p>
      </header>

      <section
        aria-labelledby="day-scenario-heading"
        className="rounded-2xl border bg-card p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="day-scenario-heading" className="font-heading text-xl font-bold">
              Explore a day
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Change the example situation to see which plans become uncertain
              and what requires your decision.
            </p>
          </div>
          <div className="min-w-56">
            <label htmlFor="mapable-day-scenario" className="block text-sm font-semibold">
              Example situation
            </label>
            <select
              id="mapable-day-scenario"
              className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              value={scenarioId}
              onChange={(event) => selectScenario(event.currentTarget.value)}
            >
              {MAPABLE_DAY_SCENARIOS.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-4 text-sm" role="status" aria-live="polite">
          {plan.description}
        </p>
      </section>

      <DayContextPanel />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryStat value={assessment.readyCount} label="Ready in example" />
        <SummaryStat value={assessment.reviewCount} label="Need a check" />
        <SummaryStat value={assessment.blockedCount} label="Blocked" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <section aria-labelledby="day-timeline-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="day-timeline-heading" className="font-heading text-xl font-bold">
              Your example day
            </h2>
            <p className="text-sm text-muted-foreground">
              Times illustrative · 24-hour clock
            </p>
          </div>

          <ol className="space-y-3" aria-label="Scheduled example activities">
            {plan.activities.map((activity) => {
              const finding = assessment.activities.find(
                (item) => item.activityId === activity.id,
              );
              const readiness = finding?.readiness ?? "review";
              const isSelected = selectedActivityId === activity.id;
              return (
                <li
                  key={activity.id}
                  className={
                    "rounded-2xl border bg-card p-4 " +
                    (isSelected ? "border-primary ring-2 ring-primary/30" : "")
                  }
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="min-w-24">
                      <p className="text-base font-bold tabular-nums">
                        {activity.startTime}
                      </p>
                      <p className="text-sm text-muted-foreground tabular-nums">
                        to {activity.endTime}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {TYPE_LABELS[activity.kind]}
                      </p>
                      <h3 className="text-lg font-bold">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground">{activity.detail}</p>
                      <span
                        className={
                          "inline-block rounded-md border px-2 py-1 text-sm font-semibold " +
                          BADGE_STYLES[readiness]
                        }
                      >
                        {LABELS[readiness]}
                      </span>
                      {finding && finding.reasons.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-5 text-sm">
                          {finding.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedActivityId(activity.id);
                          setPreferredProposalId(null);
                        }}
                      >
                        Review this activity
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-5" aria-label="Participant decision and support controls">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-heading text-xl font-bold">Your choice</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You are the decision-maker. A worker, coordinator, AI or family
              member cannot silently accept a replacement or change your day.
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold">Communication preference</dt>
                <dd>{plan.communication.preferredMode}</dd>
              </div>
              <div>
                <dt className="font-semibold">Worker acknowledgement</dt>
                <dd>
                  {plan.communication.workerAcknowledged
                    ? "Acknowledged in this example"
                    : "Not confirmed — review required"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Consent and delegation</dt>
                <dd>
                  No sharing or delegation permission is assumed. Every real
                  change needs a separate, authorised workflow.
                </dd>
              </div>
            </dl>
          </section>

          <section
            className="rounded-2xl border bg-card p-5"
            aria-labelledby="day-review-heading"
          >
            <h2 id="day-review-heading" className="font-heading text-xl font-bold">
              Review an activity
            </h2>
            {selected ? (
              <div className="mt-3 space-y-3">
                <h3 className="font-bold">{selected.title}</h3>
                <p className="text-sm">
                  Status: <strong>{LABELS[selectedAssessment?.readiness ?? "review"]}</strong>
                </p>
                {affectedNames.length ? (
                  <p className="text-sm">
                    Depends on: {affectedNames.join(", ")}.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No unresolved preceding dependency is shown for this activity.
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  These are conversation starters, not confirmed alternatives.
                </p>
                <ul className="space-y-3">
                  {proposals.map((proposal) => (
                    <li key={proposal.id} className="rounded-xl border p-3">
                      <p className="font-bold">{proposal.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {proposal.detail}
                      </p>
                      <button
                        type="button"
                        className="mt-3 min-h-11 rounded-lg border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                        onClick={() => setPreferredProposalId(proposal.id)}
                        aria-pressed={preferredProposalId === proposal.id}
                      >
                        {preferredProposalId === proposal.id
                          ? "Preference selected"
                          : "Prefer this discussion option"}
                      </button>
                    </li>
                  ))}
                </ul>
                <p role="status" aria-live="polite" className="text-sm font-medium">
                  {preferredProposalId
                    ? "Preference selected for this preview session only. Nothing was saved, sent, assigned or booked."
                    : "No option selected. Your existing arrangements remain unchanged."}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm">Choose an activity from the day plan.</p>
            )}
          </section>

          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="font-heading text-lg font-bold">
              Use existing MapAble services
            </h2>
            <p className="mt-2 text-sm">
              When these workflows are available to your account, you can
              review care and transport through existing services. This
              preview does not submit anything.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border bg-card px-3 py-2 text-sm font-semibold focus-visible:ring-4 focus-visible:ring-primary/40"
                href="/dashboard/care"
              >
                MapAble Care
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border bg-card px-3 py-2 text-sm font-semibold focus-visible:ring-4 focus-visible:ring-primary/40"
                href="/dashboard/transport"
              >
                Transport trips
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border bg-card px-3 py-2 text-sm font-semibold focus-visible:ring-4 focus-visible:ring-primary/40"
                href="/dashboard/safety"
              >
                Human help and safety
              </Link>
            </div>
          </section>
        </aside>
      </div>
      {calendarReadEnabled ? <CalendarReadPanel /> : null}
    </div>
  );
}

function SummaryStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-3xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
    </div>
  );
}
