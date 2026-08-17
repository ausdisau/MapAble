import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { runFairnessCheck } from "@/lib/fairness/fairness-check-service";
import { runCareWorkerMatch } from "@/lib/matching/matching-service";
import { prisma } from "@/lib/prisma";

import {
  AiMatchingError,
  type MatchScoreBreakdown,
  type ParticipantMatchExplanation,
} from "./types";

const CANDIDATE_TTL_MS = 24 * 60 * 60 * 1000;
const APPROVED_FAIRNESS_DECISIONS = new Set([
  "approved",
  "approve",
  "accepted",
  "accept",
]);
const REJECTED_FAIRNESS_DECISIONS = new Set([
  "rejected",
  "reject",
  "denied",
  "deny",
]);
const TERMINAL_CANDIDATE_STATUSES = new Set([
  "accepted",
  "rejected",
  "expired",
  "superseded",
]);

function modelConfigured(): boolean {
  const provider = phase5Config.aiMatchingProvider;
  return Boolean(provider && provider !== "disabled");
}

/**
 * Honest score breakdown. When no model runs, model fields stay null.
 * Never transforms a rule score into a fabricated AI score.
 */
export function buildScoreBreakdown(input: {
  ruleScore: number;
  hardRequirementsMet?: boolean;
  eligibilityOk?: boolean;
  preferenceAlignment?: number | null;
  availabilityKnown?: boolean;
  evidenceFreshness?: MatchScoreBreakdown["evidenceFreshness"];
  unknownFields?: string[];
  modelCommentaryScore?: number | null;
  modelRunId?: string | null;
  modelVersion?: string | null;
}): MatchScoreBreakdown {
  const deterministicRuleScore = Math.min(1, Math.max(0, input.ruleScore));
  const modelRan =
    input.modelCommentaryScore != null &&
    input.modelRunId != null &&
    input.modelVersion != null;
  const modelCommentaryScore = modelRan ? input.modelCommentaryScore! : null;
  const combinedDisplayScore = deterministicRuleScore;
  const hardRequirementsMet = input.hardRequirementsMet !== false;
  const lowConfidence =
    !hardRequirementsMet ||
    combinedDisplayScore < 0.55 ||
    (input.unknownFields?.length ?? 0) > 0;

  return {
    eligibilityOk: input.eligibilityOk !== false,
    hardRequirementsMet,
    preferenceAlignment: input.preferenceAlignment ?? null,
    availabilityKnown: input.availabilityKnown ?? false,
    evidenceFreshness: input.evidenceFreshness ?? "unknown",
    unknownFields: input.unknownFields ?? [],
    deterministicRuleScore,
    modelCommentaryScore,
    modelRunId: modelRan ? input.modelRunId! : null,
    modelVersion: modelRan ? input.modelVersion! : null,
    combinedDisplayScore,
    lowConfidence,
  };
}

export function buildParticipantExplanation(
  breakdown: MatchScoreBreakdown,
  ruleExplanation: string
): ParticipantMatchExplanation {
  const confirmed: string[] = [];
  const unknown: string[] = [...breakdown.unknownFields];
  const needsChecking: string[] = [];

  if (breakdown.hardRequirementsMet) {
    confirmed.push("Hard requirements appear compatible from available records.");
  } else {
    needsChecking.push("Hard requirements are not confirmed as met.");
  }

  if (breakdown.eligibilityOk) {
    confirmed.push("Worker/organisation eligibility checks passed.");
  } else {
    needsChecking.push("Eligibility still needs confirmation.");
  }

  if (!breakdown.availabilityKnown) {
    unknown.push("Availability for the requested time window.");
  }

  if (breakdown.evidenceFreshness === "stale") {
    needsChecking.push("Some matching evidence may be out of date.");
  } else if (breakdown.evidenceFreshness === "unknown") {
    unknown.push("Evidence freshness.");
  }

  if (breakdown.modelCommentaryScore == null) {
    unknown.push("No model commentary was generated for this option.");
  }

  return {
    whyMayWork:
      ruleExplanation ||
      "This option was ranked using deterministic matching rules on available records.",
    confirmed,
    unknown,
    needsChecking,
    whoMustConfirm:
      "A coordinator or authorised human must confirm assignment. The participant decides whether to proceed.",
    modelRan: breakdown.modelCommentaryScore != null,
    note: "Recommendations require human confirmation before assignment. No worker was assigned by this step.",
  };
}

/** @deprecated Prefer buildParticipantExplanation — kept for phase5 test compat shape. */
export function participantSafeAiSummary(candidate: {
  combinedScore: number;
  lowConfidence: boolean;
  modelCommentaryScore?: number | null;
}) {
  return {
    fit:
      candidate.combinedScore >= 0.7 && !candidate.lowConfidence
        ? "Good potential fit"
        : "Needs human review",
    note: "Recommendations require human confirmation before assignment.",
    modelRan: candidate.modelCommentaryScore != null,
  };
}

