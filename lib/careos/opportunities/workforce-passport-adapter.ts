import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import { prisma } from "@/lib/prisma";

function assertPassportEnabled() {
  if (!careosOpportunitiesConfig.workforcePassportEnabled) {
    throw new Error("WORKFORCE_PASSPORT_DISABLED");
  }
  if (careosOpportunitiesConfig.autoVerifyCompetencyEnabled) {
    throw new Error("AUTO_VERIFY_COMPETENCY_FORBIDDEN");
  }
}

/**
 * O8 — Academy → competency adapter.
 * Completions propose pending evidence only; humans verify.
 */
export async function proposeCompetencyFromAcademy(input: {
  workerProfileId: string;
  courseId: string;
  competencyType: string;
  proposedByUserId: string;
}) {
  assertPassportEnabled();

  const enrollment = await prisma.providerAcademyEnrollment.findFirst({
    where: {
      courseId: input.courseId,
      status: { in: ["completed", "enrolled"] },
    },
    include: { course: true },
  });
  if (!enrollment) throw new Error("ACADEMY_ENROLLMENT_NOT_FOUND");

  const evidence = await prisma.workerCompetencyEvidence.create({
    data: {
      workerProfileId: input.workerProfileId,
      competencyType: input.competencyType,
      source: `academy:${input.courseId}`,
      verificationStatus: "pending",
      effectiveAt: new Date(),
      limitations: [
        "Pending human verification — not usable for automatic assignment",
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

  const completion = await prisma.workerTrainingCompletion.findUnique({
    where: { id: input.trainingCompletionId },
  });
  if (!completion) throw new Error("TRAINING_COMPLETION_NOT_FOUND");

  const evidence = await prisma.workerCompetencyEvidence.create({
    data: {
      workerProfileId: input.workerProfileId,
      competencyType: input.competencyType,
      source: `training_completion:${input.trainingCompletionId}`,
      verificationStatus: "pending",
      effectiveAt: completion.completedAt,
      expiresAt: completion.expiresAt,
      limitations: ["Pending human verification"],
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
  verifiedByUserId: string;
  approve: boolean;
  rejectionReason?: string;
}) {
  assertPassportEnabled();

  const proposal = await prisma.academyCompetencyProposal.findUnique({
    where: { id: input.proposalId },
  });
  if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
  if (proposal.status !== "pending") throw new Error("PROPOSAL_NOT_PENDING");

  if (!input.approve) {
    if (proposal.evidenceId) {
      await prisma.workerCompetencyEvidence.update({
        where: { id: proposal.evidenceId },
        data: {
          verificationStatus: "rejected",
          revokedAt: new Date(),
        },
      });
    }
    return prisma.academyCompetencyProposal.update({
      where: { id: proposal.id },
      data: {
        status: "rejected",
        verifiedByUserId: input.verifiedByUserId,
        verifiedAt: new Date(),
        rejectionReason: input.rejectionReason ?? "Rejected by human reviewer",
      },
    });
  }

  if (proposal.evidenceId) {
    await prisma.workerCompetencyEvidence.update({
      where: { id: proposal.evidenceId },
      data: {
        verificationStatus: "verified",
        verifiedByUserId: input.verifiedByUserId,
        limitations: [],
      },
    });
  }

  return prisma.academyCompetencyProposal.update({
    where: { id: proposal.id },
    data: {
      status: "verified",
      verifiedByUserId: input.verifiedByUserId,
      verifiedAt: new Date(),
    },
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
