"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ChallengeReceiptButton({ receiptId }: { receiptId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function challenge() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/trust-fabric/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiptId,
        note: "Participant challenges future use of this access",
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Could not challenge receipt");
      setLoading(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="default"
        variant="outline"
        disabled={loading}
        onClick={() => void challenge()}
      >
        {loading ? "Challenging…" : "Challenge future use"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
