import type { Prisma } from "@prisma/client";

import { ensureQualityQmsEnabled } from "@/lib/config/quality-accreditation";
import { prisma } from "@/lib/prisma";

export async function listPublishedFrameworks() {
  ensureQualityQmsEnabled();
  return prisma.standardFramework.findMany({
    where: { status: "published" },
    orderBy: [{ code: "asc" }, { version: "desc" }],
    include: {
      outcomes: {
        orderBy: { sortOrder: "asc" },
        include: {
          indicators: {
            orderBy: { sortOrder: "asc" },
            include: { evidenceRequirements: true },
          },
        },
      },
    },
  });
}

export async function getFrameworkById(frameworkId: string) {
  ensureQualityQmsEnabled();
  return prisma.standardFramework.findUnique({
    where: { id: frameworkId },
    include: {
      outcomes: {
        orderBy: { sortOrder: "asc" },
        include: {
          indicators: {
            orderBy: { sortOrder: "asc" },
            include: { evidenceRequirements: true },
          },
        },
      },
    },
  });
}

export async function createFramework(params: {
  code: string;
  name: string;
  version: string;
  description?: string;
  sourceRef?: string;
}) {
  ensureQualityQmsEnabled();
  return prisma.standardFramework.create({
    data: {
      code: params.code,
      name: params.name,
      version: params.version,
      description: params.description,
      sourceRef: params.sourceRef,
      status: "draft",
    },
  });
}

export async function publishFramework(frameworkId: string) {
  ensureQualityQmsEnabled();
  return prisma.standardFramework.update({
    where: { id: frameworkId },
    data: { status: "published", publishedAt: new Date() },
  });
}

export async function submitComplianceEvidence(params: {
  organisationId: string;
  requirementId: string;
  submittedById: string;
  sourceType: Prisma.ComplianceEvidenceCreateInput["sourceType"];
  sourceRef?: string;
  storagePath?: string;
  caption?: string;
}) {
  ensureQualityQmsEnabled();
  const latest = await prisma.complianceEvidence.findFirst({
    where: {
      organisationId: params.organisationId,
      requirementId: params.requirementId,
      supersededById: null,
    },
    orderBy: { version: "desc" },
  });

  const nextVersion = (latest?.version ?? 0) + 1;
  const evidence = await prisma.complianceEvidence.create({
    data: {
      organisationId: params.organisationId,
      requirementId: params.requirementId,
      version: nextVersion,
      sourceType: params.sourceType,
      sourceRef: params.sourceRef,
      storagePath: params.storagePath,
      caption: params.caption,
      submittedById: params.submittedById,
    },
  });

  if (latest) {
    await prisma.complianceEvidence.update({
      where: { id: latest.id },
      data: { supersededById: evidence.id },
    });
  }

  return evidence;
}

export async function assessEvidence(params: {
  evidenceId: string;
  assessorId: string;
  status: Prisma.EvidenceAssessmentCreateInput["status"];
  notes?: string;
}) {
  ensureQualityQmsEnabled();
  return prisma.evidenceAssessment.create({
    data: {
      evidenceId: params.evidenceId,
      assessorId: params.assessorId,
      status: params.status,
      notes: params.notes,
    },
  });
}

export async function listOrganisationEvidence(organisationId: string) {
  ensureQualityQmsEnabled();
  return prisma.complianceEvidence.findMany({
    where: { organisationId, supersededById: null },
    include: {
      requirement: {
        include: {
          indicator: {
            include: { outcome: { include: { framework: true } } },
          },
        },
      },
      assessments: { orderBy: { assessedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}
