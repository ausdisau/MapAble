"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const FAILURE_MODES = [
  "expired_consent",
  "stale_credential",
  "inaccessible_vehicle",
  "lift_outage",
  "handoff_not_accepted",
  "lost_phone",
  "rejected_invoice",
  "worker_cancellation",
  "equipment_breakdown",
] as const;

export function StartingWorkControls() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run(failureMode?: string) {
    setLoading(true);
    setResult("");
    const url = failureMode
      ? `/api/pilot/starting-work/simulate?failureMode=${encodeURIComponent(failureMode)}`
      : "/api/pilot/starting-work/simulate";
    const res = await fetch(url);
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setResult(body.error ?? "Simulate failed");
      return;
    }
    const state = body.state as {
      blocked: boolean;
      blockReason?: string;
      failureMode?: string;
      stepsCompleted: string[];
      notices: string[];
    };
    setResult(
      JSON.stringify(
        {
          blocked: state.blocked,
          blockReason: state.blockReason,
          failureMode: state.failureMode,
          steps: state.stepsCompleted.length,
          notices: state.notices.slice(-3),
          persisted: body.persisted ?? null,
        },
        null,
        2,
      ),
    );
  }

  return (
    <section aria-labelledby="controls-heading" className="space-y-3">
      <h2 id="controls-heading" className="text-lg font-semibold">
        Failure variants (synthetic simulate)
      </h2>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={() => void run()}
          data-testid="run-baseline-simulate"
        >
          Run baseline simulate
        </Button>
        {FAILURE_MODES.map((mode) => (
          <Button
            key={mode}
            type="button"
            variant="outline"
            size="default"
            disabled={loading}
            onClick={() => void run(mode)}
            data-testid={`run-failure-${mode}`}
          >
            {mode.replaceAll("_", " ")}
          </Button>
        ))}
      </div>
      {result ? (
        <pre
          className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs"
          data-testid="simulate-result"
        >
          {result}
        </pre>
      ) : null}
    </section>
  );
}
