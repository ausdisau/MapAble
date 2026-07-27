import type { RiskDimension, RiskDimensionId } from "@/lib/aura-harness/types";

/** Default organisational weights for MapAbleAU (privacy / medical / autonomy elevated). */
export const DEFAULT_DIMENSION_WEIGHTS: Record<RiskDimensionId, number> = {
  accountability: 1.0,
  transparency: 0.8,
  fairness: 1.0,
  privacy: 1.5,
  human_oversight: 1.0,
  accessibility_representation: 1.2,
  medical_data_exposure: 1.5,
  capability_dependence: 1.4,
  irreversibility: 1.6,
  cascading_impact: 1.5,
};

export const ALL_DIMENSION_IDS = Object.keys(
  DEFAULT_DIMENSION_WEIGHTS,
) as RiskDimensionId[];

export function buildDimensions(
  scores: Partial<Record<RiskDimensionId, number>>,
  weights: Partial<Record<RiskDimensionId, number>> = {},
): RiskDimension[] {
  return ALL_DIMENSION_IDS.map((id) => ({
    id,
    weight: weights[id] ?? DEFAULT_DIMENSION_WEIGHTS[id],
    score: clampScore(scores[id] ?? 0),
  }));
}

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, score));
}
