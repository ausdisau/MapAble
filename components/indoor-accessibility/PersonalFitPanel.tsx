"use client";

import { useMemo, useState } from "react";

import { useIndoorFeatureEnabled } from "@/hooks/useIndoorFeatureFlags";
import type { FloorPlanFeature } from "@/lib/floor-plan/schemas";
import { evaluateIndoorFit } from "@/lib/indoor-accessibility/fit/indoor-fit-engine";
import {
  DEFAULT_INDOOR_PREFERENCES,
  type IndoorAccessPreferences,
} from "@/lib/indoor-accessibility/fit/types";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type PersonalFitPanelProps = {
  features: FloorPlanFeature[];
  incidents?: Array<{ featureId?: string | null; operationalStatus: string }>;
};

const PREFERENCE_FIELDS: Array<{
  key: keyof IndoorAccessPreferences;
  label: string;
}> = [
  { key: "stepFreeRequired", label: "Step-free route required" },
  { key: "wheelchairUser", label: "Wheelchair user" },
  { key: "powerchairUser", label: "Power wheelchair" },
  { key: "accessibleToiletRequired", label: "Accessible toilet required" },
  { key: "changingPlacesRequired", label: "Changing Places required" },
  { key: "quietSpaceRequired", label: "Quiet or low-sensory space" },
  { key: "hearingLoopNeeded", label: "Hearing loop needed" },
  { key: "lowSensoryNeeded", label: "Low-sensory route preferred" },
];

export function PersonalFitPanel({ features, incidents = [] }: PersonalFitPanelProps) {
  const enabled = useIndoorFeatureEnabled("personalAccessibilityFit");
  const [prefs, setPrefs] = useState<IndoorAccessPreferences>(DEFAULT_INDOOR_PREFERENCES);
  const [evaluated, setEvaluated] = useState(false);

  const result = useMemo(() => {
    if (!evaluated) return null;
    return evaluateIndoorFit(prefs, features, incidents);
  }, [evaluated, prefs, features, incidents]);

  if (!enabled) return null;

  function togglePref(key: keyof IndoorAccessPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setEvaluated(false);
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="fit-heading">
      <h3 id="fit-heading" className="font-bold text-[#0C1833]">
        Personal accessibility fit
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Compare recorded venue features with your functional access preferences. No diagnosis is
        required. Preferences are not saved unless you choose to save a profile elsewhere.
      </p>

      <fieldset className="mt-3 space-y-2">
        <legend className="sr-only">Access preferences for this visit</legend>
        {PREFERENCE_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(prefs[key])}
              onChange={() => togglePref(key)}
              className="size-5"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className={`mt-3 min-h-11 w-full rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
        onClick={() => setEvaluated(true)}
      >
        Evaluate fit for this floor
      </button>

      {result ? (
        <div className="mt-4 space-y-2" role="status">
          <p className="text-sm font-semibold text-[#0C1833]">{result.summary}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Result: {result.result.replace(/_/g, " ")}
          </p>
          {result.reasons.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {result.reasons.map((reason, i) => (
                <li key={`${reason.requirement}-${i}`}>
                  {reason.requirement}
                  {reason.recordedValue ? ` — ${reason.recordedValue}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
