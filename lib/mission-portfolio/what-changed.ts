import { adaptWhatChanged } from "@/lib/adaptive-access";
import { missionPortfolioConfig } from "@/lib/config/mission-portfolio";

import type { SharedMissionProjection } from "./types";

export type WhatChangedEntry = {
  dependencyId: string;
  label: string;
  fromState: string;
  toState: string;
  responsibleParty: string;
};

/**
 * Diff two mission projections for participant-facing What Changed.
 * Deterministic — no model inference.
 */
export function diffMissionProjections(
  previous: SharedMissionProjection | null,
  current: SharedMissionProjection
): WhatChangedEntry[] {
  if (!missionPortfolioConfig.whatChangedEnabled) return [];
  if (!previous) {
    return current.dependencies.map((d) => ({
      dependencyId: d.id,
      label: d.label,
      fromState: "not_started",
      toState: d.state,
      responsibleParty: d.responsibleParty,
    }));
  }

  const prevById = new Map(previous.dependencies.map((d) => [d.id, d]));
  const changes: WhatChangedEntry[] = [];
  for (const dep of current.dependencies) {
    const prior = prevById.get(dep.id);
    const fromState = prior?.state ?? "not_started";
    if (fromState !== dep.state) {
      changes.push({
        dependencyId: dep.id,
        label: dep.label,
        fromState,
        toState: dep.state,
        responsibleParty: dep.responsibleParty,
      });
    }
  }
  return changes;
}

/**
 * Optional Adaptive Access presentation hint for What Changed.
 * Diff content is unchanged — only presentation metadata when runtime flags are on.
 */
export function presentWhatChangedEntries(entries: WhatChangedEntry[]) {
  const presentation = adaptWhatChanged({ profile: null });
  return {
    entries,
    presentation,
  };
}
