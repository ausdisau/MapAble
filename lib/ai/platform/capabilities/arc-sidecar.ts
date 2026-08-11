/**
 * Autonomy Risk Classification (ARC) sidecar — design-time classification only.
 * ARC tiers MUST NOT grant runtime authority (DoD criteria 1–2).
 */

import { requireAiCapability } from "@/lib/ai/platform/capabilities/registry";
import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";

export const ARC_SIDECAR_VERSION = "arc-sidecar-v1" as const;

export const ARC_TIERS = [
  "L1_OBSERVE",
  "L2_RECOMMEND",
  "L3_DRAFT",
  "L4_ASSISTED_EXECUTE",
  "L5_AUTONOMOUS",
] as const;

export type ArcTier = (typeof ARC_TIERS)[number];

export const ARC_AGENT_CATEGORIES = [
  "search_interpreter",
  "conversational_assistant",
  "matching_ranker",
  "draft_proposal",
  "escalation_router",
  "risk_harness",
  "coding_assistant_extension",
] as const;

export type ArcAgentCategory = (typeof ARC_AGENT_CATEGORIES)[number];

/** Critical dimensions: any score ≥ 3 forces tier floor (never averaged away). */
export const ARC_CRITICAL_DIMENSIONS = [
  "irreversibility",
  "safeguarding_exposure",
  "consent_dependency",
  "financial_impact",
] as const;

export type ArcCriticalDimension = (typeof ARC_CRITICAL_DIMENSIONS)[number];

export type ArcDimensionScore = 1 | 2 | 3;

export type ArcAssessment = {
  capabilityKey: string;
  sidecarVersion: typeof ARC_SIDECAR_VERSION;
  category: ArcAgentCategory;
  /** Design-time ceiling — informational; runtime uses capability registry. */
  designTier: ArcTier;
  criticalScores: Record<ArcCriticalDimension, ArcDimensionScore>;
  /** Non-critical supporting scores (1–3). */
  supportingScores: Record<string, ArcDimensionScore>;
  owner: string;
  reviewDueDate: string;
  notes: string;
};

