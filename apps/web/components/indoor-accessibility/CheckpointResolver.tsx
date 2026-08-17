"use client";

import { useState } from "react";

import { useIndoorFeatureEnabled } from "@/hooks/useIndoorFeatureFlags";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type CheckpointResolverProps = {
  onResolved: (payload: {
    checkpointId: string;
    venueId: string;
    floorPlanId: string;
    publicLabel: string;
  }) => void;
};

export function CheckpointResolver({ onResolved }: CheckpointResolverProps) {
  const enabled = useIndoorFeatureEnabled("indoorCheckpoints");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    checkpointId: string;
    venueId: string;
    floorPlanId: string;
    publicLabel: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!enabled) return null;

  async function resolveToken() {
    setLoading(true);
    setError(null);
    setPending(null);
    try {
      const res = await fetch("/api/indoor/checkpoints/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Invalid or expired checkpoint.");
        return;
      }
      setPending(data.checkpoint);
    } catch {
      setError("Could not validate checkpoint.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="checkpoint-heading">
      <h3 id="checkpoint-heading" className="font-bold text-[#0C1833]">
        Scan checkpoint
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Enter a checkpoint code from a MapAble QR label. Your position is set only after you
        confirm. NFC is supported where available; manual entry is always available.
      </p>

      <label className="mt-3 block text-sm">
        Checkpoint token
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
          placeholder="Paste checkpoint code"
        />
      </label>

      <button
        type="button"
        disabled={!token.trim() || loading}
        onClick={() => void resolveToken()}
        className={`mt-2 min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white disabled:opacity-50 ${mapableCareFocusRing}`}
      >
        {loading ? "Validating…" : "Validate checkpoint"}
      </button>

      {error ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {pending ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="font-semibold">{pending.publicLabel}</p>
          <p className="mt-1 text-slate-700">Set this as your current starting point?</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
              onClick={() => onResolved(pending)}
            >
              Confirm starting point
            </button>
            <button
              type="button"
              className={`min-h-11 rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
              onClick={() => setPending(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
