"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Pacing = {
  quarterLabel: string;
  remainingAUD: number;
  daysRemaining: number;
  bookingAllowed: boolean;
  warnings: string[];
  quarterlyAllocationAUD: number;
  quarterSpentAUD: number;
};

type PaceCheckResponse = {
  endorsed: boolean;
  pacing: Pacing;
  consentRequestQueued: boolean;
  notice: string;
};

type Props = {
  participantId: string;
  providerId: string;
  categoryCode?: string;
};

export function QuarterlyPacingAlert({
  participantId,
  providerId,
  categoryCode = "0001",
}: Props) {
  const [data, setData] = useState<PaceCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/care/bookings/pace-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, providerId, categoryCode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Pacing check unavailable");
        setData(null);
        return;
      }
      setData(json as PaceCheckResponse);
    } catch {
      setError("Pacing check unavailable");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [participantId, providerId, categoryCode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Checking quarterly pacing…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border p-4" role="alert">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="mt-2"
          onClick={() => void load()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { pacing } = data;
  const hasWarnings = pacing.warnings.length > 0;

  return (
    <section className="space-y-2 rounded-lg border p-4">
      <h2 className="font-heading text-lg font-semibold">
        Quarterly PACE pacing
      </h2>
      <p className="text-sm">
        {pacing.quarterLabel} Balance: $
        {pacing.remainingAUD.toLocaleString("en-AU", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}{" "}
        remaining — {pacing.daysRemaining} days left
      </p>
      <p className="text-xs text-muted-foreground">
        Spent ${pacing.quarterSpentAUD.toLocaleString("en-AU")} of $
        {pacing.quarterlyAllocationAUD.toLocaleString("en-AU")} allocation.
        Endorsed: {data.endorsed ? "yes" : "no"}
        {data.consentRequestQueued ? " · consent request queued" : ""}
      </p>
      {hasWarnings ? (
        <ul className="space-y-1" role="list">
          {pacing.warnings.map((w) => (
            <li key={w}>
              <span className="inline-flex rounded-md bg-amber-500/20 px-2 py-1 text-sm text-amber-950 dark:text-amber-100">
                Warning: {w}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {!pacing.bookingAllowed ? (
        <p className="text-sm font-medium text-destructive" role="status">
          New bookings blocked — quarterly balance exhausted.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">{data.notice}</p>
    </section>
  );
}
