"use client";

import { useState } from "react";

import { BehavioralRiskPanel } from "@/components/safety/BehavioralRiskPanel";
import { Button } from "@/components/ui/button";

export function BehavioralRiskPanelScaffold() {
  const [participantId, setParticipantId] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">
        Behavioral risk matrix (scaffold)
      </h2>
      <label className="block text-sm">
        Participant ID
        <input
          className="mt-1 w-full max-w-md rounded-md border px-3 py-2"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
        />
      </label>
      <Button
        type="button"
        variant="default"
        size="default"
        onClick={() => {
          if (!participantId.trim()) return;
          setActiveId(participantId.trim());
        }}
      >
        Load advisory score
      </Button>
      {activeId ? <BehavioralRiskPanel participantId={activeId} /> : null}
    </section>
  );
}
