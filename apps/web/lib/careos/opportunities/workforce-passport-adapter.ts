import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import { prisma } from "@/lib/prisma";
import {
  cannotOverrideWithApprove,
  resolveScreeningGateway,
} from "@/lib/workforce/screening-gateway";

function assertPassportEnabled() {
  if (!careosOpportunitiesConfig.workforcePassportEnabled) {
    throw new Error("WORKFORCE_PASSPORT_DISABLED");
  }
  if (careosOpportunitiesConfig.autoVerifyCompetencyEnabled) {
    throw new Error("AUTO_VERIFY_COMPETENCY_FORBIDDEN");
  }
}

async function loadBoundWorker(workerProfileId: string) {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
  });
  if (!worker) throw new Error("WORKER_NOT_FOUND");
  if (!worker.userId) throw new Error("IDENTITY_NOT_BOUND");
  return worker;
}

async function assertProposerOrgOrSelf(
  proposedByUserId: string,
  worker: { userId: string | null; organisationId: string },
) {
  if (worker.userId && proposedByUserId === worker.userId) return;
  const membership = await prisma.organisationMember.findFirst({
    where: { userId: proposedByUserId, organisationId: worker.organisationId },
    select: { id: true },
  });
  if (!membership) throw new Error("ORG_WORKER_MISMATCH");
}

/**
 * O8 — Academy → competency adapter.
 * Completions propose pending evidence only; humans verify.
 * Enrolled is not completed. Course completion is not verified competency.
 */
export async function proposeCompetencyFromAcademy(input: {
  workerProfileId: string;
  courseId: string;
  competencyType: string;
  proposedByUserId: string;
}) {
  assertPassportEnabled();
  const worker = await loadBoundWorker(input.workerProfileId);
  await assertProposerOrgOrSelf(input.proposedByUserId, worker);

  const enrollment = await prisma.providerAcademyEnrollment.findFirst({
    where: {
      courseId: input.courseId,
      userId: worker.userId!,
    },
    include: { course: true },
  });
  if (!enrollment) throw new Error("ACADEMY_ENROLLMENT_NOT_FOUND");
  if (enrollment.status !== "completed" || !enrollment.completedAt) {
    throw new Error("ENROLLED_NOT_COMPLETED");
  }
  if (enrollment.courseId !== input.courseId) {
    throw new Error("ORG_WORKER_MISMATCH");
  }

  const evidence = await prisma.workerCompetencyEvidence.create({
    data: {
      workerProfileId: input.workerProfileId,
      competencyType: input.competencyType,
      source: `academy:${input.courseId}`,
      verificationStatus: "pending",
      effectiveAt: enrollment.completedAt,
      limitations: [
        "Pending human verification — not usable for automatic assignment",
        "Training completed. Practical competence not yet assessed.",
      ],
    },
  });

  const proposal = await prisma.academyCompetencyProposal.create({
    data: {
      workerProfileId: input.workerProfileId,
      courseId: input.courseId,
      competencyType: input.competencyType,
      evidenceId: evidence.id,
      status: "pending",
      proposedByUserId: input.proposedByUserId,
    },
  });

  return { proposal, evidence, autoVerified: false };
}

export async function proposeCompetencyFromTrainingCompletion(input: {
  workerProfileId: string;
  trainingCompletionId: string;
  competencyType: string;
  proposedByUserId: string;
}) {
  assertPassportEnabled();
  const worker = await loadBoundWorker(input.workerProfileId);
  await assertProposerOrgOrSelf(input.proposedByUserId, worker);

  const completion = await prisma.workerTrainingCompletion.findUnique({
    where: { id: input.trainingCompletionId },
  });
  if (!completion) throw new Error("TRAINING_COMPLETION_NOT_FOUND");
  if (completion.userId !== worker.userId) {
    throw new Error("IDENTITY_MISMATCH");
  }

  const evidence = await prisma.workerCompetencyEvidence.create({
    data: {
      workerProfileId: input.workerProfileId,
      competencyType: input.competencyType,
      source: `training_completion:${input.trainingCompletionId}`,
      verificationStatus: "pending",
      effectiveAt: completion.completedAt,
      expiresAt: completion.expiresAt,
      limitations: [
        "Pending human verification",
        "Training completed. Practical competence not yet assessed.",
      ],
    },
  });

  const proposal = await prisma.academyCompetencyProposal.create({
    data: {
      workerProfileId: input.workerProfileId,
      trainingCompletionId: input.trainingCompletionId,
      competencyType: input.competencyType,
      evidenceId: evidence.id,
      status: "pending",
      proposedByUserId: input.proposedByUserId,
    },
  });

  return { proposal, evidence, autoVerified: false };
}

export async function verifyCompetencyProposal(input: {
  proposalId: string;
  /** Server-resolved assessor from the session. Never trust a client-supplied id. */
  verifiedByUserId: string;
  approve: boolean;
  decision?: "hold" | "request_evidence" | "refer_for_assessment" | "escalate";
  rejectionReason?: string;
}) {
  assertPassportEnabled();

  return prisma.$transaction(async (tx) => {
    const proposal = await tx.academyCompetencyProposal.findUnique({
      where: { id: input.proposalId },
    });
    if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
    if (proposal.status !== "pending") throw new Error("PROPOSAL_NOT_PENDING");

    const worker = await tx.workerProfile.findUnique({
      where: { id: proposal.workerProfileId },
    });
    if (!worker) throw new Error("WORKER_NOT_FOUND");
    if (worker.userId && worker.userId === input.verifiedByUserId) {
      throw new Error("SELF_APPROVAL_FORBIDDEN");
    }

    const screening = await tx.workerScreeningRecord.findMany({
      where: { workerProfileId: worker.id },
    });
    const gateway = resolveScreeningGateway(screening);
    if (input.approve && cannotOverrideWithApprove(gateway)) {
      throw new Error("LEGAL_PROHIBITION_NOT_OVERRIDABLE");
    }

    if (!input.approve) {
      if (proposal.evidenceId) {
        await tx.workerCompetencyEvidence.update({
          where: { id: proposal.evidenceId },
          data: {
            verificationStatus: "rejected",
            revokedAt: new Date(),
            limitations: [
              input.decision ?? "hold",
              input.rejectionReason ?? "Rejected by human reviewer",
            ],
          },
        });
      }
      return tx.academyCompetencyProposal.update({
        where: { id: proposal.id },
        data: {
          status: "rejected",
          verifiedByUserId: input.verifiedByUserId,
          verifiedAt: new Date(),
          rejectionReason:
            input.rejectionReason ??
            input.decision ??
            "Rejected by human reviewer",
        },
      });
    }

    if (proposal.evidenceId) {
      await tx.workerCompetencyEvidence.update({
        where: { id: proposal.evidenceId },
        data: {
          verificationStatus: "verified",
          verifiedByUserId: input.verifiedByUserId,
          limitations: [
            "Human-assessed competency — not a general safety guarantee",
          ],
        },
      });
    }

    return tx.academyCompetencyProposal.update({
      where: { id: proposal.id },
      data: {
        status: "verified",
        verifiedByUserId: input.verifiedByUserId,
        verifiedAt: new Date(),
      },
    });
  });
}

export async function listCompetencyProposals(workerProfileId?: string) {
  assertPassportEnabled();
  return prisma.academyCompetencyProposal.findMany({
    where: workerProfileId ? { workerProfileId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
