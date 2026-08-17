import type { AccessAccreditationTier } from "@prisma/client";

import type { PolicyAction } from "@/lib/aura-harness/types";

/** AURA autonomy criteria (Recognise layer) — scores 0–100, higher = more risk. */
export type AutonomyCriteriaScores = {
  capabilityDependence: number;
  irreversibility: number;
  cascadingImpact: number;
};

export type AccreditationTierHint = {
  totalScore: number;
  tier: AccessAccreditationTier;
  /** Risk contribution applied to accessibility_representation when tier is weak. */
  accessibilityRiskScore: number;
};

export type RecogniseEvaluation = {
  autonomy: AutonomyCriteriaScores;
  accreditation?: AccreditationTierHint | null;
  /** Evaluators that contributed (for audit). */
  evaluatorIds: string[];
  /** Optional policy override hint when autonomy is extreme. */
  policyHint?: PolicyAction | null;
  reason?: string;
};

export interface RiskCriterionEvaluator {
  id: string;
  evaluate(input: {
    toolName: string;
    payload: unknown;
  }): Promise<Partial<AutonomyCriteriaScores>> | Partial<AutonomyCriteriaScores>;
}
