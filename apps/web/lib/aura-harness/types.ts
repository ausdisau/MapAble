/** AURA Agentic Risk Harness — core types (product-agent MVP). */

export type RiskDimensionId =
  | "accountability"
  | "transparency"
  | "fairness"
  | "privacy"
  | "human_oversight"
  | "accessibility_representation"
  | "medical_data_exposure"
  | "capability_dependence"
  | "irreversibility"
  | "cascading_impact";

export interface RiskDimension {
  id: RiskDimensionId;
  /** Contextual importance (w_c,d). */
  weight: number;
  /** Semantic evaluation score s_c,d on 0–100 (higher = more risk). */
  score: number;
}

export interface ActionContext {
  contextId: string;
  targetTool: string;
  dimensions: RiskDimension[];
}

export interface AuraRiskProfile {
  actionId: string;
  rawGamma: number;
  normalizedGamma: number;
  variance: number;
  concentrationCoeff: number;
  requiresHITL: boolean;
  highGamma: boolean;
  highConcentration: boolean;
}

export type MitigationActionType =
  | "BLOCK"
  | "MASK_PII"
  | "REQUIRE_APPROVAL"
  | "REDUCE_SCOPE";

export interface MitigationStrategy {
  strategyId: string;
  actionType: MitigationActionType;
  targetFields?: string[];
}

export type PolicyAction = "APPROVE" | "MITIGATE" | "DENY" | "REQUIRE_HITL";

export type MemoryDecision =
  | "APPROVED"
  | "MITIGATED"
  | "DENIED"
  | "HITL_APPROVED"
  | "HITL_REJECTED";

export type HarnessOutcome =
  | "APPROVED"
  | "MITIGATED"
  | "DENIED"
  | "HITL_PENDING";

export interface HarnessDecision {
  outcome: HarnessOutcome;
  policyAction: PolicyAction;
  profile: AuraRiskProfile;
  mitigation?: MitigationStrategy | null;
  reason: string;
  guardrailIds: string[];
  /** Args after mitigation (if any); undefined when blocked. */
  safeArgs?: unknown;
  /** Recognise-layer autonomy + accreditation summary (audit). */
  recognise?: {
    autonomy: {
      capabilityDependence: number;
      irreversibility: number;
      cascadingImpact: number;
    };
    accreditationTier?: string | null;
    evaluatorIds: string[];
  };
}

export interface HarnessToolEvaluation {
  toolName: string;
  decision: HarnessDecision;
  fingerprint: string;
}

export interface HarnessSessionSummary {
  maxNormalizedGamma: number;
  maxConcentrationCoeff: number;
  requiresHITL: boolean;
  anyDenied: boolean;
  guardrails: string[];
  evaluations: Array<{
    toolName: string;
    outcome: HarnessOutcome;
    normalizedGamma: number;
    concentrationCoeff: number;
    reason: string;
    recognise?: HarnessDecision["recognise"];
  }>;
}

export type AgentRiskTierMapping = "low" | "medium" | "high" | "critical";
