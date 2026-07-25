"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type ShieldTier = "FULLY_COVERED" | "CONDITIONAL" | "NON_COMPLIANT";

type ShieldResult = {
  isShielded: boolean;
  activeShieldTier: ShieldTier;
  blockingDeficits: string[];
  conditionalDeficits: string[];
  credentialExpiries: Array<{
    key: string;
    label: string;
    expiresAt: string | null;
    daysRemaining: number | null;
  }>;
  dispatchEligible: boolean;
  notice: string;
};

const TIER_STYLES: Record<
  ShieldTier,
  { badge: string; label: string }
> = {
  FULLY_COVERED: {
    badge: "bg-emerald-600 text-white",
    label: "Fully covered",
  },
  CONDITIONAL: {
    badge: "bg-amber-500 text-black",
    label: "Conditional",
  },
  NON_COMPLIANT: {
    badge: "bg-red-600 text-white",
    label: "Non-compliant",
  },
};

type Props = {
  workerId: string;
  providerId?: string;
};

/**
 * MapAble Registration Shield — compliance readiness under a registered partner.
 * Does not claim MapAble is an NDIS-registered platform provider.
 */
export function RegistrationShieldStatus({ workerId, providerId }: Props) {
  const [result, setResult] = useState<ShieldResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/provider/compliance-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, providerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not evaluate Registration Shield");
        setResult(null);
        return;
      }
      setResult(data as ShieldResult);
    } catch {
      setError("Could not evaluate Registration Shield");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [workerId, providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onFileStub = async (file: File | null) => {
    if (!file) return;
    // Freeze: metadata-only stub — no binary upload store.
    setUploadNote(
      `Recorded metadata for “${file.name}” (${file.type || "unknown"}, ${file.size} bytes). Binary storage is disabled under feature freeze — use existing credentials PATCH when available.`
    );
  };

  if (loading) {
    return (
      <section className="rounded-lg border p-4" aria-busy="true">
        <p className="text-sm text-muted-foreground">
          Evaluating Registration Shield…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border p-4" role="alert">
        <h2 className="font-heading text-lg font-semibold">
          MapAble Registration Shield
        </h2>
        <p className="mt-2 text-sm text-destructive">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="mt-3"
          onClick={() => void load()}
        >
          Retry
        </Button>
      </section>
    );
  }

  if (!result) return null;

  const tier = TIER_STYLES[result.activeShieldTier];
  const missing = [
    ...result.blockingDeficits,
    ...result.conditionalDeficits,
  ];

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-lg font-semibold">
          MapAble Registration Shield
        </h2>
        <span
          className={`inline-flex min-h-8 items-center rounded-md px-2.5 py-1 text-sm font-medium ${tier.badge}`}
        >
          {tier.label}
        </span>
        <span className="text-sm text-muted-foreground">
          Dispatch{" "}
          {result.dispatchEligible ? "eligible" : "blocked"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{result.notice}</p>

      {result.credentialExpiries.length > 0 ? (
        <ul className="text-sm">
          {result.credentialExpiries.map((exp) => (
            <li key={exp.key}>
              {exp.label}
              {exp.daysRemaining != null
                ? `: ${exp.daysRemaining} days remaining`
                : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="default"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen((o) => !o)}
      >
        {drawerOpen ? "Hide" : "Review"} missing items
      </Button>

      {drawerOpen ? (
        <div className="space-y-3 border-t pt-3" role="region" aria-label="Shield deficits">
          {missing.length === 0 ? (
            <p className="text-sm">No missing items.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <label className="block text-sm">
            Upload evidence (metadata stub)
            <input
              type="file"
              className="mt-1 block w-full text-sm"
              onChange={(e) => void onFileStub(e.target.files?.[0] ?? null)}
            />
          </label>
          {uploadNote ? (
            <p className="text-xs text-muted-foreground" role="status">
              {uploadNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
