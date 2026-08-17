import type { AccessAccreditationLevel, AccessAccreditationTier } from "@prisma/client";

import {
  ACCREDITATION_CRITERIA,
  CRITERIA_TOTAL_WEIGHT,
} from "@/lib/access/accreditation/accreditation-criteria-service";

const LEVEL_MULTIPLIER: Record<AccessAccreditationLevel, number> = {
  gold: 1,
  silver: 0.7,
  bronze: 0.4,
  fail: 0,
  not_applicable: 0,
};

export function weightedScoreForLevel(
  level: AccessAccreditationLevel,
  weight: number
): number {
  return weight * LEVEL_MULTIPLIER[level];
}

export function calculateAccreditationTotal(
  scores: { criterionCode: string; level: AccessAccreditationLevel }[]
): number {
  let raw = 0;
  for (const row of scores) {
    const def = ACCREDITATION_CRITERIA.find((c) => c.code === row.criterionCode);
    if (!def) continue;
    raw += weightedScoreForLevel(row.level, def.weight);
  }
  const normalized = (raw / CRITERIA_TOTAL_WEIGHT) * 100;
  return Math.round(normalized * 100) / 100;
}

export function tierFromTotalScore(total: number): AccessAccreditationTier {
  if (total >= 90) return "gold";
  if (total >= 70) return "silver";
  if (total >= 40) return "bronze";
  return "not_accredited";
}

export function tierLabel(tier: AccessAccreditationTier): string {
  switch (tier) {
    case "gold":
      return "Universally Accessible";
    case "silver":
      return "Highly Accessible";
    case "bronze":
      return "Accessible";
    default:
      return "Improvement Needed";
  }
}

export function verifyCriteriaTotalWeight(): boolean {
  return ACCREDITATION_CRITERIA.length === 18 && CRITERIA_TOTAL_WEIGHT === 100;
}
