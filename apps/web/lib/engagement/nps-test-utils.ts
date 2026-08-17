import type { NpsBenchmark } from "@/lib/engagement/nps-service";

/** Exported for unit tests — mirrors nps-service calculateNps logic. */
export function calculateNpsFromScores(
  scores: number[],
  minCohortSize: number
): NpsBenchmark {
  const total = scores.length;
  if (total < minCohortSize) {
    return {
      nps: null,
      promoters: 0,
      passives: 0,
      detractors: 0,
      total,
      suppressed: true,
    };
  }

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  for (const score of scores) {
    if (score >= 9) promoters += 1;
    else if (score >= 7) passives += 1;
    else detractors += 1;
  }

  const nps = Math.round(((promoters - detractors) / total) * 100);
  return { nps, promoters, passives, detractors, total, suppressed: false };
}
