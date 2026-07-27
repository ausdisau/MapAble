/** Minimum cohort size before a metric value may be published. */
export const SMALL_CELL_THRESHOLD = 5;

export type SmallCellResult = {
  suppressed: boolean;
  reason?: string;
};

export function applySmallCellControls(
  value: number,
  cohortSize: number,
  threshold = SMALL_CELL_THRESHOLD,
): SmallCellResult {
  if (cohortSize < threshold) {
    return {
      suppressed: true,
      reason: `Cohort size ${cohortSize} below threshold of ${threshold}`,
    };
  }
  if (value > 0 && value < 1 && cohortSize < threshold * 2) {
    return {
      suppressed: true,
      reason: "Low-frequency cell suppressed to prevent inference",
    };
  }
  return { suppressed: false };
}

export function shouldSuppressCohort(participantCount: number): boolean {
  return participantCount < SMALL_CELL_THRESHOLD;
}
