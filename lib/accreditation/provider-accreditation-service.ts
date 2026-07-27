import type {
  ProviderAccreditationApplicationStatus,
  ProviderAccreditationDecisionOutcome,
  Prisma,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureProviderAccreditationEnabled,
  qualityAccreditationConfig,
} from "@/lib/config/quality-accreditation";
import { assertQualityComplianceAllowed } from "@/lib/quality/compliance-boundaries";
import { listOrganisationEvidence } from "@/lib/quality/standards/standards-service";
import { prisma } from "@/lib/prisma";

async function recordApplicationEvent(params: {
  applicationId: string;
  actorId?: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.providerAccreditationApplicationEvent.create({
    data: {
      applicationId: params.applicationId,
      actorId: params.actorId,
      action: params.action,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createApplication(params: {
  organisationId: string;
  frameworkId: string;
  submittedById: string;
  accessAccreditationAssessmentId?: string;
}) {
  ensureProviderAccreditationEnabled();
  const application = await prisma.providerAccreditationApplication.create({
    data: {
      organisationId: params.organisationId,
      frameworkId: params.frameworkId,
      submittedById: params.submittedById,
      accessAccreditationAssessmentId: params.accessAccreditationAssessmentId,
      status: "draft",
    },
  });

  await recordApplicationEvent({
    applicationId: application.id,
    actorId: params.submittedById,
    action: "application.created",
  });

  return application;
}

export async function submitApplication(
  applicationId: string,
  actorId: string,
) {
  ensureProviderAccreditationEnabled();
  const application = await prisma.providerAccreditationApplication.update({
    where: { id: applicationId },
    data: { status: "submitted", submittedAt: new Date() },
  });

  await recordApplicationEvent({
    applicationId,
    actorId,
    action: "application.submitted",
  });

  return application;
}

export async function addApplicationEvidence(params: {
  applicationId: string;
  requirementId?: string;
  storagePath?: string;
  caption?: string;
  sourceRef?: string;
  actorId: string;
}) {
  ensureProviderAccreditationEnabled();
  const evidence = await prisma.providerAccreditationApplicationEvidence.create({
    data: {
      applicationId: params.applicationId,
      requirementId: params.requirementId,
      storagePath: params.storagePath,
      caption: params.caption,
      sourceRef: params.sourceRef,
    },
  });

  await recordApplicationEvent({
    applicationId: params.applicationId,
    actorId: params.actorId,
    action: "evidence.added",
    metadata: { evidenceId: evidence.id },
  });

  return evidence;
}

/** Prepare evidence index for human assessors — CareOS does not decide outcomes. */
export async function prepareAssessmentEvidenceIndex(params: {
  applicationId: string;
  assessorId: string;
  notes?: string;
}) {
  ensureProviderAccreditationEnabled();
  const application =
    await prisma.providerAccreditationApplication.findUniqueOrThrow({
      where: { id: params.applicationId },
      include: {
        framework: {
          include: {
            outcomes: {
              include: {
                indicators: { include: { evidenceRequirements: true } },
              },
            },
          },
        },
        evidence: true,
      },
    });

  const orgEvidence = await listOrganisationEvidence(application.organisationId);

  const evidenceIndex = application.framework.outcomes.flatMap((outcome) =>
    outcome.indicators.flatMap((indicator) =>
      indicator.evidenceRequirements.map((req) => {
        const appEvidence = application.evidence.filter(
          (e) => e.requirementId === req.id,
        );
        const compliance = orgEvidence.filter(
          (e) => e.requirementId === req.id,
        );
        return {
          requirementId: req.id,
          requirementCode: req.code,
          indicatorCode: indicator.code,
          outcomeCode: outcome.code,
          applicationEvidenceCount: appEvidence.length,
          complianceEvidenceCount: compliance.length,
          latestAssessmentStatus:
            compliance[0]?.assessments[0]?.status ?? "none",
        };
      }),
    ),
  );

  const assessment = await prisma.providerAccreditationAssessment.create({
    data: {
      applicationId: params.applicationId,
      assessorId: params.assessorId,
      status: "prepared",
      evidenceIndex,
      notes: params.notes,
      preparedAt: new Date(),
    },
  });

  await prisma.providerAccreditationApplication.update({
    where: { id: params.applicationId },
    data: { status: "assessment_in_progress" },
  });

  await recordApplicationEvent({
    applicationId: params.applicationId,
    actorId: params.assessorId,
    action: "assessment.evidence_index_prepared",
    metadata: { assessmentId: assessment.id, itemCount: evidenceIndex.length },
  });

  return assessment;
}

export async function requestClarification(params: {
  applicationId: string;
  requestedById: string;
  question: string;
}) {
  ensureProviderAccreditationEnabled();
  const clarification =
    await prisma.providerAccreditationClarification.create({
      data: {
        applicationId: params.applicationId,
        requestedById: params.requestedById,
        question: params.question,
        status: "open",
      },
    });

  await prisma.providerAccreditationApplication.update({
    where: { id: params.applicationId },
    data: { status: "clarification_requested" },
  });

  await recordApplicationEvent({
    applicationId: params.applicationId,
    actorId: params.requestedById,
    action: "clarification.requested",
    metadata: { clarificationId: clarification.id },
  });

  return clarification;
}

export async function respondToClarification(params: {
  clarificationId: string;
  response: string;
  actorId: string;
}) {
  ensureProviderAccreditationEnabled();
  const clarification =
    await prisma.providerAccreditationClarification.update({
      where: { id: params.clarificationId },
      data: {
        response: params.response,
        status: "responded",
        respondedAt: new Date(),
      },
    });

  await recordApplicationEvent({
    applicationId: clarification.applicationId,
    actorId: params.actorId,
    action: "clarification.responded",
    metadata: { clarificationId: clarification.id },
  });

  return clarification;
}

/** Human assessor decision only — never called automatically. */
export async function recordHumanDecision(params: {
  applicationId: string;
  deciderId: string;
  outcome: ProviderAccreditationDecisionOutcome;
  conditions?: string;
  effectiveAt?: Date;
  expiresAt?: Date;
  notes?: string;
}) {
  ensureProviderAccreditationEnabled();
  assertQualityComplianceAllowed("automatic_accreditation_decision");

  if (qualityAccreditationConfig.automaticAccreditationDecisionEnabled) {
    throw new Error("PROHIBITED_AUTOMATIC_ACCREDITATION_DECISION");
  }

  const decision = await prisma.providerAccreditationDecision.create({
    data: {
      applicationId: params.applicationId,
      deciderId: params.deciderId,
      outcome: params.outcome,
      conditions: params.conditions,
      effectiveAt: params.effectiveAt ?? new Date(),
      expiresAt: params.expiresAt,
      notes: params.notes,
    },
  });

  const statusMap: Record<
    ProviderAccreditationDecisionOutcome,
    ProviderAccreditationApplicationStatus
  > = {
    approved: "approved",
    conditionally_approved: "conditionally_approved",
    rejected: "rejected",
    suspended: "suspended",
  };

  await prisma.providerAccreditationApplication.update({
    where: { id: params.applicationId },
    data: {
      status: statusMap[params.outcome],
      expiresAt: params.expiresAt,
      suspendedAt: params.outcome === "suspended" ? new Date() : undefined,
    },
  });

  await recordApplicationEvent({
    applicationId: params.applicationId,
    actorId: params.deciderId,
    action: "decision.recorded",
    metadata: { decisionId: decision.id, outcome: params.outcome },
  });

  await createAuditEvent({
    actorUserId: params.deciderId,
    action: "provider_accreditation.decision",
    entityType: "ProviderAccreditationApplication",
    entityId: params.applicationId,
    metadata: { outcome: params.outcome },
  });

  return decision;
}

export async function submitAppeal(params: {
  applicationId: string;
  appellantId: string;
  reason: string;
}) {
  ensureProviderAccreditationEnabled();
  const appeal = await prisma.providerAccreditationAppealRecord.create({
    data: {
      applicationId: params.applicationId,
      appellantId: params.appellantId,
      reason: params.reason,
      status: "submitted",
    },
  });

  await prisma.providerAccreditationApplication.update({
    where: { id: params.applicationId },
    data: { status: "appealed" },
  });

  await recordApplicationEvent({
    applicationId: params.applicationId,
    actorId: params.appellantId,
    action: "appeal.submitted",
    metadata: { appealId: appeal.id },
  });

  return appeal;
}

export async function listApplicationsForOrganisation(organisationId: string) {
  ensureProviderAccreditationEnabled();
  return prisma.providerAccreditationApplication.findMany({
    where: { organisationId },
    include: {
      framework: true,
      decisions: { orderBy: { decidedAt: "desc" }, take: 1 },
      assessments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listApplicationsForReview() {
  ensureProviderAccreditationEnabled();
  return prisma.providerAccreditationApplication.findMany({
    where: {
      status: {
        in: [
          "submitted",
          "under_review",
          "clarification_requested",
          "assessment_in_progress",
          "pending_decision",
          "appealed",
        ],
      },
    },
    include: {
      organisation: { select: { id: true, name: true } },
      framework: { select: { id: true, code: true, name: true, version: true } },
      assessments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { submittedAt: "asc" },
  });
}

export async function getApplicationDetail(applicationId: string) {
  ensureProviderAccreditationEnabled();
  return prisma.providerAccreditationApplication.findUnique({
    where: { id: applicationId },
    include: {
      organisation: true,
      framework: {
        include: {
          outcomes: {
            include: {
              indicators: { include: { evidenceRequirements: true } },
            },
          },
        },
      },
      evidence: true,
      assessments: { orderBy: { createdAt: "desc" } },
      clarifications: { orderBy: { createdAt: "desc" } },
      decisions: { orderBy: { decidedAt: "desc" } },
      appeals: { orderBy: { submittedAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
      accessAccreditationAssessment: {
        include: { scores: true, place: { select: { name: true } } },
      },
    },
  });
}
