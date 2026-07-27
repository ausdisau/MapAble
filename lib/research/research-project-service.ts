import type { Prisma } from "@prisma/client";

import {
  analyticsResearchConfig,
  ensureResearchGovernanceEnabled,
} from "@/lib/config/analytics-research";
import { prisma } from "@/lib/prisma";
import { shouldSuppressCohort } from "@/lib/platform/privacy/deidentification";

export async function createResearchProject(params: {
  title: string;
  description?: string;
  organisationId?: string;
  principalInvestigator?: string;
  syntheticDataOnly?: boolean;
}) {
  ensureResearchGovernanceEnabled();

  if (params.syntheticDataOnly === false) {
    throw new Error("NON_SYNTHETIC_REQUIRES_ETHICS");
  }

  return prisma.researchProject.create({
    data: {
      title: params.title,
      description: params.description,
      organisationId: params.organisationId,
      principalInvestigator: params.principalInvestigator,
      syntheticDataOnly: true,
      status: "draft",
    },
  });
}

export async function submitProjectForEthicsReview(projectId: string) {
  ensureResearchGovernanceEnabled();

  return prisma.researchProject.update({
    where: { id: projectId },
    data: { status: "ethics_review" },
  });
}

export async function recordEthicsApproval(params: {
  projectId: string;
  approvalNumber: string;
  expiresAt?: Date;
  conditions?: string;
}) {
  ensureResearchGovernanceEnabled();

  const approval = await prisma.ethicsApproval.create({
    data: {
      projectId: params.projectId,
      approvalNumber: params.approvalNumber,
      status: "approved",
      approvedAt: new Date(),
      expiresAt: params.expiresAt,
      conditions: params.conditions,
    },
  });

  await prisma.researchProject.update({
    where: { id: params.projectId },
    data: { status: "active" },
  });

  return approval;
}

export async function grantParticipantConsent(params: {
  projectId: string;
  participantId: string;
  consentNotes?: string;
}) {
  ensureResearchGovernanceEnabled();

  return prisma.participantResearchConsent.upsert({
    where: {
      projectId_participantId: {
        projectId: params.projectId,
        participantId: params.participantId,
      },
    },
    create: {
      projectId: params.projectId,
      participantId: params.participantId,
      status: "granted",
      grantedAt: new Date(),
      consentNotes: params.consentNotes,
    },
    update: {
      status: "granted",
      grantedAt: new Date(),
      withdrawnAt: null,
      consentNotes: params.consentNotes,
    },
  });
}

export async function createResearchCohort(params: {
  projectId: string;
  name: string;
  criteria?: Record<string, unknown>;
  participantCount: number;
}) {
  ensureResearchGovernanceEnabled();

  return prisma.researchCohort.create({
    data: {
      projectId: params.projectId,
      name: params.name,
      criteriaJson: params.criteria as Prisma.InputJsonValue | undefined,
      participantCount: params.participantCount,
      suppressed: shouldSuppressCohort(params.participantCount),
    },
  });
}

export async function createDataUseAgreement(params: {
  projectId: string;
  partnerName: string;
  scope: string;
}) {
  ensureResearchGovernanceEnabled();

  return prisma.dataUseAgreement.create({
    data: {
      projectId: params.projectId,
      partnerName: params.partnerName,
      scope: params.scope,
      status: "draft",
    },
  });
}

export async function activateDataUseAgreement(agreementId: string) {
  ensureResearchGovernanceEnabled();

  return prisma.dataUseAgreement.update({
    where: { id: agreementId },
    data: { status: "active", approvedAt: new Date() },
  });
}

export async function recordPublication(params: {
  projectId: string;
  title: string;
  doi?: string;
  acknowledgement?: string;
}) {
  ensureResearchGovernanceEnabled();

  return prisma.publicationRecord.create({
    data: {
      projectId: params.projectId,
      title: params.title,
      doi: params.doi,
      acknowledgement: params.acknowledgement,
      status: "draft",
    },
  });
}

export async function listResearchProjects(limit = 20) {
  if (!analyticsResearchConfig.researchGovernanceEnabled) {
    return { disabled: true as const, projects: [] };
  }

  const projects = await prisma.researchProject.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      ethicsApprovals: { where: { status: "approved" }, take: 1 },
      _count: { select: { consents: true, cohorts: true } },
    },
  });

  return { disabled: false as const, projects };
}

export async function getResearchProject(projectId: string) {
  ensureResearchGovernanceEnabled();

  return prisma.researchProject.findUnique({
    where: { id: projectId },
    include: {
      ethicsApprovals: true,
      dataUseAgreements: true,
      cohorts: true,
      publications: true,
      withdrawals: true,
    },
  });
}
