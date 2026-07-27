import { redactSensitiveText } from "@/lib/ai/platform/redaction/sensitive";
import type { MitigationStrategy } from "@/lib/aura-harness/types";
import { deidentifyRecord } from "@/lib/governance/data/deidentification-service";

const HIGH_RISK_KEYS =
  /(email|phone|mobile|address|full.?name|dob|dateOfBirth|ndisNumber|medicare|diagnos|medical|medication|clinical|health.?note|user_reports|narratives?|accessRequirementsSummary|personal.?story)/i;

const DEFAULT_MASK_STRATEGY: MitigationStrategy = {
  strategyId: "mask_pii_v1",
  actionType: "MASK_PII",
};

const DEFAULT_REDUCE_STRATEGY: MitigationStrategy = {
  strategyId: "reduce_scope_v1",
  actionType: "REDUCE_SCOPE",
};

function redactDeep(value: unknown): unknown {
  if (typeof value === "string") {
    let out = redactSensitiveText(value);
    // Generalise likely personal name pairs in free text.
    out = out.replace(/\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g, "[name]");
    // Soften common medical condition literals.
    out = out.replace(
      /\b(epilepsy|diabetes|autism|parkinson(?:'s)?|cerebral\s+palsy|insulin|catheter|ostomy)\b/gi,
      "[condition]",
    );
    return out;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactDeep(item));
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const deidentified = deidentifyRecord(record);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(deidentified)) {
      if (HIGH_RISK_KEYS.test(k) && typeof v === "string") {
        out[k] = "[redacted]";
      } else {
        out[k] = redactDeep(v);
      }
    }
    return out;
  }
  return value;
}

function reduceScope(value: unknown, targetFields?: string[]): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const record = { ...(value as Record<string, unknown>) };
  const keys =
    targetFields && targetFields.length > 0
      ? targetFields
      : Object.keys(record).filter((k) => HIGH_RISK_KEYS.test(k));
  for (const key of keys) {
    delete record[key];
  }
  return record;
}

export function selectMitigationForTool(toolName: string): MitigationStrategy {
  // Always offer REDUCE_SCOPE as a secondary strategy; MASK_PII is applied first
  // in the evaluate pipeline for privacy spikes.
  return { ...DEFAULT_REDUCE_STRATEGY, strategyId: `reduce_scope:${toolName}` };
}

export function applyMitigationLayer(
  payload: unknown,
  mitigation: MitigationStrategy,
): unknown {
  switch (mitigation.actionType) {
    case "MASK_PII":
      return redactDeep(payload);
    case "REDUCE_SCOPE":
      return reduceScope(payload, mitigation.targetFields);
    case "BLOCK":
    case "REQUIRE_APPROVAL":
      return payload;
    default: {
      const _exhaustive: never = mitigation.actionType;
      return _exhaustive;
    }
  }
}

export function defaultMaskPiiStrategy(toolName: string): MitigationStrategy {
  return { ...DEFAULT_MASK_STRATEGY, strategyId: `mask_pii:${toolName}` };
}
