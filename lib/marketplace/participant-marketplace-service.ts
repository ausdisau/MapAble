import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { participantMarketplaceConfig } from "@/lib/config/participant-marketplace";
import { prisma } from "@/lib/prisma";

function assertEnabled() {
  if (!participantMarketplaceConfig.enabled) {
    throw new Error("PARTICIPANT_MARKETPLACE_DISABLED");
  }
}

export async function createParticipantGoal(input: {
  participantId: string;
  title: string;
  description: string;
  category: string;
  desiredBy?: Date;
  importance?: string;
  participantLanguage: string;
}) {
  assertEnabled();
  const goal = await prisma.participantGoal.create({ data: input });
  await createAuditEvent({
    actorUserId: input.participantId,
    participantId: input.participantId,
    action: "participant_goal.created",
    entityType: "ParticipantGoal",
    entityId: goal.id,
  });
  return goal;
}

export async function reviseParticipantGoal(input: {
  goalId: string;
  participantId: string;
  title: string;
  description: string;
  status: string;
}) {
  assertEnabled();
  const current = await prisma.participantGoal.findFirst({
    where: { id: input.goalId, participantId: input.participantId },
  });
  if (!current) throw new Error("GOAL_NOT_FOUND");
  return prisma.$transaction(async (tx) => {
    await tx.participantGoal.update({
      where: { id: current.id },
      data: { status: "changed" },
    });
    return tx.participantGoal.create({
      data: {
        participantId: input.participantId,
        title: input.title,
        description: input.description,
        category: current.category,
        desiredBy: current.desiredBy,
        importance: current.importance,
        participantLanguage: current.participantLanguage,
        status: input.status,
        revision: current.revision + 1,
        supersedesGoalId: current.id,
      },
    });
  });
}

export async function discoverProviders(input: {
  participantId: string;
  serviceType?: string;
  serviceArea?: string;
  deliveryMode?: string;
  communicationCapability?: string;
  accessibilityFeature?: string;
}) {
  assertEnabled();
  const hidden = await prisma.participantHiddenProvider.findMany({
    where: { participantId: input.participantId },
    select: { providerOrgId: true },
  });
  const hiddenIds = hidden.map((item) => item.providerOrgId);
  const organisations = await prisma.organisation.findMany({
    where: {
      id: { notIn: hiddenIds },
      status: "active",
      serviceOfferings: {
        some: {
          deletedAt: null,
          status: "active",
          ...(input.serviceType ? { serviceType: input.serviceType } : {}),
          ...(input.serviceArea ? { serviceAreas: { has: input.serviceArea } } : {}),
          ...(input.deliveryMode
            ? { deliveryModes: { has: input.deliveryMode } }
            : {}),
          ...(input.communicationCapability
            ? {
                communicationCapabilities: {
                  has: input.communicationCapability,
                },
              }
            : {}),
          ...(input.accessibilityFeature
            ? {
                accessibilityFeatures: {
                  has: input.accessibilityFeature,
                },
              }
            : {}),
        },
      },
    },
    include: {
      serviceOfferings: {
        where: { deletedAt: null, status: "active" },
      },
      providerCapabilityEvidence: {
        where: { revokedAt: null },
        orderBy: { updatedAt: "desc" },
      },
      capacityBlocks: {
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
    take: 50,
  });
  return organisations.map((organisation) => ({
    organisationId: organisation.id,
    displayName: organisation.name,
    serviceOfferings: organisation.serviceOfferings,
    evidence: organisation.providerCapabilityEvidence.map((evidence) => ({
      capability: evidence.capability,
      source: evidence.source,
      verificationStatus: evidence.verificationStatus,
      observedAt: evidence.updatedAt.toISOString(),
      expiresAt: evidence.expiresAt?.toISOString(),
    })),
    capacity: organisation.capacityBlocks[0]
      ? {
          available: Math.max(
            0,
            organisation.capacityBlocks[0].totalCapacity -
              organisation.capacityBlocks[0].bookedCapacity,
          ),
          observedAt: organisation.capacityBlocks[0].updatedAt.toISOString(),
        }
      : null,
    sponsored: false,
  }));
}

export async function setProviderShortlist(input: {
  participantId: string;
  providerOrgId: string;
  shortlisted: boolean;
}) {
  assertEnabled();
  if (input.shortlisted) {
    await prisma.participantHiddenProvider.deleteMany({
      where: {
        participantId: input.participantId,
        providerOrgId: input.providerOrgId,
      },
    });
    return prisma.participantProviderShortlist.upsert({
      where: {
        participantId_providerOrgId: {
          participantId: input.participantId,
          providerOrgId: input.providerOrgId,
        },
      },
      create: input,
      update: {},
    });
  }
  return prisma.participantProviderShortlist.deleteMany({
    where: input,
  });
}

export async function hideProvider(input: {
  participantId: string;
  providerOrgId: string;
}) {
  assertEnabled();
  await prisma.participantProviderShortlist.deleteMany({ where: input });
  return prisma.participantHiddenProvider.upsert({
    where: {
      participantId_providerOrgId: input,
    },
    create: input,
    update: {},
  });
}

export function compareProviderEvidence(
  providers: Awaited<ReturnType<typeof discoverProviders>>,
) {
  return providers.map((provider) => ({
    providerId: provider.organisationId,
    eligibility:
      provider.capacity?.available === 0
        ? ("not_currently_available" as const)
        : provider.evidence.some(
              (item) => item.verificationStatus === "verified",
            )
          ? ("meets_known_requirements" as const)
          : ("missing_information" as const),
    verifiedEvidence: provider.evidence.filter(
      (item) => item.verificationStatus === "verified",
    ),
    providerStatements: provider.evidence.filter(
      (item) => item.verificationStatus !== "verified",
    ),
    capacityEvidence: provider.capacity,
    limitations: [
      ...(!provider.capacity ? ["Current capacity evidence is unknown"] : []),
      ...(provider.evidence.length === 0
        ? ["Accessibility and capability evidence is missing"]
        : []),
    ],
    sponsored: false,
  }));
}
