"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CommissionEscalationPanel({
  submissionId,
  alreadyEscalated,
}: {
  submissionId: string;
  alreadyEscalated: boolean;
}) {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    referenceId: string;
    handoffUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (alreadyEscalated || result) {
    return (
      <section className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <h3 className="font-semibold">NDIS Commission escalation</h3>
        <p className="mt-2 text-muted-foreground">
          {result
            ? `Reference: ${result.referenceId}. Use the Commission portal to complete your external complaint.`
            : "This complaint has been marked for external escalation."}
        </p>
        {result ? (
          <a
            href={result.handoffUrl}
            className="mt-3 inline-block text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open NDIS Commission complaints →
          </a>
        ) : null}
      </section>
    );
  }

  async function escalate() {
    if (!consent) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/engagement/commission-lodge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, consentConfirmed: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not escalate");
        return;
      }
      setResult({
        referenceId: data.referenceId,
        handoffUrl: data.handoffUrl,
      });
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3 text-sm">
      <h3 className="font-semibold">Escalate to NDIS Commission</h3>
      <p className="text-muted-foreground">
        If you have exhausted your provider&apos;s complaints process, or need an external pathway, you can
        escalate to the NDIS Commission. MapAble will prepare a summary and open the Commission portal —
        we do not lodge on your behalf without your explicit consent.
      </p>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          I consent to MapAble preparing my complaint summary for NDIS Commission escalation and understand
          I will complete submission on the Commission website.
        </span>
      </label>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="button" variant="default" size="default" disabled={!consent || loading} onClick={() => void escalate()}>
        {loading ? "Preparing…" : "Escalate with consent"}
      </Button>
    </section>
  );
}
