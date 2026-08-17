"use client";

/* eslint-disable jsx-a11y/label-has-associated-control -- checkbox labels nest control + visible title/description text */

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CareOSNetworkResponse } from "@/intelligence/network/types";
import type { MapAbleModule } from "@/intelligence/types";

const MODULES: Array<{ id: MapAbleModule; label: string; description: string }> = [
  { id: "core", label: "Core", description: "Calendar and mission context" },
  { id: "care", label: "Care", description: "Support coverage and care requests" },
  { id: "transport", label: "Transport", description: "Accessible journeys and transport records" },
  { id: "access", label: "Access", description: "Venue and destination access evidence" },
  { id: "jobs", label: "Jobs", description: "Employment context when relevant" },
  { id: "payments", label: "AbilityPay", description: "Invoice summaries only, never payment approval" },
];

function statusLabel(status: CareOSNetworkResponse["status"]): string {
  if (status === "ready") return "Ready for participant review";
  if (status === "human_review_required") return "Human review required";
  return "More information needed";
}

function alertClass(severity: "information" | "attention" | "urgent"): string {
  if (severity === "urgent") return "border-destructive/50 bg-destructive/10";
  if (severity === "attention") return "border-amber-500/50 bg-amber-500/10";
  return "border-border bg-muted/30";
}

