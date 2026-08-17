import { engagementConfig } from "@/lib/config/engagement";
import { prisma } from "@/lib/prisma";

export type NpsBenchmark = {
  nps: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  suppressed: boolean;
};

function calculateNps(scores: number[]): NpsBenchmark {
  const total = scores.length;
  if (total < engagementConfig.npsMinCohortSize) {
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

  const nps = Math.round(
    ((promoters - detractors) / total) * 100
  );

  return { nps, promoters, passives, detractors, total, suppressed: false };
}

export async function recordNpsResponse(input: {
  participantId: string;
  score: number;
  comment?: string;
  contextType?: string;
  contextId?: string;
  organisationId?: string;
  submissionId?: string;
}) {
  if (input.score < 0 || input.score > 10) {
    throw new Error("NPS score must be 0–10");
  }

  return prisma.engagementNpsResponse.create({
    data: input,
  });
}

export async function getOrgNpsBenchmark(
  organisationId: string,
  since?: Date
): Promise<NpsBenchmark> {
  const responses = await prisma.engagementNpsResponse.findMany({
    where: {
      organisationId,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    select: { score: true },
  });

  return calculateNps(responses.map((r) => r.score));
}

export async function getPlatformNpsBenchmark(since?: Date): Promise<NpsBenchmark> {
  const responses = await prisma.engagementNpsResponse.findMany({
    where: since ? { createdAt: { gte: since } } : {},
    select: { score: true },
  });

  return calculateNps(responses.map((r) => r.score));
}

export async function getOrgBenchmarkComparison(organisationId: string) {
  const since = new Date();
  since.setMonth(since.getMonth() - 3);

  const [org, platform] = await Promise.all([
    getOrgNpsBenchmark(organisationId, since),
    getPlatformNpsBenchmark(since),
  ]);

  return { org, platformMedian: platform, since };
}

export async function getCsatAverage(
  organisationId?: string,
  since?: Date
): Promise<{ average: number | null; count: number; suppressed: boolean }> {
  const submissions = await prisma.engagementSubmission.findMany({
    where: {
      type: "service_feedback",
      rating: { not: null },
      ...(organisationId ? { organisationId } : {}),
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    select: { rating: true },
  });

  const count = submissions.length;
  if (count < engagementConfig.npsMinCohortSize) {
    return { average: null, count, suppressed: true };
  }

  const sum = submissions.reduce((acc, s) => acc + (s.rating ?? 0), 0);
  return { average: Math.round((sum / count) * 10) / 10, count, suppressed: false };
}
