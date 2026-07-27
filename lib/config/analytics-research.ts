function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * CareOS Phase 14 — Analytics, Research and Evaluation Cloud.
 * Privacy-preserving analytics, governed research exports, and AI evaluation harness.
 */
export const analyticsResearchConfig = {
  analyticsCloudEnabled: enabled("MAPABLE_ANALYTICS_CLOUD_ENABLED"),
  researchGovernanceEnabled: enabled("MAPABLE_RESEARCH_GOVERNANCE_ENABLED"),
  aiEvaluationHarnessEnabled: enabled("MAPABLE_AI_EVALUATION_HARNESS_ENABLED"),
  /** Safety: CareOS must NOT compute participant worthiness scores. */
  participantWorthinessScoreEnabled: false,
  /** Safety: CareOS must NOT compute participant risk scores. */
  participantRiskScoreEnabled: false,
} as const;

export type AnalyticsResearchConfig = typeof analyticsResearchConfig;

export function ensureAnalyticsCloudEnabled() {
  if (!analyticsResearchConfig.analyticsCloudEnabled) {
    throw new Error("ANALYTICS_CLOUD_DISABLED");
  }
}

export function ensureResearchGovernanceEnabled() {
  if (!analyticsResearchConfig.researchGovernanceEnabled) {
    throw new Error("RESEARCH_GOVERNANCE_DISABLED");
  }
}

export function ensureAiEvaluationHarnessEnabled() {
  // Re-read env so CI safety gate can enable harness for the process without
  // requiring module re-import (CareOS O6).
  const enabledNow =
    process.env.MAPABLE_AI_EVALUATION_HARNESS_ENABLED === "true" ||
    analyticsResearchConfig.aiEvaluationHarnessEnabled;
  if (!enabledNow) {
    throw new Error("AI_EVALUATION_HARNESS_DISABLED");
  }
}

export function assertNoParticipantScoring() {
  if (analyticsResearchConfig.participantWorthinessScoreEnabled) {
    throw new Error("PARTICIPANT_WORTHINESS_SCORE_FORBIDDEN");
  }
  if (analyticsResearchConfig.participantRiskScoreEnabled) {
    throw new Error("PARTICIPANT_RISK_SCORE_FORBIDDEN");
  }
}
