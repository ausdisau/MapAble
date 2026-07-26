import type { AccessEvidenceReference } from "../evidence/envelope";
import { getOntologyConcept } from "../ontology/seed-v1";

import {
  DEFAULT_TEMPORAL_TTL_DAYS,
  type TemporalAccessState,
  type TemporalAccessWindow,
} from "./vocabulary";

export type TemporalEvaluationInput = {
  ontologyConceptId: string;
  evidence: AccessEvidenceReference;
  /** Evaluation instant (ISO). */
  at: string;
  /** Optional override TTL in days. */
  freshnessDays?: number;
  operationalState?: "available" | "unavailable" | "unknown" | null;
  disputed?: boolean;
  supersededBy?: string | null;
};

export type TemporalEvaluationResult = {
  state: TemporalAccessState;
  window: TemporalAccessWindow;
  ageDays: number;
  ttlDays: number;
  isFresh: boolean;
  limitations: string[];
};

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(fromIso);
  const b = Date.parse(toIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Deterministic temporal evaluation. Stale remains stale; unknown remains unknown.
 * Does not invent operational availability from static geometry.
 */
export function evaluateTemporalAccess(input: TemporalEvaluationInput): TemporalEvaluationResult {
  const limitations: string[] = [];
  const concept = getOntologyConcept(input.ontologyConceptId);
  const ttlDays =
    input.freshnessDays ??
    concept?.defaultFreshnessDays ??
    DEFAULT_TEMPORAL_TTL_DAYS[input.ontologyConceptId] ??
    180;

  if (input.supersededBy) {
    return {
      state: "superseded",
      window: {
        state: "superseded",
        validFrom: input.evidence.observedAt,
        validTo: input.at,
        reason: `Superseded by ${input.supersededBy}`,
        ontologyConceptId: input.ontologyConceptId,
      },
      ageDays: daysBetween(input.evidence.observedAt, input.at),
      ttlDays,
      isFresh: false,
      limitations: ["Superseded evidence must not be treated as current"],
    };
  }

  if (input.disputed) {
    return {
      state: "disputed",
      window: {
        state: "disputed",
        validFrom: input.evidence.observedAt,
        validTo: null,
        reason: "Evidence is disputed",
        ontologyConceptId: input.ontologyConceptId,
      },
      ageDays: daysBetween(input.evidence.observedAt, input.at),
      ttlDays,
      isFresh: false,
      limitations: ["Disputed remains disputed until human review"],
    };
  }

  if (input.operationalState === "unavailable") {
    return {
      state: "temporarily_unavailable",
      window: {
        state: "temporarily_unavailable",
        validFrom: input.at,
        validTo: null,
        reason: "Operational state unavailable",
        ontologyConceptId: input.ontologyConceptId,
      },
      ageDays: daysBetween(input.evidence.observedAt, input.at),
      ttlDays,
      isFresh: true,
      limitations: ["Static geometry does not prove current operation"],
    };
  }

  if (
    input.ontologyConceptId === "physical.lift_operational" &&
    (input.operationalState == null || input.operationalState === "unknown")
  ) {
    limitations.push("Lift status requires live or fresh operational evidence");
    return {
      state: "unknown",
      window: {
        state: "unknown",
        validFrom: input.evidence.observedAt,
        validTo: null,
        reason: "Operational status unknown",
        ontologyConceptId: input.ontologyConceptId,
      },
      ageDays: daysBetween(input.evidence.observedAt, input.at),
      ttlDays,
      isFresh: false,
      limitations,
    };
  }

  const ageDays = daysBetween(input.evidence.observedAt, input.at);
  if (ageDays > ttlDays) {
    const state: TemporalAccessState = ageDays > ttlDays * 2 ? "expired" : "stale";
    return {
      state,
      window: {
        state,
        validFrom: input.evidence.observedAt,
        validTo: new Date(Date.parse(input.evidence.observedAt) + ttlDays * 86400000).toISOString(),
        reason: `Evidence age ${ageDays.toFixed(1)}d exceeds TTL ${ttlDays}d`,
        ontologyConceptId: input.ontologyConceptId,
      },
      ageDays,
      ttlDays,
      isFresh: false,
      limitations: ["Stale remains stale — do not silently treat as current"],
    };
  }

  return {
    state: "current",
    window: {
      state: "current",
      validFrom: input.evidence.observedAt,
      validTo: new Date(Date.parse(input.evidence.observedAt) + ttlDays * 86400000).toISOString(),
      reason: "Within feature-specific freshness window",
      ontologyConceptId: input.ontologyConceptId,
    },
    ageDays,
    ttlDays,
    isFresh: true,
    limitations,
  };
}

export type PlaceTemporalOverlay = {
  placeRef: string;
  at: string;
  evaluations: TemporalEvaluationResult[];
  overall: TemporalAccessState;
};

export function fuseTemporalOverlay(
  placeRef: string,
  at: string,
  evaluations: TemporalEvaluationResult[],
): PlaceTemporalOverlay {
  const priority: TemporalAccessState[] = [
    "disputed",
    "temporarily_unavailable",
    "expired",
    "stale",
    "unknown",
    "historically_unreliable",
    "superseded",
    "scheduled",
    "current",
  ];
  let overall: TemporalAccessState = "current";
  for (const state of priority) {
    if (evaluations.some((e) => e.state === state)) {
      overall = state;
      break;
    }
  }
  if (evaluations.length === 0) overall = "unknown";
  return { placeRef, at, evaluations, overall };
}
