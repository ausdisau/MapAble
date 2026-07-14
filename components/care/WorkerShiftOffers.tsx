"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";

export function WorkerShiftOffers({
  offers,
}: {
  offers: Array<{
    id: string;
    title: string;
    startsAt: string;
    expiresAt: string;
  }>;
}) {
  const [message, setMessage] = useState("");

  async function accept(offerId: string) {
    setMessage("Accepting shift offer.");
    const response = await fetch(`/api/worker/shift-offers/${offerId}/accept`, {
      method: "POST",
    });
    setMessage(
      response.ok
        ? "Shift accepted. The participant had already confirmed this offer."
        : "This offer is unavailable or has already been accepted.",
    );
  }

  return (
    <section aria-labelledby="shift-offers-heading" className="space-y-3">
      <h2 id="shift-offers-heading" className="font-heading text-xl font-bold">
        Shift offers
      </h2>
      <p className="text-sm text-muted-foreground">
        Offers shown here have been confirmed by the participant. Review before
        accepting.
      </p>
      <p role="status" aria-live="polite" className="text-sm">
        {message}
      </p>
      {offers.length ? (
        <ul className="space-y-3">
          {offers.map((offer) => (
            <li key={offer.id} className="rounded-xl border p-4">
              <strong>{offer.title}</strong>
              <span className="block text-sm">
                Starts {new Date(offer.startsAt).toLocaleString()}
              </span>
              <span className="block text-sm text-muted-foreground">
                Respond by {new Date(offer.expiresAt).toLocaleString()}
              </span>
              <Button
                className="mt-3"
                onClick={() => accept(offer.id)}
                size="default"
                variant="default"
              >
                Accept shift
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No shift offers waiting.
        </p>
      )}
    </section>
  );
}
