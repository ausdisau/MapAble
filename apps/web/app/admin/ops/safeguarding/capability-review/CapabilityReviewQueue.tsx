"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type ReviewCase = {
  id: string;
  kind: string;
  scope: string;
  legalProhibition: boolean;
  decision: string;
  workerProfile: { displayName: string; userId: string | null };
};

const DECISIONS = [
  "hold",
  "request_evidence",
  "refer_for_assessment",
  "escalate",
  "approve",
  "reject",
] as const;

export function CapabilityReviewQueue() {
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [status, setStatus] = useState("Loading review queue.");
  const [reason, setReason] = useState("Human review recorded.");

  async function load() {
    const res = await fetch("/api/workforce/assessments/review", { cache: "no-store" });
    if (res.status === 404) {
      setStatus("Capability Review is not available in this environment.");
      return;
    }
    if (!res.ok) {
      setStatus("The queue could not be loaded.");
      return;
    }
    const data = (await res.json()) as { cases: ReviewCase[] };
    setCases(data.cases);
    setStatus(`${data.cases.length} open review cases.`);
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(caseId: string, decision: (typeof DECISIONS)[number], legalProhibition: boolean) {
    if (decision === "approve" && legalProhibition) {
      setStatus("Approve cannot override a legal prohibition.");
      return;
    }
    const res = await fetch("/api/workforce/assessments/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, decision, reason, limitations: [] }),
    });
    const data = await res.json();
    setStatus(res.ok ? `Decision saved: ${decision}.` : String(data.error ?? "Review failed."));
    if (res.ok) void load();
  }

  return (
    <div className="space-y-4">
      <p role="status" aria-live="polite" className="text-sm">
        {status}
      </p>
      <label className="block text-sm" htmlFor="review-reason">
        Decision reason
      </label>
      <textarea
        id="review-reason"
        className="min-h-24 w-full rounded-lg border p-3"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      {cases.length === 0 ? (
        <p>No open capability review cases.</p>
      ) : (
        <ul className="space-y-4">
          {cases.map((row) => (
            <li key={row.id} className="space-y-3 rounded-xl border p-4">
              <p>
                <strong>{row.workerProfile.displayName}</strong> — {row.kind} ({row.scope})
              </p>
              {row.legalProhibition ? (
                <p className="font-medium">
                  Legal prohibition recorded. Approve is disabled for Exclusion and participant
                  blocks.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {DECISIONS.map((decision) => (
                  <Button
                    key={decision}
                    type="button"
                    size="lg"
                    variant={decision === "approve" ? "default" : "outline"}
                    disabled={decision === "approve" && row.legalProhibition}
                    onClick={() => void decide(row.id, decision, row.legalProhibition)}
                  >
                    {decision.replaceAll("_", " ")}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