export async function runAiCareMatch(
  careRequestId: string,
  requestedById: string
) {
  if (!phase5Config.aiMatchingEnabled) {
    return { skipped: true, reason: "AI matching disabled" };
  }

  await createAuditEvent({
    actorUserId: requestedById,
    action: "ai_match.requested",
    entityType: "CareRequest",
    entityId: careRequestId,
  });

  const ruleRun = await runCareWorkerMatch(careRequestId, requestedById);
  if ("skipped" in ruleRun && ruleRun.skipped) {
    return ruleRun;
  }

  await createAuditEvent({
    actorUserId: requestedById,
    action: "ai_match.rules_evaluated",
    entityType: "CareRequest",
    entityId: careRequestId,
    metadata: {
      ruleRunId:
        "run" in ruleRun && ruleRun.run ? (ruleRun.run as { id: string }).id : null,
    },
  });

  const modelActive = modelConfigured();
  if (!modelActive) {
    await createAuditEvent({
      actorUserId: requestedById,
      action: "ai_match.model_unavailable",
      entityType: "CareRequest",
      entityId: careRequestId,
      metadata: { provider: phase5Config.aiMatchingProvider },
    });
  }

  // Model commentary is intentionally not invoked. Honest deterministic-only run.
  const modelVersion = modelActive
    ? await prisma.matchingModelVersion.findFirst({ where: { active: true } })
    : null;

  const expiresAt = new Date(Date.now() + CANDIDATE_TTL_MS);

  const aiRun = await prisma.aiMatchRun.create({
    data: {
      careRequestId,
      status: "fairness_review_required",
      requestedById,
      modelVersionId: modelVersion?.id,
      ruleBasedRunId:
        "run" in ruleRun && ruleRun.run
          ? (ruleRun.run as { id: string }).id
          : undefined,
    },
  });

  const candidates = await prisma.matchCandidate.findMany({
    where: { matchRun: { careRequestId } },
    orderBy: { score: "desc" },
    take: 10,
  });

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const unknownFields: string[] = [];
    if (!c.candidateWorkerId && !c.candidateUserId) {
      unknownFields.push("worker_identity");
    }

    const breakdown = buildScoreBreakdown({
      ruleScore: c.score,
      hardRequirementsMet: true,
      eligibilityOk: true,
      preferenceAlignment: null,
      availabilityKnown: false,
      evidenceFreshness: "unknown",
      unknownFields,
      // Honest nulls — no fabricated model score
      modelCommentaryScore: null,
      modelRunId: null,
      modelVersion: null,
    });

    const explanation = buildParticipantExplanation(
      breakdown,
      c.scoreExplanation
    );

    const aiCandidate = await prisma.aiMatchCandidate.create({
      data: {
        aiMatchRunId: aiRun.id,
        matchCandidateId: c.id,
        rank: i + 1,
        // Legacy column retained for schema compat; mirrors rule score only (not a model score).
        aiScore: breakdown.deterministicRuleScore,
        combinedScore: breakdown.combinedDisplayScore,
        ruleScore: breakdown.deterministicRuleScore,
        modelCommentaryScore: breakdown.modelCommentaryScore,
        modelRunId: breakdown.modelRunId,
        modelVersionLabel: breakdown.modelVersion,
        hardRequirementsMet: breakdown.hardRequirementsMet,
        unknownFieldsJson: breakdown.unknownFields,
        expiresAt,
        lowConfidence: breakdown.lowConfidence,
        status: breakdown.lowConfidence ? "review_required" : "generated",
      },
    });

    await prisma.aiMatchExplanation.createMany({
      data: [
        {
          aiMatchCandidateId: aiCandidate.id,
          audience: "admin",
          plainLanguage: c.scoreExplanation,
          technicalDetail: `Deterministic rule score ${breakdown.deterministicRuleScore.toFixed(2)}; modelCommentaryScore=null (no model ran).`,
        },
        {
          aiMatchCandidateId: aiCandidate.id,
          audience: "participant",
          plainLanguage: [
            explanation.whyMayWork,
            `Confirmed: ${explanation.confirmed.join(" ") || "none listed."}`,
            `Unknown: ${explanation.unknown.join(" ") || "none listed."}`,
            `Needs checking: ${explanation.needsChecking.join(" ") || "none listed."}`,
            explanation.whoMustConfirm,
          ].join(" "),
        },
      ],
    });
  }

  if (phase5Config.fairnessChecksEnabled) {
    await runFairnessCheck(aiRun.id, { careRequestId });
    await createAuditEvent({
      actorUserId: requestedById,
      action: "ai_match.fairness_review",
      entityType: "AiMatchRun",
      entityId: aiRun.id,
    });
  }

  await createAuditEvent({
    actorUserId: requestedById,
    action: "ai_match.run_created",
    entityType: "AiMatchRun",
    entityId: aiRun.id,
    metadata: { deterministicOnly: true, modelConfigured: modelActive },
  });

  return {
    aiRun,
    requiresHumanReview: phase5Config.aiMatchingRequireHumanReview,
    deterministicOnly: true,
  };
}

type AcceptOptions = {
  /** Optional organisation scope claimed by the actor (server-derived). */
  actorOrganisationId?: string | null;
  /** Expected care request — rejects cross-request candidates. */
  expectedCareRequestId?: string | null;
};

