import type { AccessEvidenceClass } from "@/lib/access-intelligence-next";
import { DEFAULT_TEMPORAL_TTL_DAYS } from "@/lib/access-intelligence-next";

import type { AccessCastEvidenceItem, AccessCastForecastHorizon } from "./types";

export function resolveHorizon(
  intendedJourneyTime: string,
  nowIso: string,
): AccessCastForecastHorizon {
  const intended = new Date(intendedJourneyTime).getTime();
  const now = new Date(nowIso).getTime();
  const deltaMs = intended - now;
  const minutes = deltaMs / (60 * 1000);
  const hours = minutes / 60;
  const days = hours / 24;

  if (minutes <= 30) return "nowcast";
  if (hours <= 4) return "near_term";
  if (hours <= 24) return "day_outlook";
  if (days <= 14) return "planning_outlook";
  return "long_range";
}

export function isEvidenceStale(
  observedAt: string,
  ontologyConceptId: string | undefined,
  nowIso: string,
): boolean {
  const ttlDays = ontologyConceptId
    ? (DEFAULT_TEMPORAL_TTL_DAYS[ontologyConceptId] ?? 30)
    : 30;
  const observed = new Date(observedAt).getTime();
  const now = new Date(nowIso).getTime();
  const ageDays = (now - observed) / (24 * 60 * 60 * 1000);
  return ageDays > ttlDays;
}

export function buildEvidenceItem(input: {
  evidenceId: string;
  class: AccessEvidenceClass;
  ontologyConceptId?: string;
  source: string;
  observedAt: string;
  summary: string;
  limitations?: string[];
  nowIso: string;
}): AccessCastEvidenceItem {
  const stale = isEvidenceStale(input.observedAt, input.ontologyConceptId, input.nowIso);
  return {
    evidenceId: input.evidenceId,
    class: input.class,
    ontologyConceptId: input.ontologyConceptId,
    source: input.source,
    observedAt: input.observedAt,
    summary: input.summary,
    limitations: input.limitations ?? [],
    stale,
  };
}

export function confidenceHorizonIso(
  intendedJourneyTime: string,
  horizon: AccessCastForecastHorizon,
): string {
  const intended = new Date(intendedJourneyTime);
  switch (horizon) {
    case "nowcast":
      intended.setMinutes(intended.getMinutes() - 15);
      break;
    case "near_term":
      intended.setHours(intended.getHours() - 1);
      break;
    case "day_outlook":
      intended.setHours(intended.getHours() - 1);
      break;
    case "planning_outlook":
      intended.setDate(intended.getDate() - 1);
      break;
    case "long_range":
      // Long-range: confidence horizon is generation time only — no operational prediction
      return new Date().toISOString();
    default: {
      const _exhaustive: never = horizon;
      return _exhaustive;
    }
  }
  return intended.toISOString();
}

export function forecastExpiryIso(
  generatedAt: string,
  horizon: AccessCastForecastHorizon,
): string {
  const g = new Date(generatedAt);
  switch (horizon) {
    case "nowcast":
      g.setMinutes(g.getMinutes() + 30);
      break;
    case "near_term":
      g.setHours(g.getHours() + 2);
      break;
    case "day_outlook":
      g.setHours(g.getHours() + 6);
      break;
    case "planning_outlook":
      g.setDate(g.getDate() + 1);
      break;
    case "long_range":
      g.setDate(g.getDate() + 7);
      break;
    default: {
      const _exhaustive: never = horizon;
      return _exhaustive;
    }
  }
  return g.toISOString();
}
