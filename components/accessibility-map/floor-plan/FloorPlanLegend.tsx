"use client";

import { getFeatureConfig } from "@/lib/access/floor-plan/feature-config";

export function FloorPlanLegend() {
  const samples = [
    "accessible_entrance",
    "lift",
    "accessible_toilet",
    "changing_places",
    "quiet_room",
    "temporary_barrier",
  ] as const;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 text-xs" role="group" aria-label="Floor plan legend">
      <p className="font-black uppercase tracking-wide text-slate-600">Legend</p>
      <ul className="mt-2 space-y-1.5">
        {samples.map((type) => {
          const config = getFeatureConfig(type);
          return (
            <li key={type} className="flex items-center gap-2">
              <span className={`fp-marker fp-marker-btn ${config.markerClass}`} aria-hidden="true">
                <span className="fp-marker__icon">{config.icon}</span>
                <span className="fp-marker__label">{config.shortLabel}</span>
              </span>
              <span>{config.label}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[10px] text-slate-500">
        Icons and labels indicate feature type. Status uses text badges, not colour alone.
      </p>
    </div>
  );
}
