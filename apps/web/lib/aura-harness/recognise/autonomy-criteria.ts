import { clampScore } from "@/lib/aura-harness/dimensions";
import type {
  AutonomyCriteriaScores,
  RiskCriterionEvaluator,
} from "@/lib/aura-harness/recognise/types";

const DESTROY_PATTERN =
  /(^|[^a-z])(delete|purge|drop|wipe|destroy|hard.?delete|remove.?permanently)([^a-z]|$)/i;

const PUBLISH_PATTERN =
  /(^|[^a-z])(publish|public|broadcast|post_to_map|dispatch|book|pay|assign)([^a-z]|$)/i;

const BATCH_PATTERN =
  /(batch|bulk|allParticipants|fleet|mass.?update|cascade)/i;

const CLINICAL_JUDGMENT_PATTERN =
  /(diagnos|clinical|capacity|eligibility|safeguard|restrictive.?practice|medication|dosage)/i;

const ROUTINE_READ_TOOLS = new Set([
  "searchNdisProviders",
  "interpretFinderQuery",
  "geocodeLocation",
  "explainProvider",
  "searchBookings",
  "getBookingContext",
  "explainBookingStatus",
]);

function payloadBlob(payload: unknown): string {
  try {
    return JSON.stringify(payload ?? {});
  } catch {
    return "";
  }
}

/** Default Capability-Dependence evaluator. */
export const capabilityDependenceEvaluator: RiskCriterionEvaluator = {
  id: "aura.capability_dependence",
  evaluate({ toolName, payload }) {
    const blob = `${toolName} ${payloadBlob(payload)}`;
    if (ROUTINE_READ_TOOLS.has(toolName)) return { capabilityDependence: 12 };
    // Align with semantic destroy floor so High/Low DENY stays uniform.
    if (DESTROY_PATTERN.test(blob)) return { capabilityDependence: 90 };
    let score = 25;
    if (CLINICAL_JUDGMENT_PATTERN.test(blob)) score = Math.max(score, 92);
    if (PUBLISH_PATTERN.test(blob)) score = Math.max(score, 70);
    return { capabilityDependence: clampScore(score) };
  },
};

/** Default Irreversibility evaluator. */
export const irreversibilityEvaluator: RiskCriterionEvaluator = {
  id: "aura.irreversibility",
  evaluate({ toolName, payload }) {
    const blob = `${toolName} ${payloadBlob(payload)}`;
    if (ROUTINE_READ_TOOLS.has(toolName)) return { irreversibility: 12 };
    if (DESTROY_PATTERN.test(blob)) return { irreversibility: 90 };
    let score = 20;
    if (PUBLISH_PATTERN.test(blob)) score = Math.max(score, 75);
    if (/pay|transfer|invoice|claim/i.test(blob)) score = Math.max(score, 88);
    return { irreversibility: clampScore(score) };
  },
};

/** Default Cascading Impact evaluator. */
export const cascadingImpactEvaluator: RiskCriterionEvaluator = {
  id: "aura.cascading_impact",
  evaluate({ toolName, payload }) {
    const blob = `${toolName} ${payloadBlob(payload)}`;
    if (ROUTINE_READ_TOOLS.has(toolName)) return { cascadingImpact: 12 };
    if (DESTROY_PATTERN.test(blob)) return { cascadingImpact: 90 };
    let score = 22;
    if (BATCH_PATTERN.test(blob)) score = Math.max(score, 90);
    if (PUBLISH_PATTERN.test(blob)) score = Math.max(score, 70);
    if (/cancel|reassign|route.?change|outage/i.test(blob)) {
      score = Math.max(score, 80);
    }
    return { cascadingImpact: clampScore(score) };
  },
};

export const DEFAULT_AUTONOMY_EVALUATORS: RiskCriterionEvaluator[] = [
  capabilityDependenceEvaluator,
  irreversibilityEvaluator,
  cascadingImpactEvaluator,
];

export function mergeAutonomyScores(
  parts: Array<Partial<AutonomyCriteriaScores>>,
): AutonomyCriteriaScores {
  let capabilityDependence = 0;
  let irreversibility = 0;
  let cascadingImpact = 0;
  for (const part of parts) {
    if (part.capabilityDependence != null) {
      capabilityDependence = Math.max(
        capabilityDependence,
        part.capabilityDependence,
      );
    }
    if (part.irreversibility != null) {
      irreversibility = Math.max(irreversibility, part.irreversibility);
    }
    if (part.cascadingImpact != null) {
      cascadingImpact = Math.max(cascadingImpact, part.cascadingImpact);
    }
  }
  return {
    capabilityDependence: clampScore(capabilityDependence),
    irreversibility: clampScore(irreversibility),
    cascadingImpact: clampScore(cascadingImpact),
  };
}