/**
 * Atomic candidate acceptance. Validates before mutation; failed validation
 * leaves the candidate unchanged.
 */
export async function acceptAiCandidate(
  candidateId: string,
  actorUserId: string,
  options: AcceptOptions = {}
) {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.aiMatchCandidate.findUnique({
      where: { id: candidateId },
      include: {
        aiMatchRun: true,
        matchCandidate: {
          include: { matchRun: true },
        },
      },
    });

    if (!candidate) {
      throw new AiMatchingError("NOT_FOUND");
    }

    const priorStatus = candidate.status;
    if (priorStatus === "accepted") {
      throw new AiMatchingError("ALREADY_ACCEPTED");
    }
    if (TERMINAL_CANDIDATE_STATUSES.has(priorStatus)) {
      throw new AiMatchingError("ALREADY_TERMINAL");
    }

    if (candidate.expiresAt && candidate.expiresAt.getTime() < Date.now()) {
      throw new AiMatchingError("EXPIRED");
    }

    const careRequestId = candidate.aiMatchRun.careRequestId;
    if (
      options.expectedCareRequestId &&
      careRequestId &&
      options.expectedCareRequestId !== careRequestId
    ) {
      throw new AiMatchingError("CARE_REQUEST_MISMATCH");
    }

    if (candidate.matchCandidateId && candidate.matchCandidate) {
      const matchRunCareRequestId = candidate.matchCandidate.matchRun.careRequestId;
      if (
        careRequestId &&
        matchRunCareRequestId &&
        matchRunCareRequestId !== careRequestId
      ) {
        throw new AiMatchingError("CANDIDATE_OWNERSHIP_MISMATCH");
      }
    }

    if (careRequestId) {
      const careRequest = await tx.careRequest.findUnique({
        where: { id: careRequestId },
        select: {
          id: true,
          participantId: true,
          assignedOrganisationId: true,
        },
      });
      if (!careRequest) {
        throw new AiMatchingError("NOT_FOUND");
      }
      if (
        options.actorOrganisationId &&
        careRequest.assignedOrganisationId &&
        options.actorOrganisationId !== careRequest.assignedOrganisationId
      ) {
        throw new AiMatchingError("CROSS_TENANT");
      }
    }

    if (phase5Config.aiMatchingRequireHumanReview) {
      const review = await tx.fairnessReview.findFirst({
        where: { fairnessCheck: { aiMatchRunId: candidate.aiMatchRunId } },
        orderBy: { createdAt: "desc" },
      });
      if (!review) {
        throw new AiMatchingError("FAIRNESS_REVIEW_MISSING");
      }
      const decision = review.decision.trim().toLowerCase();
      if (REJECTED_FAIRNESS_DECISIONS.has(decision)) {
        throw new AiMatchingError("FAIRNESS_REVIEW_REJECTED");
      }
      if (!APPROVED_FAIRNESS_DECISIONS.has(decision)) {
        throw new AiMatchingError("FAIRNESS_REVIEW_NOT_APPROVED");
      }
    }

    // Concurrent acceptance guard: only transition from non-terminal statuses.
    const updated = await tx.aiMatchCandidate.updateMany({
      where: {
        id: candidateId,
        status: { notIn: [...TERMINAL_CANDIDATE_STATUSES] },
      },
      data: { status: "accepted" },
    });

    if (updated.count !== 1) {
      throw new AiMatchingError("CONCURRENT_ACCEPTANCE");
    }

    await tx.aiMatchRun.update({
      where: { id: candidate.aiMatchRunId },
      data: { status: "accepted", completedAt: new Date() },
    });

    const accepted = await tx.aiMatchCandidate.findUniqueOrThrow({
      where: { id: candidateId },
      include: { aiMatchRun: true },
    });

    await createAuditEvent({
      actorUserId,
      action: "ai_match.candidate_accepted",
      entityType: "AiMatchCandidate",
      entityId: candidateId,
      metadata: {
        priorStatus,
        careRequestId,
        deterministicOnly: accepted.modelRunId == null,
      },
    });

    return accepted;
  });
}

export async function rejectAiCandidate(
  candidateId: string,
  actorUserId: string
) {
  const existing = await prisma.aiMatchCandidate.findUnique({
    where: { id: candidateId },
  });
  if (!existing) {
    throw new AiMatchingError("NOT_FOUND");
  }
  if (TERMINAL_CANDIDATE_STATUSES.has(existing.status)) {
    throw new AiMatchingError("ALREADY_TERMINAL");
  }

  const candidate = await prisma.aiMatchCandidate.update({
    where: { id: candidateId },
    data: { status: "rejected" },
  });

  await createAuditEvent({
    actorUserId,
    action: "ai_match.candidate_rejected",
    entityType: "AiMatchCandidate",
    entityId: candidateId,
  });

  return candidate;
}

export async function recordParticipantCorrection(
  candidateId: string,
  actorUserId: string,
  correction: string
) {
  await createAuditEvent({
    actorUserId,
    action: "ai_match.participant_correction",
    entityType: "AiMatchCandidate",
    entityId: candidateId,
    metadata: { correction: correction.slice(0, 2000) },
  });
}
