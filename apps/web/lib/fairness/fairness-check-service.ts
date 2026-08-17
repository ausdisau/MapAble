import type { FairnessCheckStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const PROXY_FLAGS = [
  "distance_over_weighted",
  "complex_support_repeatedly_excluded",
  "access_requirement_avoidance_pattern",
  "regional_response_disparity",
];

export async function runFairnessCheck(
  aiMatchRunId: string,
  context: { careRequestId?: string; transportBookingId?: string }
) {
  const flags: { code: string; message: string }[] = [];

  if (context.careRequestId) {
    const request = await prisma.careRequest.findUnique({
      where: { id: context.careRequestId },
      include: { participant: { include: { accessibilityProfile: true } } },
    });
    if (request?.accessRequirementsSummary) {
      flags.push({
        code: "access_needs_present",
        message:
          "Participant has access requirements — verify suitability is not penalised by distance-only scoring.",
      });
    }
  }

  const candidates = await prisma.aiMatchCandidate.findMany({
    where: { aiMatchRunId },
  });
  if (candidates.every((c) => c.combinedScore < 0.4)) {
    flags.push({
      code: "low_confidence_batch",
      message: "All recommendations are low confidence — human review required.",
    });
  }

  let status: FairnessCheckStatus = flags.length ? "review_required" : "passed";
  if (flags.some((f) => PROXY_FLAGS.includes(f.code))) {
    status = "warning";
  }

  const check = await prisma.fairnessCheck.create({
    data: {
      aiMatchRunId,
      status,
      summary:
        flags.length === 0
          ? "No fairness concerns flagged by rule-based checks."
          : `${flags.length} fairness note(s) require review.`,
      flagsJson: flags,
    },
  });

  for (const flag of flags) {
    await prisma.fairnessMetric.create({
      data: {
        fairnessCheckId: check.id,
        metricKey: flag.code,
        passed: false,
        explanation: flag.message,
      },
    });
  }

  await prisma.aiMatchRun.update({
    where: { id: aiMatchRunId },
    data: { status: "fairness_review_required" },
  });

  return check;
}

export async function recordFairnessReview(
  aiMatchRunId: string,
  reviewerId: string,
  decision: string,
  notes?: string
) {
  const check = await prisma.fairnessCheck.findFirst({
    where: { aiMatchRunId },
    orderBy: { createdAt: "desc" },
  });
  if (!check) throw new Error("NOT_FOUND");

  await prisma.fairnessReview.create({
    data: { fairnessCheckId: check.id, reviewerId, decision, notes },
  });

  await prisma.aiMatchRun.update({
    where: { id: aiMatchRunId },
    data: { status: "reviewed" },
  });

  return check;
}
