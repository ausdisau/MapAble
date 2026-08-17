"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Simulation = {
  scenarioName: string;
  outcomes: Array<{ measure: string; result: string; explanation: string }>;
  uncertainty: string[];
  humanReviewRequired: boolean;
  noOperationalChangeMade: boolean;
};

export function TransportSimulationPanel() {
  const [simulation, setSimulation] = useState<Simulation>();
  const [message, setMessage] = useState(
    "Simulation is decision support only. It does not change bookings or contact providers."
  );

  async function simulateStationAccess() {
    setMessage("Running a simulation using only the assumptions shown.");
    const response = await fetch("/api/intelligence/careos/simulations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioName: "inaccessible_station",
        assumptions: ["A station lift is unavailable."],
        requiredSafeguards: ["Confirm an accessible alternative with a human before travel."],
        participantPreferences: ["Avoid unplanned transfers."],
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(
        payload.error === "FEATURE_DISABLED"
          ? "Simulation is currently paused. You can continue using standard transport planning."
          : "Simulation is unavailable right now."
      );
      return;
    }
    setSimulation(payload.result);
    setMessage("Simulation complete. No operational change was made.");
  }

  return (
    <section aria-labelledby="transport-simulation-heading" className="rounded-xl border bg-card p-5">
      <h2 id="transport-simulation-heading" className="font-heading text-xl font-bold">
        Transport simulation
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Explore a possible accessibility disruption before making any real-world change.
      </p>
      <Button className="mt-4" onClick={simulateStationAccess} size="default" variant="outline">
        Simulate an unavailable station lift
      </Button>
      <p className="mt-3 text-sm" aria-live="polite">{message}</p>
      {simulation ? (
        <div className="mt-4 space-y-3">
          <ul className="space-y-2">
            {simulation.outcomes.map((outcome) => (
              <li key={outcome.measure} className="rounded-lg border p-3 text-sm">
                <strong>{outcome.measure}</strong>
                <span className="block">{outcome.explanation}</span>
                <span className="block text-muted-foreground">Status: {outcome.result}</span>
              </li>
            ))}
          </ul>
          {simulation.uncertainty.map((item) => (
            <p key={item} className="text-sm text-muted-foreground">Uncertain: {item}</p>
          ))}
          {simulation.humanReviewRequired ? (
            <p className="text-sm font-bold">A human review is required before any arrangement changes.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
