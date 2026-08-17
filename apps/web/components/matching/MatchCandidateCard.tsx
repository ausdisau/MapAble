"use client";

import Link from "next/link";
import { useState } from "react";

import { ConsentSharingPanel } from "@/components/consent/ConsentSharingPanel";
import { Button } from "@/components/ui/button";

type Candidate = {
  id: string;
  candidateType: string;
  score: number;
  scoreExplanation: string;
  status: string;
  factors?: { factorType: string; score: number; explanation: string }[];
};

export function MatchCandidateCard({
  candidate,
  mode = "admin",
  consentGranted = true,
  onConsentGranted,
}: {
  candidate: Candidate;
  matchRunId?: string;
  mode?: "admin" | "participant";
  consentGranted?: boolean;
  onConsentGranted?: () => void;
}) {
  const [status, setStatus] = useState(candidate.status);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const topFactors = (candidate.factors ?? []).slice(0, 3);
  const matchQuality =
    candidate.score >= 0.7
      ? "Good fit based on available information"
      : "May need review";

  async function selectCandidate() {
    if (mode === "participant" && !consentGranted) {
      setError("Please confirm sharing before selecting a match.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/matching/candidates/${candidate.id}/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantConfirmed: mode === "participant",
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not confirm match");
      return;
    }
    setStatus("selected");
  }

  async function rejectCandidate() {
    setBusy(true);
    const res = await fetch(`/api/matching/candidates/${candidate.id}/reject`, {
      method: "POST",
    });
    setBusy(false);
    if (res.ok) setStatus("rejected");
  }

  return (
    <article className="rounded-lg border p-4">
      <h2 className="font-semibold">
        {mode === "participant" ? matchQuality : `${candidate.candidateType} — score ${(candidate.score * 100).toFixed(0)}%`}
      </h2>
      <p className="mt-2 text-sm">
        {mode === "participant"
          ? candidate.scoreExplanation.slice(0, 200)
          : candidate.scoreExplanation}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Status: {status}</p>
      {topFactors.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm" aria-label="Top match factors">
          {topFactors.map((f, i) => (
            <li key={i}>{f.explanation}</li>
          ))}
        </ul>
      )}
      {mode === "participant" && !consentGranted ? (
        <div className="mt-4">
          <ConsentSharingPanel
            scope="booking.manage"
            purpose="Share enough information to review and confirm a support worker match."
            recipientLabel="Your chosen provider organisation"
            notSharedNotes={[
              "Full medical history",
              "Unrelated personal contacts",
              "Financial details",
            ]}
            onGranted={onConsentGranted}
          />
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={busy || status === "selected"}
          onClick={() => void selectCandidate()}
        >
          {mode === "participant" ? "Confirm this match" : "Select (confirm)"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={busy}
          onClick={() => void rejectCandidate()}
        >
          {mode === "participant" ? "Not a good fit" : "Reject"}
        </Button>
        {mode === "participant" ? (
          <Link
            href="/dashboard/safety/incidents/new"
            className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
          >
            Dispute this match
          </Link>
        ) : null}
      </div>
    </article>
  );
}