export function CareOSAgenticNetwork() {
  const [goal, setGoal] = useState(
    "Help me coordinate support and accessible transport for my next appointment."
  );
  const [selected, setSelected] = useState<MapAbleModule[]>([
    "core",
    "care",
    "transport",
    "access",
  ]);
  const [includeProfile, setIncludeProfile] = useState(false);
  const [includeContinuity, setIncludeContinuity] = useState(true);
  const [network, setNetwork] = useState<CareOSNetworkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleModule(module: MapAbleModule) {
    setSelected((current) =>
      current.includes(module)
        ? current.filter((item) => item !== module)
        : [...current, module]
    );
  }

  async function prepareNetwork() {
    if (selected.length === 0) {
      setError("Choose at least one MapAble area.");
      return;
    }

    setLoading(true);
    setError(null);
    setNetwork(null);

    try {
      const response = await fetch("/api/intelligence/careos-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          modules: selected,
          includeAccessibilityProfile: includeProfile,
          includeContinuityAnalysis: includeContinuity,
          plainLanguage: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "The CareOS network could not be prepared."
        );
      }
      setNetwork(data as CareOSNetworkResponse);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The CareOS network could not be prepared."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="careos-network-heading" className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          CareOS Coordinate and Confirm
        </p>
        <h2 id="careos-network-heading" className="text-2xl font-bold">
          Turn a life goal into a coordinated support mission
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Choose what CareOS may read for this request. It maps dependencies, prepares
          reviewable drafts and routes uncertainty to people. Nothing is submitted by this screen.
        </p>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-6 pt-6">
          <label htmlFor="careos-goal" className="block space-y-2">
            <span className="font-semibold">What do you want to achieve?</span>
            <textarea
              id="careos-goal"
              rows={3}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <fieldset>
            <legend className="font-semibold">Areas to include</legend>
            <p className="mt-1 text-sm text-muted-foreground">
              Selection authorises read access for this request only.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {MODULES.map((module) => (
                <label
                  key={module.id}
                  className="flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border border-input p-4 focus-within:ring-2 focus-within:ring-ring"
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-5"
                    checked={selected.includes(module.id)}
                    onChange={() => toggleModule(module.id)}
                  />
                  <span>
                    <span className="block font-medium">{module.label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {module.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex min-h-14 items-start gap-3 rounded-lg border border-input p-4">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={includeContinuity}
                onChange={(event) => setIncludeContinuity(event.target.checked)}
              />
              <span>
                <span className="block font-medium">Run Continuity Radar</span>
                <span className="block text-sm text-muted-foreground">
                  Find missing services and dependencies that could interrupt the mission.
                </span>
              </span>
            </label>
            <label className="flex min-h-14 items-start gap-3 rounded-lg border border-input p-4">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={includeProfile}
                onChange={(event) => setIncludeProfile(event.target.checked)}
              />
              <span>
                <span className="block font-medium">Use my accessibility profile</span>
                <span className="block text-sm text-muted-foreground">
                  Off by default and applies to this request only.
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" size="lg" loading={loading} onClick={() => void prepareNetwork()}>
              Build my CareOS mission
            </Button>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-input px-4 py-2 font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Continue without AI
            </Link>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {error}
        </p>
      ) : null}

      {network ? (
        <div className="space-y-8" aria-live="polite" aria-atomic="false">
          <section className="rounded-xl border bg-card p-5" aria-labelledby="mission-status-heading">
            <p className="text-sm font-medium text-muted-foreground">Mission status</p>
            <h3 id="mission-status-heading" className="text-xl font-semibold">
              {statusLabel(network.status)}
            </h3>
            <p className="mt-3">{network.goal}</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
              {network.notices.map((notice) => <li key={notice}>{notice}</li>)}
            </ul>
          </section>

          <section aria-labelledby="mission-graph-heading">
            <h3 id="mission-graph-heading" className="text-xl font-semibold">Mission dependency graph</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {network.mission.nodes.map((node) => (
                <article key={node.id} className="rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-semibold">{node.label}</h4>
                    <span className="rounded-full border px-2 py-1 text-xs font-medium">
                      {node.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{node.details}</p>
                  <p className="mt-3 text-xs text-muted-foreground">Source: {node.sourceModule}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="continuity-heading">
            <h3 id="continuity-heading" className="text-xl font-semibold">Continuity Radar</h3>
            {network.continuityAlerts.length === 0 ? (
              <p className="mt-3 rounded-lg border bg-muted/30 p-4">
                No obvious continuity gap was found. Live availability still needs confirmation.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {network.continuityAlerts.map((alert) => (
                  <article key={alert.id} className={`rounded-xl border p-5 ${alertClass(alert.severity)}`}>
                    <h4 className="font-semibold">{alert.title}</h4>
                    <p className="mt-2 text-sm">{alert.explanation}</p>
                    <ul className="mt-3 list-disc pl-5 text-sm">
                      {alert.recoveryActions.map((action) => <li key={action}>{action}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="proposal-heading">
            <h3 id="proposal-heading" className="text-xl font-semibold">Draft actions for your review</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              These are proposals only. They have payload hashes and expiry times, but no execution token.
            </p>
            <div className="mt-4 space-y-3">
              {network.actionProposals.map((proposal) => (
                <article key={proposal.id} className="rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-semibold">{proposal.title}</h4>
                    <span className="rounded-full border px-2 py-1 text-xs font-medium">Draft</span>
                  </div>
                  <p className="mt-2 text-sm">{proposal.summary}</p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="font-medium">Information to share</dt><dd>{proposal.informationToShare.join(", ")}</dd></div>
                    <div><dt className="font-medium">Expires</dt><dd>{new Date(proposal.expiresAt).toLocaleString("en-AU")}</dd></div>
                  </dl>
                  <p className="mt-3 break-all text-xs text-muted-foreground">Payload hash: {proposal.payloadHash}</p>
                  <Button type="button" variant="outline" size="sm" className="mt-4" disabled>
                    Confirmation flow not enabled
                  </Button>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="human-review-heading">
            <h3 id="human-review-heading" className="text-xl font-semibold">Human review queue</h3>
            {network.humanReviewQueue.length === 0 ? (
              <p className="mt-3 rounded-lg border bg-muted/30 p-4">No human review item was created.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {network.humanReviewQueue.map((item) => (
                  <article key={item.id} className="rounded-xl border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="font-semibold">{item.title}</h4>
                      <span className="rounded-full border px-2 py-1 text-xs font-medium">{item.priority}</span>
                    </div>
                    <p className="mt-2 text-sm">{item.summary}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Routed to {item.assignedRole.replaceAll("_", " ")} by {new Date(item.dueAt).toLocaleString("en-AU")}.
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}
