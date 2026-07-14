"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ParticipantShiftOffers({
  offers,
}: {
  offers: Array<{
    id: string;
    workerName: string;
    startsAt: string;
    matchedRequirements: string[];
    uncertainty: string[];
  }>;
}) {
  const [message, setMessage] = useState("");

  async function confirm(offerId: string) {
    setMessage("Confirming your worker choice.");
    const response = await fetch(
      `/api/care/shift-offers/${offerId}/participant-confirm`,
      { method: "POST" },
    );
    setMessage(
      response.ok
        ? "Choice confirmed. The worker must still accept the shift."
        : "This option is no longer available. You can request alternatives.",
    );
  }

  return (
    <section aria-labelledby="participant-offers-heading" className="space-y-4">
      <h1 id="participant-offers-heading" className="font-heading text-2xl font-bold">
        Worker options
      </h1>
      <p>
        Review why each worker was proposed. You can confirm, decline or ask a
        person for alternatives.
      </p>
      <p role="status" aria-live="polite">{message}</p>
      <ul className="space-y-4">
        {offers.map((offer) => (
          <li key={offer.id} className="rounded-xl border p-4">
            <h2 className="font-bold">{offer.workerName}</h2>
            <p className="text-sm">Shift starts {new Date(offer.startsAt).toLocaleString()}</p>
            <h3 className="mt-3 font-bold">Matched requirements</h3>
            <ul className="list-disc pl-5 text-sm">
              {offer.matchedRequirements.map((item) => <li key={item}>{item}</li>)}
            </ul>
            {offer.uncertainty.map((item) => (
              <p key={item} className="mt-2 text-sm text-muted-foreground">
                Uncertain: {item}
              </p>
            ))}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => confirm(offer.id)} size="default" variant="default">
                Confirm this worker
              </Button>
              <a className="inline-flex min-h-11 items-center rounded-lg border px-4 font-bold" href="/dashboard/messages">
                Ask a person
              </a>
            </div>
          </li>
        ))}
      </ul>
      {!offers.length ? <p>No worker options are waiting for your decision.</p> : null}
    </section>
  );
}
