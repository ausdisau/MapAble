import Link from "next/link";

import {
  isStartingWorkPilotEnabled,
  startingWorkPilotConfig,
} from "@/lib/config/starting-work-pilot";
import { runGoldenJourney } from "@/lib/pilot/starting-work/golden-journey";

import { StartingWorkControls } from "./StartingWorkControls";

export default function StartingWorkPilotPage() {
  if (!isStartingWorkPilotEnabled()) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Starting Work pilot</h1>
        <p className="text-muted-foreground">
          Pilot is disabled. Set{" "}
          <code>MAPABLE_STARTING_WORK_PILOT_ENABLED=true</code> for the
          synthetic Taylor @ Harbour journey.
        </p>
      </main>
    );
  }

  const baseline = runGoldenJourney({});

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Starting Work — Taylor</h1>
        <p className="text-muted-foreground">
          Harbour Civic Centre synthetic golden journey. Accepts agreement,
          transport quote, communication disclosure, worker confirmation,
          AccessCast, Visit Pack, service review, outcome, and invoice evidence
          as a compound walkthrough.
        </p>
        <p className="text-xs text-muted-foreground">
          Public claim: none · syntheticOnly=
          {String(startingWorkPilotConfig.syntheticOnly)} · dbPersistence=
          {String(startingWorkPilotConfig.dbPersistence)} · autoAssignment=
          false
        </p>
      </header>

      <section aria-labelledby="baseline-heading" className="space-y-3">
        <h2 id="baseline-heading" className="text-lg font-semibold">
          Baseline walkthrough
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {baseline.stepsCompleted.map((step) => (
            <li key={step}>
              <span data-testid={`step-${step}`}>{step.replaceAll("_", " ")}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm" data-testid="participant-goal">
          Goal: {baseline.participantGoal}
        </p>
        <p className="text-sm" data-testid="outcome-receipt">
          Outcome receipt: {baseline.outcomeReceiptId ?? "none"}
        </p>
        <p className="text-sm" data-testid="state-honesty-invoice">
          Invoice state: {baseline.stateHonesty.invoice}
        </p>
        <p className="text-sm" data-testid="regional-confirmed">
          Regional confirmed (must stay empty until approval+domain confirm):{" "}
          {baseline.regionalConfirmed.length}
        </p>
      </section>

      <section aria-labelledby="deps-heading" className="space-y-2">
        <h2 id="deps-heading" className="text-lg font-semibold">
          Dependency graph
        </h2>
        <ul className="space-y-1 text-sm" data-testid="dependency-graph">
          {baseline.dependencyGraph.nodes.map((node) => (
            <li key={node.id}>
              {node.label}: <strong>{node.state}</strong>
            </li>
          ))}
        </ul>
      </section>

      <StartingWorkControls />

      <p className="text-xs text-muted-foreground">
        Temporary projection only — does not create CareOSMission or live NDIA /
        Xero / routing. See{" "}
        <Link className="underline" href="/dashboard/consent">
          Consent centre
        </Link>
        .
      </p>
    </main>
  );
}
