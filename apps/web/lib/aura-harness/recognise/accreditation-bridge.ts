import { tierFromTotalScore } from "@/lib/access/accreditation/accreditation-scoring-service";
import { clampScore } from "@/lib/aura-harness/dimensions";
import type { AccreditationTierHint } from "@/lib/aura-harness/recognise/types";

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * When tool args include venue/place accreditation scores, map tier weakness
 * into an accessibility risk contribution. No-op when fields absent.
 */
export function evaluateAccreditationBridge(
  payload: unknown,
): AccreditationTierHint | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const total =
    readNumber(record.accreditationTotalScore) ??
    readNumber(record.venueAccessibilityScore) ??
    readNumber(record.placeAccessibilityScore) ??
    readNumber(record.totalScore);

  if (total == null) return null;

  const tier = tierFromTotalScore(total);
  let accessibilityRiskScore = 12;
  switch (tier) {
    case "gold":
      accessibilityRiskScore = 10;
      break;
    case "silver":
      accessibilityRiskScore = 28;
      break;
    case "bronze":
      accessibilityRiskScore = 55;
      break;
    case "not_accredited":
      accessibilityRiskScore = 88;
      break;
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }

  return {
    totalScore: total,
    tier,
    accessibilityRiskScore: clampScore(accessibilityRiskScore),
  };
}
