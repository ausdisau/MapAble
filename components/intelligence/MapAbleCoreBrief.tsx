"use client";

/* eslint-disable jsx-a11y/label-has-associated-control -- checkbox labels nest control + visible title/description text */

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PlatformBrief, PlatformModuleBrief } from "@/intelligence/core-types";
import type { MapAbleModule } from "@/intelligence/types";

const MODULES: Array<{ id: MapAbleModule; label: string; description: string }> = [
  { id: "core", label: "Core", description: "Upcoming appointments and shared platform context" },
  { id: "care", label: "Care", description: "Recent care and support requests" },
  { id: "transport", label: "Transport", description: "Trips, requests and accessible journey status" },
  { id: "jobs", label: "Jobs", description: "Published inclusive employment opportunities" },
  { id: "access", label: "Access", description: "Published accessibility place evidence" },
  { id: "moves", label: "Moves", description: "Rehabilitation coordination when enabled" },
  { id: "foods", label: "Foods", description: "Accessible food coordination when enabled" },
  { id: "payments", label: "AbilityPay", description: "Your invoice summaries, never payment approval" },
];

function statusLabel(status: PlatformModuleBrief["status"]): string {
  switch (status) {
    case "available":
      return "Available";
    case "disabled":
      return "Disabled by platform settings";
    case "not_authorised":
      return "Not authorised for this account";
    case "consent_required":
      return "Permission not granted for this brief";
    default:
      return "Not currently available";
  }
}

export function MapAbleCoreBrief() {
  const [selected, setSelected] = useState<MapAbleModule[]>([
    "core",
    "care",
    "transport",
    "jobs",
    "access",
  ]);
  const [includeProfile, setIncludeProfile] = useState(false);
  const [brief, setBrief] = useState<PlatformBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleModule(module: MapAbleModule) {
    setSelected((current) =>
      current.includes(module)
        ? current.filter((item) => item !== module)
        : [...current, module]
    );
  }

  async function prepareBrief() {
    if (selected.length === 0) {
      setError("Choose at least one MapAble area.");
      return;
    }

    setLoading(true);
    setError(null);
    setBrief(null);

    try {
      const consentScopes = selected.map((module) => `${module}.summary`);
      if (includeProfile) consentScopes.push("profile.accessibility");

      const response = await fetch("/api/intelligence/platform-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modules: selected,
          includeAccessibilityProfile: includeProfile,
          consentScopes,
          plainLanguage: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "The brief could not be prepared.");
      }
      setBrief(data as PlatformBrief);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The brief could not be prepared.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="mapable-core-heading" className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">MapAble Core Intelligence</p>
        <h2 id="mapable-core-heading" className="text-2xl font-bold">
          Prepare one read-only view across your MapAble services
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Choose the areas MapAble may read for this request. Nothing is booked, submitted,
          shared or paid from this brief. Essential services remain available without AI.
        </p>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-6 pt-6">
          <fieldset>
            <legend className="text-base font-semibold">Include in this brief</legend>
            <p className="mt-1 text-sm text-muted-foreground">
              These permissions apply only to this request.
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
                    <span className="block text-sm text-muted-foreground">{module.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex min-h-14 items-start gap-3 rounded-lg border border-input p-4 focus-within:ring-2 focus-within:ring-ring">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={includeProfile}
              onChange={(event) => setIncludeProfile(event.target.checked)}
            />
            <span>
              <span className="block font-medium">Use my accessibility profile for this request</span>
              <span className="block text-sm text-muted-foreground">
                Off by default. This permits MapAble to read mobility preferences for the current brief only.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="button" size="lg" loading={loading} onClick={() => void prepareBrief()}>
              Prepare my platform brief
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

      {brief ? (
        <div className="space-y-5" aria-live="polite" aria-atomic="false">
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="font-semibold">Important boundaries</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {brief.notices.map((notice) => <li key={notice}>{notice}</li>)}
            </ul>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {brief.modules.map((module) => (
              <article key={module.module} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold capitalize">{module.module === "payments" ? "AbilityPay" : module.module}</h3>
                  <span className="rounded-full border px-3 py-1 text-xs font-medium">
                    {statusLabel(module.status)}
                  </span>
                </div>
                <p className="mt-3">{module.summary}</p>
                {module.highlights.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                    {module.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                  </ul>
                ) : null}
                {module.evidence.length > 0 ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">Evidence and confidence</summary>
                    <ul className="mt-2 space-y-2 text-sm">
                      {module.evidence.map((item) => (
                        <li key={`${item.source}-${item.label}`}>
                          <strong>{item.label}</strong>: {Math.round(item.confidence * 100)}% confidence,
                          source: {item.source}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                <Link href={module.nonAiPath} className="mt-4 inline-block font-medium text-primary underline-offset-4 hover:underline">
                  Open the standard {module.module === "payments" ? "billing" : module.module} area
                </Link>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
