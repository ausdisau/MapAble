import { buildDimensions } from "@/lib/aura-harness/dimensions";
import type {
  ActionContext,
  RiskDimensionId,
} from "@/lib/aura-harness/types";

const PII_KEY_PATTERN =
  /(email|phone|mobile|address|full.?name|dob|dateOfBirth|ndisNumber|medicare|ssn|taxFile)/i;

const MEDICAL_KEY_PATTERN =
  /(diagnos|medical|medication|clinical|condition|disability.?type|impairment|health.?note|care.?need|accessRequirements|medicalHistory)/i;

const MEDICAL_VALUE_PATTERN =
  /\b(epilepsy|diabetes|autism|parkinson|cerebral\s+palsy|wheelchair\s+user|insulin|diagnosis|medical\s+history|mental\s+health|catheter|ostomy)\b/i;

const NAME_VALUE_PATTERN = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/;

const DANGEROUS_VERB_PATTERN =
  /(^|[^a-z])(delete|purge|drop|wipe|destroy|hard.?delete|remove.?permanently|exfiltrat|overwrite)([^a-z]|$)/i;

const PUBLISH_PATTERN =
  /(^|[^a-z])(publish|public|broadcast|post_to_map)([^a-z]|$)/i;

const ACCESSIBILITY_NARRATIVE_KEYS =
  /(user_reports|narratives?|personal.?story|lived.?experience|accessNeedsSummary|accessRequirementsSummary)/i;

const ROUTINE_READ_TOOLS = new Set([
  "searchNdisProviders",
  "interpretFinderQuery",
  "geocodeLocation",
  "explainProvider",
  "searchBookings",
  "getBookingContext",
  "explainBookingStatus",
]);

/** Uniform baseline keeps C_conc near zero for routine traffic. */
const ROUTINE_BASELINE = 12;
const ELEVATED_BASELINE = 22;

function flattenPayload(
  value: unknown,
  path = "",
): Array<{ key: string; text: string }> {
  const out: Array<{ key: string; text: string }> = [];
  if (value == null) return out;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    out.push({ key: path || "value", text: String(value) });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      out.push(...flattenPayload(item, path ? `${path}[${i}]` : `[${i}]`));
    });
    return out;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const next = path ? `${path}.${k}` : k;
      out.push(...flattenPayload(v, next));
    }
  }
  return out;
}

function maxScore(...scores: number[]): number {
  return Math.max(0, ...scores);
}

/**
 * Rule-based semantic judge — assigns per-dimension risk scores (0–100).
 * No LLM; heuristics only for product-agent MVP.
 */
export function extractSemanticScores(
  toolName: string,
  payload: unknown,
): ActionContext[] {
  const entries = flattenPayload(payload);
  const blob = entries.map((e) => `${e.key}=${e.text}`).join("\n");
  const baseline = ROUTINE_READ_TOOLS.has(toolName)
    ? ROUTINE_BASELINE
    : ELEVATED_BASELINE;

  // Start uniform so routine actions are Low/Low (near-zero variance).
  let privacy = baseline;
  let medical = baseline;
  let accountability = baseline;
  let transparency = baseline;
  let fairness = baseline;
  let humanOversight = baseline;
  let accessibilityRep = baseline;

  let sawPii = false;
  let sawMedical = false;
  let sawNarrative = false;

  const isRedactedValue = (text: string) =>
    /^\[(redacted|name|condition)\]$/i.test(text.trim());

  for (const { key, text } of entries) {
    if (isRedactedValue(text)) {
      // Mitigated field — do not re-spike on key name alone.
      continue;
    }
    if (PII_KEY_PATTERN.test(key) || NAME_VALUE_PATTERN.test(text)) {
      sawPii = true;
      privacy = maxScore(privacy, 95);
      humanOversight = maxScore(humanOversight, 60);
    }
    if (MEDICAL_KEY_PATTERN.test(key) || MEDICAL_VALUE_PATTERN.test(text)) {
      sawMedical = true;
      medical = maxScore(medical, 98);
      privacy = maxScore(privacy, 90);
      humanOversight = maxScore(humanOversight, 72);
    }
    if (ACCESSIBILITY_NARRATIVE_KEYS.test(key)) {
      sawNarrative = true;
      accessibilityRep = maxScore(accessibilityRep, 88);
      privacy = maxScore(privacy, 82);
    }
  }

  // Autonomy dims start at baseline; Recognise pipeline overwrites them.
  let capabilityDependence = baseline;
  let irreversibility = baseline;
  let cascadingImpact = baseline;

  if (
    DANGEROUS_VERB_PATTERN.test(toolName) ||
    DANGEROUS_VERB_PATTERN.test(blob)
  ) {
    // Systemic destructive intent — uniform high scores → High γ / Low C_conc → DENY.
    const destroyFloor = 90;
    accountability = destroyFloor;
    humanOversight = destroyFloor;
    transparency = destroyFloor;
    fairness = destroyFloor;
    privacy = destroyFloor;
    medical = destroyFloor;
    accessibilityRep = destroyFloor;
    capabilityDependence = destroyFloor;
    irreversibility = destroyFloor;
    cascadingImpact = destroyFloor;
  }

  if (PUBLISH_PATTERN.test(toolName) || PUBLISH_PATTERN.test(blob)) {
    if (sawMedical || sawPii || sawNarrative) {
      // High γ with acute privacy/medical concentration → REQUIRE_HITL when mitigation fails.
      // Align autonomy floors with Recognise defaults so γ is not diluted before the pipeline runs.
      accountability = maxScore(accountability, 80);
      humanOversight = maxScore(humanOversight, 82);
      transparency = maxScore(transparency, 70);
      fairness = maxScore(fairness, 65);
      medical = maxScore(medical, 99);
      privacy = maxScore(privacy, 99);
      accessibilityRep = maxScore(accessibilityRep, 70);
      capabilityDependence = maxScore(capabilityDependence, 70);
      irreversibility = maxScore(irreversibility, 75);
      cascadingImpact = maxScore(cascadingImpact, 70);
    } else {
      // Publish without residual sensitive payload — modest uniform elevation.
      const publishFloor = 35;
      privacy = maxScore(privacy, publishFloor);
      medical = maxScore(medical, publishFloor);
      accountability = maxScore(accountability, publishFloor);
      transparency = maxScore(transparency, publishFloor);
      fairness = maxScore(fairness, publishFloor);
      humanOversight = maxScore(humanOversight, publishFloor);
      accessibilityRep = maxScore(accessibilityRep, publishFloor);
      capabilityDependence = maxScore(capabilityDependence, publishFloor);
      irreversibility = maxScore(irreversibility, publishFloor);
      cascadingImpact = maxScore(cascadingImpact, publishFloor);
    }
  }

  const scores: Partial<Record<RiskDimensionId, number>> = {
    privacy,
    medical_data_exposure: medical,
    accountability,
    transparency,
    fairness,
    human_oversight: humanOversight,
    accessibility_representation: accessibilityRep,
    capability_dependence: capabilityDependence,
    irreversibility,
    cascading_impact: cascadingImpact,
  };

  return [
    {
      contextId: `tool:${toolName}`,
      targetTool: toolName,
      dimensions: buildDimensions(scores),
    },
  ];
}

/** Re-score after mitigation by judging the sanitized payload. */
export function reScoreAfterMitigation(
  toolName: string,
  safePayload: unknown,
): ActionContext[] {
  return extractSemanticScores(toolName, safePayload);
}
