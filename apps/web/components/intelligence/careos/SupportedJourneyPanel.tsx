"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Option = {
  id: string;
  workerId: string;
  vehicleId: string;
  arrivalAt: string;
  verifiedEvidence: string[];
  tradeOffs: string[];
  uncertainty: string[];
  simulatedCost: { currency: string; minorUnits: number };
  policy: { decision: string; reasonCodes: string[] };
};

export function SupportedJourneyPanel() {
  const [options, setOptions] = useState<Option[]>([]);
  const [status, setStatus] = useState("Simulation only—no booking has been made.");

  async function plan() {
    setStatus("Preparing synthetic options.");
    const response = await fetch("/api/intelligence/careos/supported-journey", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tenantId: "synthetic-tenant",
        participantId: "current-participant",
        appointment: {
          id: "synthetic-appointment",
          startsAt: "2026-07-20T10:00:00.000Z",
          timezone: "Australia/Sydney",
          destination: "Synthetic physiotherapy appointment",
        },
        requirements: {
          serviceType: "personal_care",
          workerCredentials: ["first_aid", "wwcc"],
          communicationSupport: ["plain_language"],
          wheelchairAccessible: true,
          requiresRamp: true,
          assistanceAnimal: false,
          minimumConnectionMinutes: 15,
        },
        excludedWorkerIds: [],
        excludedProviderIds: [],
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error === "FEATURE_DISABLED" ? "Supported journey simulation is paused." : "Options are unavailable. Ask a person for help.");
      return;
    }
    setOptions(payload.journey.options);
    setStatus("Options ready. Review and choose; no booking has been made.");
  }

  return (
    <section aria-labelledby="supported-journey-heading" className="rounded-xl border bg-card p-5">
      <h2 id="supported-journey-heading" className="font-heading text-xl font-bold">Plan my supported appointment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Compare a support worker and accessible transport as one coordinated synthetic plan.
      </p>
      <Button className="mt-4" onClick={plan} size="default" variant="default">Compare options</Button>
      <p className="mt-3 text-sm" role="status" aria-live="polite">{status}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {options.map((option, index) => (
          <article key={option.id} className="rounded-xl border p-4">
            <h3 className="font-bold">Option {index + 1}</h3>
            <p className="mt-2 text-sm">Worker: {option.workerId}</p>
            <p className="text-sm">Vehicle: {option.vehicleId}</p>
            <p className="text-sm">Arrival: {new Date(option.arrivalAt).toLocaleString()}</p>
            <p className="text-sm">Estimated synthetic cost: ${(option.simulatedCost.minorUnits / 100).toFixed(2)} {option.simulatedCost.currency}</p>
            <h4 className="mt-3 font-bold">Why this was suggested</h4>
            <ul className="list-disc pl-5 text-sm">{option.tradeOffs.map((item) => <li key={item}>{item}</li>)}</ul>
            <h4 className="mt-3 font-bold">What evidence was used</h4>
            <ul className="list-disc pl-5 text-sm">{option.verifiedEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
            <h4 className="mt-3 font-bold">What needs confirmation</h4>
            <p className="text-sm">{option.policy.decision.replace(/_/g, " ")}</p>
            {option.uncertainty.map((item) => <p key={item} className="mt-2 text-sm text-muted-foreground">Uncertain: {item}</p>)}
            <Button className="mt-4" disabled size="default" variant="outline">Simulated confirmation only</Button>
          </article>
        ))}
      </div>
      <Link className="mt-4 inline-flex min-h-11 items-center underline focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40" href="/dashboard/transport/new">
        Continue without CareOS
      </Link>
    </section>
  );
}
