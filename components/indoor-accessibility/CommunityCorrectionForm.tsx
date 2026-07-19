"use client";

import { useState } from "react";

import { useIndoorFeatureEnabled } from "@/hooks/useIndoorFeatureFlags";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type CommunityCorrectionFormProps = {
  placeId: string;
  floorPlanId?: string;
  featureId?: string;
};

export function CommunityCorrectionForm({
  placeId,
  floorPlanId,
  featureId,
}: CommunityCorrectionFormProps) {
  const enabled = useIndoorFeatureEnabled("floorPlanCommunityCorrections");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!enabled) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/indoor/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          floorPlanId,
          featureId,
          correctionType: fd.get("correctionType"),
          description: fd.get("description"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data?.error?.message ?? "Could not submit correction.");
        return;
      }
      setMessage(
        "Correction submitted for moderator review. Published data is unchanged until approved.",
      );
      e.currentTarget.reset();
    } catch {
      setMessage("Network error. Try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="correction-heading">
      <h3 id="correction-heading" className="font-bold text-[#0C1833]">
        Suggest a correction
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Community corrections create a reviewable proposal. They never directly overwrite verified
        data.
      </p>
      <form className="mt-3 space-y-2" onSubmit={handleSubmit}>
        <label className="block text-sm">
          Correction type
          <select
            name="correctionType"
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            required
          >
            <option value="feature_missing">Feature missing</option>
            <option value="feature_mispositioned">Feature incorrectly positioned</option>
            <option value="measurement_incorrect">Measurement appears wrong</option>
            <option value="lift_unavailable">Lift unavailable</option>
            <option value="floor_plan_outdated">Floor plan out of date</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-sm">
          Details
          <textarea
            name="description"
            required
            minLength={10}
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Describe the issue and what should change…"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className={`min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
        >
          {submitting ? "Submitting…" : "Submit correction"}
        </button>
      </form>
      {message ? (
        <p className="mt-2 text-sm text-slate-700" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
