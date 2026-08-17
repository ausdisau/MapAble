"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JourneyPlan } from "@/intelligence/types";

export function AccessibleJourneyAssistant() {
  const [message, setMessage] = useState("Help me arrange accessible transport to my next support appointment.");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [useProfile, setUseProfile] = useState(false);
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function prepareJourney() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/intelligence/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          origin: origin || undefined,
          destination: destination || undefined,
          useAccessibilityProfile: useProfile,
          plainLanguage: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Journey planning failed.");
      setPlan(data.plan as JourneyPlan);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Journey planning failed.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmBooking() {
    if (!plan?.approval.token) return;
    setApproving(true);
    setError(null);
    try {
      const response = await fetch("/api/intelligence/approvals/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: plan.approval.token, confirmed: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Approval failed.");
      setSuccess(data.message ?? "Transport request created.");
      setPlan((current) => current ? {
        ...current,
        approval: { ...current.approval, token: null },
      } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Approval failed.");
    } finally {
      setApproving(false);
    }
  }

  return (
    <section aria-labelledby="journey-assistant-heading" className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">MapAble Intelligence Fabric</p>
        <h2 id="journey-assistant-heading" className="mt-1 text-2xl font-bold">Plan an accessible journey</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          MapAble reads your upcoming appointment and prepares transport options. It will not create a request until you explicitly confirm it.
        </p>
      </div>

      <Card variant="elevated">
        <CardContent className="space-y-4 pt-6">
          <label htmlFor="journey-message" className="block text-sm font-medium">What do you need?</label>
          <textarea
            id="journey-message"
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Pickup address</span>
              <input
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-input bg-background px-4"
                autoComplete="street-address"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>Appointment destination</span>
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-input bg-background px-4"
              />
            </label>
          </div>

          <label className="flex min-h-12 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={useProfile}
              onChange={(event) => setUseProfile(event.target.checked)}
              className="size-5"
            />
            Use my participant-controlled accessibility profile for this request
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="button" size="lg" loading={loading} onClick={() => void prepareJourney()}>
              Prepare journey
            </Button>
            <Link
              href="/dashboard/transport/new"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Use standard form instead
            </Link>
          </div>
        </CardContent>
      </Card>

      {error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}
      {success ? <p role="status" className="rounded-lg border border-green-600/30 bg-green-50 p-4 text-sm text-green-900">{success}</p> : null}

      {plan ? (
        <Card>
          <CardContent className="space-y-5 pt-6" aria-live="polite">
            <div>
              <h3 className="text-xl font-semibold">{plan.summary}</h3>
              <p className="mt-2 text-sm leading-6">{plan.reasoning}</p>
            </div>

            {plan.appointment ? (
              <dl className="grid gap-2 rounded-lg bg-muted p-4 text-sm md:grid-cols-2">
                <div><dt className="font-semibold">Appointment</dt><dd>{plan.appointment.title}</dd></div>
                <div><dt className="font-semibold">Starts</dt><dd>{new Date(plan.appointment.startAt).toLocaleString()}</dd></div>
              </dl>
            ) : null}

            {plan.options.length > 0 ? (
              <div>
                <h4 className="font-semibold">Suggested options</h4>
                <ul className="mt-3 space-y-3">
                  {plan.options.map((option) => (
                    <li key={option.id} className="rounded-lg border p-4">
                      <p className="font-semibold">{option.label}{option.id === plan.selectedOptionId ? " (recommended draft)" : ""}</p>
                      <p className="mt-1 text-sm">{option.rationale}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Live availability checked: {option.liveAvailabilityChecked ? "Yes" : "No"}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {plan.uncertainty.length > 0 ? (
              <div>
                <h4 className="font-semibold">What is still uncertain</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {plan.uncertainty.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}

            {plan.evidence.length > 0 ? (
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer font-semibold">Evidence used</summary>
                <ul className="mt-3 space-y-2 text-sm">
                  {plan.evidence.map((item) => (
                    <li key={`${item.source}-${item.label}`}><strong>{item.label}:</strong> {item.details} ({Math.round(item.confidence * 100)}% confidence)</li>
                  ))}
                </ul>
              </details>
            ) : null}

            {plan.approval.token ? (
              <div className="rounded-lg border-2 border-primary p-4">
                <h4 className="font-semibold">Your confirmation is required</h4>
                <p className="mt-2 text-sm">{plan.approval.confirmationText}</p>
                <Button className="mt-4" type="button" size="lg" loading={approving} onClick={() => void confirmBooking()}>
                  Confirm and create transport request
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
