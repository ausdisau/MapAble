"use client";

import { useState } from "react";

import { useIndoorFeatureEnabled } from "@/hooks/useIndoorFeatureFlags";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type OperationalStatusPanelProps = {
  placeId: string;
  venueName: string;
  incidents: Array<{
    id: string;
    incidentType: string;
    description: string;
    trustLevel: string;
    featureId?: string | null;
    reportedAt: string;
    moderationState: string;
  }>;
};

export function OperationalStatusPanel({
  placeId,
  venueName,
  incidents,
}: OperationalStatusPanelProps) {
  const enabled = useIndoorFeatureEnabled("operationalStatus");
  const [reporting, setReporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!enabled) return null;

  async function submitReport(description: string, incidentType: string) {
    setReporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/indoor/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          incidentType,
          description,
          source: "community",
          trustLevel: "community_reported",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data?.error?.message ?? "Could not submit report.");
        return;
      }
      setMessage("Report submitted for review. It will not affect routes until verified.");
    } catch {
      setMessage("Network error. Try again later.");
    } finally {
      setReporting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="status-heading">
      <h3 id="status-heading" className="font-bold text-[#0C1833]">
        Live accessibility status
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Temporary conditions at {venueName}. Unverified reports are labelled and may expire.
      </p>

      {incidents.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No active status reports for this venue.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {incidents.map((inc) => (
            <li
              key={inc.id}
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            >
              <p className="font-semibold">{inc.incidentType.replace(/_/g, " ")}</p>
              <p className="mt-1">{inc.description}</p>
              <p className="mt-1 text-xs">
                {inc.trustLevel.replace(/_/g, " ")} · {inc.moderationState} ·{" "}
                {new Date(inc.reportedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-3">
        <summary className={`cursor-pointer text-sm font-semibold ${mapableCareFocusRing}`}>
          Report a temporary issue
        </summary>
        <form
          className="mt-2 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const description = String(fd.get("description") ?? "");
            const incidentType = String(fd.get("incidentType") ?? "unknown_accessibility_issue");
            if (description.length >= 5) void submitReport(description, incidentType);
          }}
        >
          <label className="block text-sm">
            Issue type
            <select
              name="incidentType"
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            >
              <option value="lift_unavailable">Lift unavailable</option>
              <option value="entrance_closed">Entrance closed</option>
              <option value="accessible_toilet_unavailable">Accessible toilet unavailable</option>
              <option value="corridor_obstructed">Corridor obstructed</option>
              <option value="unknown_accessibility_issue">Other accessibility issue</option>
            </select>
          </label>
          <label className="block text-sm">
            Description
            <textarea
              name="description"
              required
              minLength={5}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Describe what you observed…"
            />
          </label>
          <button
            type="submit"
            disabled={reporting}
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white disabled:opacity-50 ${mapableCareFocusRing}`}
          >
            {reporting ? "Submitting…" : "Submit report"}
          </button>
        </form>
      </details>

      {message ? (
        <p className="mt-2 text-sm text-slate-700" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