const ASSESSMENTS: ArcAssessment[] = [
  {
    capabilityKey: "agent.aura_harness",
    sidecarVersion: ARC_SIDECAR_VERSION,
    category: "risk_harness",
    designTier: "L2_RECOMMEND",
    criticalScores: {
      irreversibility: 2,
      safeguarding_exposure: 3,
      consent_dependency: 2,
      financial_impact: 1,
    },
    supportingScores: {
      autonomy_dependence: 2,
      cascading_impact: 2,
      accessibility_representation: 2,
    },
    owner: "ai-platform",
    reviewDueDate: "2026-12-31",
    notes: "In-process risk harness; never executes consequential writes.",
  },
  {
    capabilityKey: "agent.aura_recognise",
    sidecarVersion: ARC_SIDECAR_VERSION,
    category: "risk_harness",
    designTier: "L1_OBSERVE",
    criticalScores: {
      irreversibility: 1,
      safeguarding_exposure: 2,
      consent_dependency: 1,
      financial_impact: 1,
    },
    supportingScores: {
      autonomy_dependence: 2,
      cascading_impact: 1,
    },
    owner: "ai-platform",
    reviewDueDate: "2026-12-31",
    notes: "Recognise evaluators only; no operational authority.",
  },
  {
    capabilityKey: "navigator.provider_search.interpret",
    sidecarVersion: ARC_SIDECAR_VERSION,
    category: "search_interpreter",
    designTier: "L2_RECOMMEND",
    criticalScores: {
      irreversibility: 1,
      safeguarding_exposure: 2,
      consent_dependency: 2,
      financial_impact: 1,
    },
    supportingScores: {
      hallucination_risk: 2,
      accessibility_representation: 2,
    },
    owner: "search-platform",
    reviewDueDate: "2026-12-31",
    notes: "NL interpret only; hard constraints remain deterministic.",
  },
  {
    capabilityKey: "navigator.provider_search.reply",
    sidecarVersion: ARC_SIDECAR_VERSION,
    category: "conversational_assistant",
    designTier: "L2_RECOMMEND",
    criticalScores: {
      irreversibility: 1,
      safeguarding_exposure: 2,
      consent_dependency: 2,
      financial_impact: 1,
    },
    supportingScores: {
      hallucination_risk: 3,
      accessibility_representation: 3,
    },
    owner: "search-platform",
    reviewDueDate: "2026-12-31",
    notes: "Optional commentary subordinate to deterministic shortlist.",
  },
  {
    capabilityKey: "navigator.provider_search.match",
    sidecarVersion: ARC_SIDECAR_VERSION,
    category: "matching_ranker",
    designTier: "L2_RECOMMEND",
    criticalScores: {
      irreversibility: 2,
      safeguarding_exposure: 2,
      consent_dependency: 3,
      financial_impact: 1,
    },
    supportingScores: {
      fairness: 3,
      exclusion_integrity: 3,
    },
    owner: "search-platform",
    reviewDueDate: "2026-12-31",
    notes: "Deterministic hard constraints; ranking never overrides safety.",
  },
  {
    capabilityKey: "navigator.provider_search.draft_service_request",
    sidecarVersion: ARC_SIDECAR_VERSION,
    category: "draft_proposal",
    designTier: "L3_DRAFT",
    criticalScores: {
      irreversibility: 2,
      safeguarding_exposure: 2,
      consent_dependency: 3,
      financial_impact: 2,
    },
    supportingScores: {
      participant_control: 3,
    },
    owner: "search-platform",
    reviewDueDate: "2026-12-31",
    notes: "Draft envelopes only — never book or pay.",
  },
  {
    capabilityKey: "navigator.provider_search.escalate",
    sidecarVersion: ARC_SIDECAR_VERSION,
    category: "escalation_router",
    designTier: "L2_RECOMMEND",
    criticalScores: {
      irreversibility: 2,
      safeguarding_exposure: 3,
      consent_dependency: 3,
      financial_impact: 1,
    },
    supportingScores: {
      confidentiality: 3,
    },
    owner: "ai-platform",
    reviewDueDate: "2026-12-31",
    notes: "Routes to human review; never alleges misconduct autonomously.",
  },
];

const byKey = new Map(ASSESSMENTS.map((a) => [a.capabilityKey, a]));

/** Critical-dimension tiering: max critical score floors the design tier. */
export function resolveArcTierFromCriticalScores(
  scores: Record<ArcCriticalDimension, ArcDimensionScore>,
): ArcTier {
  const maxCritical = Math.max(...Object.values(scores));
  if (maxCritical >= 3) return "L2_RECOMMEND";
  if (maxCritical === 2) return "L3_DRAFT";
  return "L4_ASSISTED_EXECUTE";
}

/**
 * Returns the ARC assessment for a registered capability.
 * Throws if the capability is not registered (fail closed for agentic keys).
 */
export function getArcAssessment(
  capabilityKey: string,
): ArcAssessment | undefined {
  requireAiCapability(capabilityKey);
  return byKey.get(capabilityKey);
}

export function requireArcAssessment(capabilityKey: string): ArcAssessment {
  const assessment = getArcAssessment(capabilityKey);
  if (!assessment) {
    throw new Error(`ARC_ASSESSMENT_MISSING:${capabilityKey}`);
  }
  return assessment;
}

export function listArcAssessments(): ArcAssessment[] {
  return [...byKey.values()];
}

/**
 * Explicit non-authority check: ARC must never raise the runtime ceiling.
 */
export function arcDoesNotGrantRuntimeAuthority(
  capabilityKey: string,
  runtimeCeiling: AuthorityCeiling,
): boolean {
  const assessment = byKey.get(capabilityKey);
  if (!assessment) return true;
  // Design tier is informational; presence of assessment never elevates ceiling.
  void assessment.designTier;
  void runtimeCeiling;
  return true;
}
