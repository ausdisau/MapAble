import type { CapabilityReviewDecision, CapabilityReviewKind } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { CAPABILITY_PASSPORT_POLICY_VERSION } from "@/lib/config/capability-passport";
import { prisma } from "@/lib/prisma";
import { sanitiseAuditMetadata } from "@/lib/workforce/http";
import {
  cannotOverrideWithApprove,
  resolveScreeningGateway,
} from "@/lib/workforce/screening-gateway";

const LEGAL_KINDS = new Set<CapabilityReviewKind>([
  "screening_verification",
  "revocation",
]);

export async function requestCapabilityAssessment(input: {
  workerProfileId: string;
  organisationId: string;
  kind: CapabilityReviewKind;
  evidenceIds: string[];
  scope: string;
  participantId?: string;
  actorUserId: string;
  actorRole?: string | null;
}) {
  const screening = await prisma.workerScreeningRecord.findMany({
    where: { workerProfileId: input.workerProfileId },
  });
  const gateway = resolveScreeningGateway(screening);
  const legalProhibition =
    gateway.legalProhibition || LEGAL_KINDS.has(input.kind) && gateway.legalProhibition;

  const created = await prisma.capabilityReviewCase.create({
    data: {
      workerProfileId: input.workerProfileId,
      organisationId: input.organisationId,
      kind: input.kind,
      evidenceIds: input.evidenceIds,
      scope: input.scope,
      policyVersion: CAPABILITY_PASSPORT_POLICY_VERSION,
      participantId: input.participantId,
      createdByUserId: input.actorUserId,
      legalProhibition,
      decision: "hold",
      status: "open",
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as never,
    action: "capability_review.requested",
    entityType: "CapabilityReviewCase",
    entityId: created.id,
    organisationId: input.organisationId,
    participantId: input.participantId ?? null,
    metadata: sanitiseAuditMetadata({ kind: input.kind, legalProhibition }),
  });

  return created;
}

export async function reviewCapabilityCase(input: {
  caseId: string;
  assessorUserId: string;
  assessorRole?: string | null;
  decision: CapabilityReviewDecision;
  reason: string;
  limitations: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const reviewCase = await tx.capabilityReviewCase.findUnique({
      where: { id: input.caseId },
      include: { workerProfile: true },
    });
    if (!reviewCase) throw new Error("PROPOSAL_NOT_FOUND");
    if (reviewCase.status !== "open") throw new Error("PROPOSAL_NOT_PENDING");
    if (reviewCase.workerProfile.userId === input.assessorUserId) {
      throw new Error("SELF_APPROVAL_FORBIDDEN");
    }

    const screening = await tx.workerScreeningRecord.findMany({
      where: { workerProfileId: reviewCase.workerProfileId },
    });
    const gateway = resolveScreeningGateway(screening);
    if (
      (input.decision === "approve" &&
        (reviewCase.legalProhibition || cannotOverrideWithApprove(gateway)))
    ) {
      throw new Error("LEGAL_PROHIBITION_NOT_OVERRIDABLE");
    }

    const updated = await tx.capabilityReviewCase.update({
      where: { id: reviewCase.id },
      data: {
        decision: input.decision,
        decisionReason: input.reason,
        limitations: input.limitations,
        accountableHumanUserId: input.assessorUserId,
        reviewedByUserId: input.assessorUserId,
        reviewedAt: new Date(),
        status: input.decision === "hold" || input.decision === "request_evidence" ||
          input.decision === "refer_for_assessment" || input.decision === "escalate"
          ? "open"
          : "closed",
      },
    });

    await createAuditEvent({
      tx,
      actorUserId: input.assessorUserId,
      actorRole: input.assessorRole as never,
      action: "capability_review.decided",
      entityType: "CapabilityReviewCase",
      entityId: updated.id,
      organisationId: reviewCase.organisationId,
      participantId: reviewCase.participantId,
      metadata: sanitiseAuditMetadata({
        decision: input.decision,
        legalProhibition: reviewCase.legalProhibition,
      }),
    });

    return updated;
  });
}

export async function listOpenCapabilityReviews(organisationId?: string) {
  return prisma.capabilityReviewCase.findMany({
    where: {
      status: "open",
      ...(organisationId ? { organisationId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      workerProfile: { select: { id: true, displayName: true, organisationId: true, userId: true } },
    },
  });
}

export async function createEvidenceDispute(input: {
  workerProfileId: string;
  evidenceKind: string;
  evidenceId: string;
  reason: string;
  actorUserId: string;
  actorRole?: string | null;
  organisationId: string;
}) {
  const dispute = await prisma.workerEvidenceDispute.create({
    data: {
      workerProfileId: input.workerProfileId,
      evidenceKind: input.evidenceKind,
      evidenceId: input.evidenceId,
      reason: input.reason,
      createdByUserId: input.actorUserId,
    },
  });
  await requestCapabilityAssessment({
    workerProfileId: input.workerProfileId,
    organisationId: input.organisationId,
    kind: "dispute",
    evidenceIds: [input.evidenceId],
    scope: "worker_correction",
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as never,
    action: "capability_passport.dispute_opened",
    entityType: "WorkerEvidenceDispute",
    entityId: dispute.id,
    organisationId: input.organisationId,
    metadata: sanitiseAuditMetadata({ evidenceKind: input.evidenceKind }),
  });
  return dispute;
}
