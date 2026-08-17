import { ensureQualityQmsEnabled } from "@/lib/config/quality-accreditation";
import { prisma } from "@/lib/prisma";

export async function listPolicyDocuments(organisationId: string) {
  ensureQualityQmsEnabled();
  return prisma.policyDocument.findMany({
    where: { organisationId },
    include: {
      acknowledgements: { orderBy: { acknowledgedAt: "desc" }, take: 5 },
    },
    orderBy: [{ title: "asc" }, { version: "desc" }],
  });
}

export async function publishPolicyDocument(params: {
  organisationId: string;
  title: string;
  version: string;
  storagePath?: string;
  contentSummary?: string;
}) {
  ensureQualityQmsEnabled();
  return prisma.policyDocument.create({
    data: {
      organisationId: params.organisationId,
      title: params.title,
      version: params.version,
      storagePath: params.storagePath,
      contentSummary: params.contentSummary,
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function acknowledgePolicy(params: {
  policyDocumentId: string;
  userId: string;
  versionAcknowledged: string;
}) {
  ensureQualityQmsEnabled();
  return prisma.policyAcknowledgement.upsert({
    where: {
      policyDocumentId_userId_versionAcknowledged: {
        policyDocumentId: params.policyDocumentId,
        userId: params.userId,
        versionAcknowledged: params.versionAcknowledged,
      },
    },
    create: {
      policyDocumentId: params.policyDocumentId,
      userId: params.userId,
      versionAcknowledged: params.versionAcknowledged,
    },
    update: { acknowledgedAt: new Date() },
  });
}

export async function listTrainingRequirements(organisationId: string) {
  ensureQualityQmsEnabled();
  return prisma.trainingRequirement.findMany({
    where: { organisationId, status: "active" },
    include: {
      completions: { orderBy: { completedAt: "desc" }, take: 10 },
    },
    orderBy: { title: "asc" },
  });
}

export async function createTrainingRequirement(params: {
  organisationId: string;
  title: string;
  description?: string;
  renewalDays?: number;
  requiredRoles?: string[];
}) {
  ensureQualityQmsEnabled();
  return prisma.trainingRequirement.create({
    data: {
      organisationId: params.organisationId,
      title: params.title,
      description: params.description,
      renewalDays: params.renewalDays,
      requiredRoles: params.requiredRoles ?? [],
      status: "active",
    },
  });
}

export async function recordTrainingCompletion(params: {
  requirementId: string;
  userId: string;
  evidenceRef?: string;
  notes?: string;
  renewalDays?: number;
}) {
  ensureQualityQmsEnabled();
  const expiresAt =
    params.renewalDays != null
      ? new Date(Date.now() + params.renewalDays * 86400000)
      : undefined;

  return prisma.trainingCompletionRecord.create({
    data: {
      requirementId: params.requirementId,
      userId: params.userId,
      evidenceRef: params.evidenceRef,
      notes: params.notes,
      expiresAt,
    },
  });
}

export async function getPolicyTrainingDashboard(organisationId: string) {
  ensureQualityQmsEnabled();
  const [policies, requirements, recentAcks, recentCompletions] =
    await Promise.all([
      prisma.policyDocument.count({
        where: { organisationId, status: "published" },
      }),
      prisma.trainingRequirement.count({
        where: { organisationId, status: "active" },
      }),
      prisma.policyAcknowledgement.count({
        where: { policyDocument: { organisationId } },
      }),
      prisma.trainingCompletionRecord.count({
        where: { requirement: { organisationId } },
      }),
    ]);

  return { policies, requirements, recentAcks, recentCompletions };
}
