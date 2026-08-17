"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MatchCandidateCard } from "@/components/matching/MatchCandidateCard";

type ReviewResponse = {
  run: {
    id: string;
    status: string;
    candidates: {
      id: string;
      candidateType: string;
      score: number;
      scoreExplanation: string;
      status: string;
      factors?: { factorType: string; score: number; explanation: string }[];
    }[];
    decisions?: { participantConfirmed: boolean }[];
  } | null;
  careRequest: { id: string; title: string };
};

export default function ParticipantMatchReviewPage({
  params,
}: {
  params: Promise<{ careRequestId: string }>;
}) {
  const [careRequestId, setCareRequestId] = useState<string | null>(null);
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [consentGranted, setConsentGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setCareRequestId(p.careRequestId));
  }, [params]);

  useEffect(() => {
    if (!careRequestId) return;
    void fetch(`/api/matching/care/${careRequestId}/review`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not load matches");
        }
        return res.json() as Promise<ReviewResponse>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [careRequestId]);

  const confirmed = data?.run?.decisions?.some((d) => d.participantConfirmed);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/dashboard/care" className="text-sm text-primary hover:underline">
          ← Back to care
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Review suggested workers</h1>
        <p className="mt-1 text-muted-foreground">
          {data?.careRequest.title
            ? `For: ${data.careRequest.title}`
            : "Review match suggestions before anyone is assigned."}
        </p>
        {confirmed ? (
          <p className="mt-2 rounded-lg border border-green-600/30 bg-green-50 p-3 text-sm dark:bg-green-950/30">
            You have confirmed a match. A coordinator will complete assignment — workers
            are never assigned automatically.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No worker is assigned until you confirm and a human completes dispatch.
          </p>
        )}
      </header>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {data?.run?.candidates?.length ? (
        <div className="grid max-w-3xl gap-4">
          {data.run.candidates.map((candidate) => (
            <MatchCandidateCard
              key={candidate.id}
              candidate={candidate}
              matchRunId={data.run?.id}
              mode="participant"
              consentGranted={consentGranted}
              onConsentGranted={() => setConsentGranted(true)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No match suggestions yet. Your coordinator may still be preparing options.
        </p>
      )}
    </div>
  );
}
