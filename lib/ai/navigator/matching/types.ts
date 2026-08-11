import { z } from "zod";

/**
 * Stage-1 hard constraints for Navigator provider matching.
 * Never relaxed by the ranker or model commentary.
 */
export const hardConstraintsSchema = z
  .object({
    serviceType: z.string().min(1).max(200).optional(),
    state: z.string().min(1).max(10).optional(),
    postcode: z.string().min(1).max(12).optional(),
    requiredServices: z.array(z.string().min(1).max(200)).max(50).default([]),
    exclusions: z.array(z.string().min(1).max(200)).max(100).default([]),
    communicationRequirements: z
      .array(z.string().min(1).max(200))
      .max(30)
      .default([]),
    accessibilityRequirements: z
      .array(z.string().min(1).max(200))
      .max(30)
      .default([]),
    credentialRequirements: z
      .array(z.string().min(1).max(200))
      .max(30)
      .default([]),
    /** Eliminate candidates whose updatedAt is older than this many days. */
    requireFreshnessDays: z.number().int().positive().max(3650).optional(),
    /** When true, sponsored listings are eliminated at Stage 1. */
    excludeSponsoredOnly: z.boolean().optional(),
  })
  .strict();

export type HardConstraints = z.infer<typeof hardConstraintsSchema>;

/**
 * Stage-2 ranking weights (0–1 each). Ranker normalises to sum to 1.
 *
 * DEFAULT_RANKING_WEIGHTS_RATIONALE:
 * - continuity (0.2): prefer providers with stable, non-conflicted records
 * - participantPreference (0.25): honour stated service/fit preferences
 * - verifiedAccessibility (0.2): elevate verified accessibility evidence
 * - travelBurden (0.15): prefer closer geography when known
 * - availability (0.1): prefer fresher directory updates as a weak proxy
 * - communicationFit (0.1): prefer communication requirement coverage
 * Weights are participant-editable; sponsored status never affects eligibility.
 */
export const rankingWeightsSchema = z
  .object({
    continuity: z.number().min(0).max(1),
    participantPreference: z.number().min(0).max(1),
    verifiedAccessibility: z.number().min(0).max(1),
    travelBurden: z.number().min(0).max(1),
    availability: z.number().min(0).max(1),
    communicationFit: z.number().min(0).max(1),
  })
  .strict();

export type RankingWeights = z.infer<typeof rankingWeightsSchema>;

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  continuity: 0.2,
  participantPreference: 0.25,
  verifiedAccessibility: 0.2,
  travelBurden: 0.15,
  availability: 0.1,
  communicationFit: 0.1,
};

export const DEFAULT_RANKING_WEIGHTS_RATIONALE =
  "Defaults balance participant preference and verified accessibility first, then continuity and travel burden, with weaker availability/communication proxies. Sponsored status never changes eligibility; weights are editable and normalised at rank time." as const;

export const evidenceStatusSchema = z.enum([
  "unknown",
  "self_reported",
  "community_reported",
  "verified",
  "stale",
  "disputed",
]);

export type EvidenceStatus = z.infer<typeof evidenceStatusSchema>;

export const providerCandidateSchema = z
  .object({
    id: z.string().min(1).max(200),
    name: z.string().min(1).max(500),
    suburb: z.string().max(200).nullable(),
    state: z.string().max(10).nullable(),
    postcode: z.string().max(12).nullable(),
    services: z.array(z.string()).default([]),
    registrationGroups: z.array(z.string()).default([]),
    updatedAt: z.coerce.date(),
    evidenceStatus: evidenceStatusSchema,
    sponsored: z.boolean().optional(),
    relatedParty: z.boolean().optional(),
    conflictNotes: z.array(z.string().max(500)).default([]),
  })
  .strict();

export type ProviderCandidate = z.infer<typeof providerCandidateSchema>;

export const eliminationCategorySchema = z.enum([
  "service_type",
  "geography",
  "exclusion",
  "freshness",
  "accessibility",
  "communication",
  "credential",
  "sponsored_policy",
]);

export type EliminationCategory = z.infer<typeof eliminationCategorySchema>;

export const shortlistEntrySchema = z
  .object({
    provider: providerCandidateSchema,
    score: z.number().min(0).max(1),
    materialFactors: z.array(z.string().max(300)).max(20),
  })
  .strict();

export type ShortlistEntry = z.infer<typeof shortlistEntrySchema>;

export const matchStatusSchema = z.enum([
  "eligible_shortlist",
  "NO_SAFE_MATCH",
]);

export type MatchStatus = z.infer<typeof matchStatusSchema>;

export const eliminationSummarySchema = z.record(
  eliminationCategorySchema,
  z.number().int().nonnegative(),
);

export type EliminationSummary = Partial<
  Record<EliminationCategory, number>
>;

export const matchResultSchema = z
  .object({
    status: matchStatusSchema,
    /** Counts by elimination category only — no sensitive participant detail. */
    eliminatedByConstraint: eliminationSummarySchema,
    shortlist: z.array(shortlistEntrySchema).max(20),
    weightsUsed: rankingWeightsSchema,
    limitations: z.array(z.string().max(500)).max(30),
  })
  .strict();

export type MatchResult = Omit<
  z.infer<typeof matchResultSchema>,
  "eliminatedByConstraint"
> & {
  eliminatedByConstraint: EliminationSummary;
};
