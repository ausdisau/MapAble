"use client";

import { useState } from "react";

import { QuarterlyPacingAlert } from "@/components/billing/QuarterlyPacingAlert";
import { Button } from "@/components/ui/button";

/**
 * Scaffold mount for claiming hub — enter participant/provider IDs to run pace-check.
 */
export function QuarterlyPacingAlertScaffold() {
  const [participantId, setParticipantId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [active, setActive] = useState<{
    participantId: string;
    providerId: string;
  } | null>(null);

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">
        Quarterly PACE pacing (scaffold)
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Participant ID
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Provider organisation ID
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          />
        </label>
      </div>
      <Button
        type="button"
        variant="default"
        size="default"
        onClick={() => {
          if (!participantId.trim() || !providerId.trim()) return;
          setActive({
            participantId: participantId.trim(),
            providerId: providerId.trim(),
          });
        }}
      >
        Check pacing
      </Button>
      {active ? (
        <QuarterlyPacingAlert
          participantId={active.participantId}
          providerId={active.providerId}
        />
      ) : null}
    </section>
  );
}
