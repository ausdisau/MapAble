import { isDurableEvidenceEnabled } from "@/lib/access-intelligence-next/evidence/persist";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import type {
  AccessChangeReview,
  AccessChangeReviewDecision,
} from "./types";

export class AccessChangeReviewPersistError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AccessChangeReviewPersistError";
    this.status = status;
  }
}

export type PersistChangeReviewInput = {
  review: AccessChangeReview;
  placeId?: string | null;
  evidenceEnvelopeRecordId?: string | null;
  subjectCanonicalRef?: string;
};

/**
 * Durable human change review. Never auto-publishes AccessPlace updates.
 */
export async function persistChangeReview(
  input: PersistChangeReviewInput,
): Promise<{ id: string; reviewId: string; durable: true; autoPublished: false }> {
  if (!isDurableEvidenceEnabled()) {
    throw new AccessChangeReviewPersistError(
      "Durable access evidence persistence is not enabled",
      503,
    );
  }

  const { review } = input;
  const subjectCanonicalRef =
    input.subjectCanonicalRef ??
    `accessplace:synthetic:${review.candidate.subjectNodeId.split(".")[0] ?? "unknown"}`;

  const row = await prisma.accessChangeReviewRecord.upsert({
    where: { reviewId: review.reviewId },
    create: {
      reviewId: review.reviewId,
      placeId: input.placeId ?? null,
      evidenceEnvelopeId: input.evidenceEnvelopeRecordId ?? null,
      subjectCanonicalRef,
      subjectNodeId: review.candidate.subjectNodeId,
      ontologyConceptId: review.candidate.ontologyConceptId,
      candidateJson: review.candidate,
      outcome: review.outcome,
      oldStateSummary: review.oldStateSummary,
      newCandidateSummary: review.newCandidateSummary,
      decision: review.decision,
      reviewerId: review.reviewer,
      decidedAt: review.decidedAt ? new Date(review.decidedAt) : null,
      notesJson: review.notes,
      autoOverwriteBlocked: review.autoOverwriteBlocked,
      expiryAt: review.candidate.expiryAt
        ? new Date(review.candidate.expiryAt)
        : null,
    },
    update: {
      outcome: review.outcome,
      oldStateSummary: review.oldStateSummary,
      newCandidateSummary: review.newCandidateSummary,
      decision: review.decision,
      notesJson: review.notes,
      autoOverwriteBlocked: true,
    },
  });

  await createAuditEvent({
    action: "access_intelligence.change_review.persisted",
    entityType: "AccessChangeReviewRecord",
    entityId: row.id,
    metadata: {
      reviewId: review.reviewId,
      outcome: review.outcome,
      decision: review.decision,
      autoOverwriteBlocked: true,
      subjectNodeId: review.candidate.subjectNodeId,
    },
  });

  return {
    id: row.id,
    reviewId: row.reviewId,
    durable: true,
    autoPublished: false,
  };
}

const DECIDABLE: AccessChangeReviewDecision[] = [
  "accepted_as_temporary",
  "accepted_as_update",
  "rejected",
  "needs_more_evidence",
  "escalated",
];

/**
 * Human decision on a change review.
 * Accept decisions do NOT publish to AccessPlace / Twin.
 */
export async function decideChangeReview(input: {
  reviewId: string;
  reviewerId: string;
  decision: Exclude<AccessChangeReviewDecision, "pending">;
  note?: string;
}): Promise<{ reviewId: string; decision: string; publishedToAccessPlace: false }> {
  if (!isDurableEvidenceEnabled()) {
    throw new AccessChangeReviewPersistError(
      "Durable access evidence persistence is not enabled",
      503,
    );
  }

  const existing = await prisma.accessChangeReviewRecord.findUnique({
    where: { reviewId: input.reviewId },
  });
  if (!existing) {
    throw new AccessChangeReviewPersistError("Review not found", 404);
  }
  if (existing.decision !== "pending") {
    throw new AccessChangeReviewPersistError("Review already decided", 409);
  }
  if (!DECIDABLE.includes(input.decision)) {
    throw new AccessChangeReviewPersistError("Invalid decision", 400);
  }

  const notes = Array.isArray(existing.notesJson)
    ? [...(existing.notesJson as string[])]
    : [];
  if (input.note?.trim()) notes.push(input.note.trim());
  notes.push("Human decision does not auto-publish to AccessPlace");

  await prisma.accessChangeReviewRecord.update({
    where: { reviewId: input.reviewId },
    data: {
      decision: input.decision,
      reviewerId: input.reviewerId,
      decidedAt: new Date(),
      notesJson: notes,
      autoOverwriteBlocked: true,
    },
  });

  if (
    existing.evidenceEnvelopeId &&
    (input.decision === "accepted_as_temporary" ||
      input.decision === "accepted_as_update")
  ) {
    await prisma.accessEvidenceEnvelopeRecord.update({
      where: { id: existing.evidenceEnvelopeId },
      data: { verificationStatus: "human_reviewed_candidate" },
    });
  }

  await createAuditEvent({
    actorUserId: input.reviewerId,
    action: "access_intelligence.change_review.decided",
    entityType: "AccessChangeReviewRecord",
    entityId: existing.id,
    metadata: {
      reviewId: input.reviewId,
      decision: input.decision,
      publishedToAccessPlace: false,
    },
  });

  return {
    reviewId: input.reviewId,
    decision: input.decision,
    publishedToAccessPlace: false,
  };
}

export async function listPendingChangeReviews(limit = 50) {
  if (!isDurableEvidenceEnabled()) {
    throw new AccessChangeReviewPersistError(
      "Durable access evidence persistence is not enabled",
      503,
    );
  }
  return prisma.accessChangeReviewRecord.findMany({
    where: { decision: "pending" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
