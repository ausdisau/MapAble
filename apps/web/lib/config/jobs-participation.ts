function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * CareOS Phase 10 — Jobs and Economic Participation.
 * Participant-controlled employment profiles, transparent matching explanations,
 * and disclosure-gated applications. No employability scoring or auto-rejection.
 */
export const jobsParticipationConfig = {
  enabled: enabled("MAPABLE_JOBS_PARTICIPATION_ENABLED"),
  matchingExplanationsEnabled: enabled(
    "MAPABLE_JOBS_MATCHING_EXPLANATIONS_ENABLED",
  ),
  /** Safety: CareOS must NOT compute employability scores. */
  employabilityScoringEnabled: false,
  /** Safety: CareOS must NOT reject applicants automatically. */
  automaticApplicantRejectionEnabled: false,
  /** Safety: CareOS must NOT infer capability from disability. */
  disabilityInferenceEnabled: false,
  /** Safety: CareOS must NOT rank by productivity. */
  productivityRankingEnabled: false,
} as const;

export type JobsParticipationConfig = typeof jobsParticipationConfig;

export function ensureJobsParticipationEnabled() {
  if (!jobsParticipationConfig.enabled) {
    throw new Error("JOBS_PARTICIPATION_DISABLED");
  }
}

export function ensureMatchingExplanationsEnabled() {
  ensureJobsParticipationEnabled();
  if (!jobsParticipationConfig.matchingExplanationsEnabled) {
    throw new Error("JOBS_MATCHING_EXPLANATIONS_DISABLED");
  }
}
