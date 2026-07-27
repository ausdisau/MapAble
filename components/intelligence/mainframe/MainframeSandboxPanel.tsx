"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const DEMO_CONTEXT = {
  requestId: "syn_req_sandbox",
  dataClassification: "SYNTHETIC",
  participantReference: "syn_participant_river",
  actorAssurance: "AAL2",
  consentSnapshotId: "syn_consent_001",
  consentScopes: ["care:compare", "transport:compare"],
  rightsSnapshotId: "syn_rights_001",
  coreFactsHash: "sha256:sandbox",
  policyVersion: "policy-1.0.0",
  promptVersion: "supervisor-1.0.0",
  graphVersion: "vnn-1.0.0",
  expiresAt: "2030-01-01T00:00:00.000Z",
};

export function MainframeSandboxPanel() {
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);

  async function runScenario() {
    setRunning(true);
    const response = await fetch("/api/intelligence/mainframe/mission", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        goal: "I need support and accessible transport from home to physiotherapy next Tuesday.",
        context: DEMO_CONTEXT,
      }),
    });
    setResult(JSON.stringify(await response.json(), null, 2));
    setRunning(false);
  }

  return (
    <section aria-labelledby="mainframe-sandbox-heading" className="rounded-xl border bg-card p-6">
      <h1 id="mainframe-sandbox-heading" className="font-heading text-3xl font-bold">
        Intelligence Mainframe synthetic sandbox
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        This is an admin-only synthetic evaluation environment. It has no production data, execution tools, booking, messaging, payment, or external model calls.
      </p>
      <Button className="mt-5" disabled={running} loading={running} onClick={runScenario} size="default" variant="default">
        Run supported-appointment scenario
      </Button>
      <p className="mt-3 text-sm" aria-live="polite">
        {running ? "Running deterministic synthetic evaluation." : ""}
      </p>
      {result ? (
        <pre className="mt-5 overflow-x-auto rounded-lg bg-muted p-4 text-xs" aria-label="Synthetic scenario result">
          {result}
        </pre>
      ) : null}
    </section>
  );
}
