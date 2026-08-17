"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type RiskResult = {
  participantId: string;
  score: number;
  band: "stable" | "elevated" | "high" | "critical";
  drivers: string[];
  trend: number[];
  authorityCeiling: "ADVISORY_ONLY";
  requiresHumanConfirmation: true;
  notice: string;
};

const BAND_LABEL: Record<RiskResult["band"], string> = {
  stable: "Stable",
  elevated: "Elevated",
  high: "High",
  critical: "Critical",
};

type Props = {
  participantId: string;
};

export function BehavioralRiskPanel({ participantId }: Props) {
  const [result, setResult] = useState<RiskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/incidents/analytics/risk-score?participantId=${encodeURIComponent(participantId)}`
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Risk score unavailable");
        setResult(null);
        return;
      }
      setResult(json as RiskResult);
    } catch {
      setError("Risk score unavailable");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sparkPoints = useMemo(() => {
    const trend = result?.trend ?? [];
    if (trend.length === 0) return "";
    const max = 10;
    const w = 120;
    const h = 32;
    return trend
      .map((v, i) => {
        const x = (i / Math.max(1, trend.length - 1)) * w;
        const y = h - (v / max) * h;
        return `${x},${y}`;
      })
      .join(" ");
  }, [result?.trend]);

  const triggerCase = async () => {
    setActionMsg(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          title: "Early-intervention case (human-confirmed)",
          description:
            "Created from Behavioral Risk Panel after human confirmation. Advisory score only — not auto-escalated.",
          severity: "medium",
          category: "safeguarding",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg(json.error ?? "Could not create incident");
        return;
      }
      setActionMsg("Early-intervention incident created after confirmation.");
      setConfirmOpen(false);
    } catch {
      setActionMsg("Could not create incident");
    }
  };

  if (loading) {
    return (
      <section className="rounded-lg border border-amber-500/40 p-4" aria-busy="true">
        <p className="text-sm text-muted-foreground">Loading advisory risk…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border p-4" role="alert">
        <p className="text-sm text-destructive">{error}</p>
      </section>
    );
  }

  if (!result) return null;

  const priority =
    result.band === "critical" || result.band === "high"
      ? "border-red-600"
      : result.band === "elevated"
        ? "border-amber-500"
        : "border-border";

  return (
    <section
      className={`space-y-3 rounded-lg border-2 p-4 ${priority}`}
      aria-labelledby="behavioral-risk-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="behavioral-risk-heading" className="font-heading text-lg font-semibold">
          Behavioral risk (advisory)
        </h2>
        <p className="text-sm">
          Score {result.score}/10 — {BAND_LABEL[result.band]}
        </p>
      </div>

      {sparkPoints ? (
        <svg
          width={120}
          height={32}
          viewBox="0 0 120 32"
          role="img"
          aria-label={`Risk trend sparkline ending at ${result.score}`}
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={sparkPoints}
          />
        </svg>
      ) : null}

      <ul className="list-disc pl-5 text-sm">
        {result.drivers.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        {result.notice} Authority ceiling: {result.authorityCeiling}.
      </p>

      <Button
        type="button"
        variant="default"
        size="default"
        onClick={() => setConfirmOpen(true)}
      >
        Trigger Early-Intervention Case
      </Button>

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-ei-title"
          className="space-y-3 rounded-md border bg-background p-3"
        >
          <h3 id="confirm-ei-title" className="font-medium">
            Confirm human escalation
          </h3>
          <p className="text-sm text-muted-foreground">
            This will create an incident via the existing intake API. The risk
            score never auto-escalates.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => void triggerCase()}
            >
              Confirm create
            </Button>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {actionMsg ? (
        <p className="text-sm" role="status">
          {actionMsg}
        </p>
      ) : null}
    </section>
  );
}
