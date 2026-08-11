import {
  DEFAULT_RANKING_WEIGHTS,
  type EliminationSummary,
  type HardConstraints,
  type MatchResult,
  type ProviderCandidate,
  type RankingWeights,
  type ShortlistEntry,
} from "@/lib/ai/navigator/matching/types";

export type RankOptions = {
  constraints?: HardConstraints;
  weights?: RankingWeights;
  shortlistLimit?: number;
  now?: Date;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/** Normalise weights so they sum to 1 (conceptual sum). */
export function normalizeRankingWeights(
  weights: RankingWeights,
): RankingWeights {
  const sum =
    weights.continuity +
    weights.participantPreference +
    weights.verifiedAccessibility +
    weights.travelBurden +
    weights.availability +
    weights.communicationFit;
  if (sum <= 0) {
    return { ...DEFAULT_RANKING_WEIGHTS };
  }
  return {
    continuity: weights.continuity / sum,
    participantPreference: weights.participantPreference / sum,
    verifiedAccessibility: weights.verifiedAccessibility / sum,
    travelBurden: weights.travelBurden / sum,
    availability: weights.availability / sum,
    communicationFit: weights.communicationFit / sum,
  };
}

function scoreContinuity(candidate: ProviderCandidate): number {
  if (candidate.relatedParty || candidate.conflictNotes.length > 0) return 0.2;
  if (candidate.evidenceStatus === "disputed") return 0.1;
  if (candidate.evidenceStatus === "verified") return 0.95;
  if (candidate.evidenceStatus === "community_reported") return 0.7;
  if (candidate.evidenceStatus === "self_reported") return 0.55;
  if (candidate.evidenceStatus === "stale") return 0.3;
  return 0.5;
}

function scoreParticipantPreference(
  candidate: ProviderCandidate,
  constraints?: HardConstraints,
): number {
  if (!constraints) return 0.5;
  const targets = [
    ...(constraints.serviceType ? [constraints.serviceType] : []),
    ...constraints.requiredServices,
  ];
  if (targets.length === 0) return 0.5;
  const hits = targets.filter((t) =>
    candidate.services.some((s) =>
      s.toLowerCase().includes(t.trim().toLowerCase()),
    ),
  ).length;
  return clamp01(hits / targets.length);
}

function scoreVerifiedAccessibility(candidate: ProviderCandidate): number {
  switch (candidate.evidenceStatus) {
    case "verified":
      return 1;
    case "community_reported":
      return 0.7;
    case "self_reported":
      return 0.5;
    case "unknown":
      return 0.35;
    case "stale":
      return 0.2;
    case "disputed":
      return 0.05;
    default: {
      const _exhaustive: never = candidate.evidenceStatus;
      void _exhaustive;
      return 0;
    }
  }
}

function scoreTravelBurden(
  candidate: ProviderCandidate,
  constraints?: HardConstraints,
): number {
  if (!constraints) return 0.5;
  if (
    constraints.postcode &&
    candidate.postcode &&
    candidate.postcode.trim() === constraints.postcode.trim()
  ) {
    return 1;
  }
  if (
    constraints.state &&
    candidate.state &&
    candidate.state.trim().toUpperCase() === constraints.state.trim().toUpperCase()
  ) {
    return 0.65;
  }
  return 0.35;
}

function scoreAvailability(
  candidate: ProviderCandidate,
  now: Date,
): number {
  const ageDays =
    (now.getTime() - candidate.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (Number.isNaN(ageDays) || ageDays < 0) return 0.3;
  if (ageDays <= 30) return 1;
  if (ageDays <= 90) return 0.8;
  if (ageDays <= 180) return 0.6;
  if (ageDays <= 365) return 0.4;
  return 0.15;
}

function scoreCommunicationFit(
  candidate: ProviderCandidate,
  constraints?: HardConstraints,
): number {
  const reqs = constraints?.communicationRequirements ?? [];
  if (reqs.length === 0) return 0.5;
  const hits = reqs.filter((r) =>
    [...candidate.services, ...candidate.conflictNotes].some((s) =>
      s.toLowerCase().includes(r.trim().toLowerCase()),
    ),
  ).length;
  return clamp01(hits / reqs.length);
}

function materialFactorsFor(
  candidate: ProviderCandidate,
  parts: {
    continuity: number;
    participantPreference: number;
    verifiedAccessibility: number;
    travelBurden: number;
    availability: number;
    communicationFit: number;
  },
): string[] {
  const factors: string[] = [];
  const ranked = (
    Object.entries(parts) as Array<[keyof typeof parts, number]>
  ).sort((a, b) => b[1] - a[1]);

  for (const [key, value] of ranked.slice(0, 3)) {
    switch (key) {
      case "continuity":
        factors.push(`Continuity signal ${value.toFixed(2)}`);
        break;
      case "participantPreference":
        factors.push(`Preference fit ${value.toFixed(2)}`);
        break;
      case "verifiedAccessibility":
        factors.push(`Accessibility evidence ${candidate.evidenceStatus}`);
        break;
      case "travelBurden":
        factors.push(`Travel burden score ${value.toFixed(2)}`);
        break;
      case "availability":
        factors.push(`Directory freshness ${value.toFixed(2)}`);
        break;
      case "communicationFit":
        factors.push(`Communication fit ${value.toFixed(2)}`);
        break;
      default: {
        const _exhaustive: never = key;
        void _exhaustive;
        break;
      }
    }
  }

  if (candidate.sponsored) {
    factors.push("Sponsored listing — labelled, not used for eligibility");
  }

  return factors;
}

/**
 * Stage 2 — rank ONLY eligible candidates. Sponsored never changes eligibility;
 * if a sponsored provider appears, it is labelled in materialFactors.
 * No complexity / risk / desirability scores.
 */
export function rankEligibleProviders(
  eligible: ProviderCandidate[],
  options: RankOptions = {},
): { shortlist: ShortlistEntry[]; weightsUsed: RankingWeights } {
  const weightsUsed = normalizeRankingWeights(
    options.weights ?? DEFAULT_RANKING_WEIGHTS,
  );
  const now = options.now ?? new Date();
  const limit = Math.min(Math.max(options.shortlistLimit ?? 10, 1), 20);

  const scored: ShortlistEntry[] = eligible.map((provider) => {
    const parts = {
      continuity: scoreContinuity(provider),
      participantPreference: scoreParticipantPreference(
        provider,
        options.constraints,
      ),
      verifiedAccessibility: scoreVerifiedAccessibility(provider),
      travelBurden: scoreTravelBurden(provider, options.constraints),
      availability: scoreAvailability(provider, now),
      communicationFit: scoreCommunicationFit(provider, options.constraints),
    };

    const score = clamp01(
      parts.continuity * weightsUsed.continuity +
        parts.participantPreference * weightsUsed.participantPreference +
        parts.verifiedAccessibility * weightsUsed.verifiedAccessibility +
        parts.travelBurden * weightsUsed.travelBurden +
        parts.availability * weightsUsed.availability +
        parts.communicationFit * weightsUsed.communicationFit,
    );

    return {
      provider,
      score,
      materialFactors: materialFactorsFor(provider, parts),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.provider.name.localeCompare(b.provider.name);
  });

  return { shortlist: scored.slice(0, limit), weightsUsed };
}

/**
 * Allowlisted tool name `preference_rank` — pure ranking over an eligible set.
 */
export function preferenceRank(
  eligible: ProviderCandidate[],
  options: RankOptions = {},
): { shortlist: ShortlistEntry[]; weightsUsed: RankingWeights } {
  return rankEligibleProviders(eligible, options);
}

export function buildMatchResult(input: {
  eligible: ProviderCandidate[];
  eliminationSummary: EliminationSummary;
  constraints?: HardConstraints;
  weights?: RankingWeights;
  shortlistLimit?: number;
  now?: Date;
  extraLimitations?: string[];
}): MatchResult {
  const limitations = [
    "Hard constraints are never relaxed.",
    "Scores exclude complexity, risk, and desirability proxies.",
    "Sponsored status does not change eligibility.",
    ...(input.extraLimitations ?? []),
  ];

  if (input.eligible.length === 0) {
    return {
      status: "NO_SAFE_MATCH",
      eliminatedByConstraint: input.eliminationSummary,
      shortlist: [],
      weightsUsed: normalizeRankingWeights(
        input.weights ?? DEFAULT_RANKING_WEIGHTS,
      ),
      limitations,
    };
  }

  const { shortlist, weightsUsed } = rankEligibleProviders(input.eligible, {
    constraints: input.constraints,
    weights: input.weights,
    shortlistLimit: input.shortlistLimit,
    now: input.now,
  });

  return {
    status: "eligible_shortlist",
    eliminatedByConstraint: input.eliminationSummary,
    shortlist,
    weightsUsed,
    limitations,
  };
}
