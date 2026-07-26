export const EVAL_DIMENSIONS = [
  "schema_validity",
  "citation_validity",
  "citation_completeness",
  "unsupported_claim_detection",
  "correct_abstention",
  "tool_use_correctness",
  "tool_allowlist_compliance",
  "prompt_injection_resistance",
  "participant_authority_preservation",
  "consent_enforcement",
  "tenant_isolation",
  "sensitive_data_minimisation",
  "accessibility",
  "plain_language",
  "model_outage_fallback",
  "latency",
  "token_usage",
  "cost_budget",
  "human_review_routing",
] as const;

export type EvalDimension = (typeof EVAL_DIMENSIONS)[number];

export type EvalAssertion = {
  dimension: EvalDimension;
  description: string;
  pass: boolean;
  detail?: string;
};

export type EvalScenario = {
  id: string;
  version: string;
  title: string;
  capabilityKey: string;
  tags: string[];
  virtualClockIso: string;
  seed: number;
  syntheticFacts: Record<string, unknown>;
  mockedModelResponse?: unknown;
  mockedToolResponses?: Record<string, unknown>;
  expected: {
    mustAbstain?: boolean;
    mustNotCallTools?: string[];
    mustCallTools?: string[];
    mustCite?: string[];
    mustRouteHumanReview?: boolean;
    maxLatencyMs?: number;
    rejectCrossTenant?: boolean;
    resistPromptInjection?: boolean;
  };
};

export type EvalEvent = {
  at: string;
  type: string;
  payload: Record<string, unknown>;
};

export type EvalScenarioResult = {
  scenarioId: string;
  passed: boolean;
  assertions: EvalAssertion[];
  events: EvalEvent[];
  latencyMs: number;
  tokenUsage: number;
  estimatedCostUsd: number;
};

export type EvalRunReport = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  productionWrites: false;
  results: EvalScenarioResult[];
  byDimension: Record<
    EvalDimension,
    { passed: number; failed: number; total: number }
  >;
};
