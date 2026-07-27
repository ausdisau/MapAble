"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

type MissionResult = {
  understoodGoal: string;
  recommendations: Array<{
    id: string;
    title: string;
    summary: string;
    confidence: string;
    uncertainty: string[];
  }>;
  missingInformation: string[];
  consentRequired: string[];
  notice: string;
};

export function MissionComposer() {
  const [goal, setGoal] = useState("I need support and transport to physiotherapy next Tuesday.");
  const [pickupLocation, setPickupLocation] = useState("");
  const [useAccessibilityProfile, setUseAccessibilityProfile] = useState(false);
  const [consentToken, setConsentToken] = useState<string>();
  const [result, setResult] = useState<MissionResult>();
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("Finding read-only options. No booking will be made.");
    const response = await fetch("/api/intelligence/careos/mission", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        goal,
        appointmentQuery: "physiotherapy",
        pickupLocation: pickupLocation || undefined,
        useAccessibilityProfile,
        consentProposalToken: consentToken,
      }),
    });
    const payload = await response.json();
    setResult(payload.result);
    setConsentToken(payload.consentProposal?.token);
    setStatus(
      payload.result?.consentRequired?.length
        ? "CareOS needs your permission before it can use your accessibility profile."
        : payload.result?.notice ?? payload.error ?? "CareOS could not complete the request."
    );
  }

  return (
    <section aria-labelledby="careos-mission-heading" className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 id="careos-mission-heading" className="font-heading text-xl font-bold">
        Plan care and transport
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        CareOS proposes options. You decide. No booking is made here.
      </p>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-bold" htmlFor="careos-goal">
          What do you need help with?
        </label>
        <textarea
          id="careos-goal"
          className="min-h-24 w-full rounded-lg border p-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />
        <label className="block text-sm font-bold" htmlFor="careos-pickup">
          Pickup location
        </label>
        <input
          id="careos-pickup"
          className="min-h-11 w-full rounded-lg border px-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
          value={pickupLocation}
          onChange={(event) => setPickupLocation(event.target.value)}
        />
        <label className="flex min-h-11 items-center gap-3 rounded-lg border p-3 text-sm">
          <input
            type="checkbox"
            checked={useAccessibilityProfile}
            onChange={(event) => setUseAccessibilityProfile(event.target.checked)}
          />
          Use my accessibility profile for this request only
        </label>
        <p className="text-xs text-muted-foreground">
          This helps check vehicle and support fit. It is not stored as chat memory. You can continue without permission using the standard forms.
        </p>
        <Button type="submit" variant="default" size="default">
          Find options
        </Button>
      </form>
      <p className="mt-4 text-sm" aria-live="polite" role="status">
        {status}
      </p>
      {result ? (
        <div className="mt-5 space-y-3" aria-live="polite">
          {result.recommendations.map((recommendation) => (
            <article key={recommendation.id} className="rounded-lg border p-4">
              <h3 className="font-bold">{recommendation.title}</h3>
              <p className="mt-1 text-sm">{recommendation.summary}</p>
              <p className="mt-2 text-sm">Confidence: {recommendation.confidence}</p>
              {recommendation.uncertainty.map((item) => (
                <p key={item} className="mt-1 text-sm text-muted-foreground">
                  Uncertain: {item}
                </p>
              ))}
            </article>
          ))}
          {result.missingInformation.map((item) => (
            <p key={item} className="text-sm">Still needed: {item}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
