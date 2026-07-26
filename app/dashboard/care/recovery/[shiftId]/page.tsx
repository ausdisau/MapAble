"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConsentSharingPanel } from "@/components/consent/ConsentSharingPanel";
import { MatchCandidateCard } from "@/components/matching/MatchCandidateCard";
import { Button } from "@/components/ui/button";

type RecoveryState = {
  recovery: {
    id: string;
    status: string;
    selectedCandidateId: string | null;
  } | null;
  candidates: {
    id: string;
    candidateType: string;
    score: number;
    scoreExplanation: string;
    status: string;
    factors?: { factorType: string; score: number; explanation: string }[];
  }[];
};

export default function BackupRecoveryPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const router = useRouter();
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [state, setState] = useState<RecoveryState | null>(null);
  const [consentGranted, setConsentGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void params.then((p) => setShiftId(p.shiftId));
  }, [params]);

  useEffect(() => {
    if (!shiftId) return;
    void fetch(`/api/care/recovery/${shiftId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load recovery");
        }
        return res.json() as Promise<RecoveryState>;
      })
      .then(setState)
      .catch((e: Error) => setError(e.message));
  }, [shiftId]);

  async function approveCandidate(candidateId: string) {
    if (!shiftId || !consentGranted) {
      setError("Please confirm sharing before approving a backup worker.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/care/recovery/${shiftId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", candidateId }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not approve backup");
      return;
    }
    router.refresh();
    const body = (await res.json()) as RecoveryState;
    setState((prev) => ({
      recovery: body.recovery ?? prev?.recovery ?? null,
      candidates: prev?.candidates ?? [],
    }));
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/dashboard/care/shifts" className="text-sm text-primary hover:underline">
          ← Back to shifts
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Backup support options</h1>
        <p className="mt-1 text-muted-foreground">
          Your shift needs cover. Review suggested workers and confirm your choice — no
          automatic assignment.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!consentGranted ? (
        <ConsentSharingPanel
          scope="booking.manage"
          purpose="Share support profile and booking context with backup worker candidates."
          recipientLabel="Backup workers under your provider"
          notSharedNotes={[
            "Unrelated health records",
            "Payment or plan balance details",
          ]}
          onGranted={() => setConsentGranted(true)}
        />
      ) : null}

      {state?.candidates?.length ? (
        <div className="grid max-w-3xl gap-4">
          {state.candidates.map((candidate) => (
            <div key={candidate.id} className="space-y-3">
              <MatchCandidateCard
                candidate={candidate}
                mode="participant"
                consentGranted={consentGranted}
              />
              <Button
                type="button"
                variant="default"
                size="default"
                disabled={busy || state.recovery?.selectedCandidateId === candidate.id}
                onClick={() => void approveCandidate(candidate.id)}
              >
                Approve this backup worker
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {state?.recovery
            ? `Status: ${state.recovery.status.replace(/_/g, " ")}`
            : "No recovery in progress for this shift."}
        </p>
      )}
    </div>
  );
}
