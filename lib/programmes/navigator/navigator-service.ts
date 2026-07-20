import { prisma } from "@/lib/prisma";
import { emitProgrammeAuditEvent } from "@/lib/programmes/audit";
import type {
  NavigatorProfileView,
  NavigatorSearchInput,
} from "@/lib/programmes/contracts/human-navigator-adapter";
import { assertDisclosureScope } from "@/lib/programmes/safety-invariants";

export async function searchNavigatorProfiles(
  input: NavigatorSearchInput,
): Promise<NavigatorProfileView[]> {
  const profiles = await prisma.navigatorProfile.findMany({
    where: {
      isActive: true,
      ...(input.visibility ? { visibility: input.visibility } : {}),
      ...(input.specialism
        ? {
            specialisms: {
              some: {
                specialism: { contains: input.specialism, mode: "insensitive" },
              },
            },
          }
        : {}),
      ...(input.regionCode
        ? { regions: { some: { regionCode: input.regionCode } } }
        : {}),
      ...(input.languageCode
        ? { languages: { some: { languageCode: input.languageCode } } }
        : {}),
      ...(input.communicationMode
        ? {
            communicationCapabilities: {
              some: { mode: input.communicationMode },
            },
          }
        : {}),
    },
    include: {
      specialisms: true,
      regions: true,
      languages: true,
      communicationCapabilities: true,
      navigatorOrganisation: true,
    },
    take: 25,
  });

  return profiles.map((profile) => ({
    id: profile.id,
    displayName: profile.displayName,
    specialisms: profile.specialisms.map((s) => s.specialism),
    regions: profile.regions.map((r) => r.regionName),
    languages: profile.languages.map((l) => l.languageCode),
    communicationModes: profile.communicationCapabilities.map((c) => c.mode),
    visibility: profile.visibility,
    organisationName: profile.navigatorOrganisation?.displayName,
  }));
}

export async function previewNavigatorAssignment(input: {
  participantId: string;
  navigatorId: string;
  requestedFields: string[];
}) {
  const allSensitiveFields = [
    "diagnosis",
    "financial_records",
    "full_profile",
    "unrelated_missions",
    "health_information",
  ];

  const sharedFields = input.requestedFields.filter(
    (field) => !allSensitiveFields.includes(field),
  );

  return {
    navigatorId: input.navigatorId,
    sharedFields,
    excludedFields: [
      ...allSensitiveFields,
      ...input.requestedFields.filter((f) => allSensitiveFields.includes(f)),
    ],
    requiresParticipantApproval: true as const,
  };
}

export async function createNavigatorRequest(input: {
  participantId: string;
  goalSummary: string;
  sharedFields: string[];
  preferredModes?: string[];
  caseId?: string;
  missionId?: string;
  correlationId: string;
  actorUserId: string;
}) {
  assertDisclosureScope({
    recipientId: "navigator-exchange",
    purpose: "navigator_assistance",
    fields: input.sharedFields,
  });

  const request = await prisma.navigatorRequest.create({
    data: {
      participantId: input.participantId,
      goalSummary: input.goalSummary,
      sharedFields: input.sharedFields,
      preferredModes: input.preferredModes ?? [],
      caseId: input.caseId,
      missionId: input.missionId,
      correlationId: input.correlationId,
      status: "pending_participant_approval",
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.actorUserId,
    action: "navigator.request.created",
    entityType: "NavigatorRequest",
    entityId: request.id,
    participantId: input.participantId,
    metadata: { sharedFields: input.sharedFields },
  });

  return request;
}

export async function approveNavigatorRequest(input: {
  requestId: string;
  participantId: string;
  correlationId: string;
}) {
  const request = await prisma.navigatorRequest.updateMany({
    where: {
      id: input.requestId,
      participantId: input.participantId,
      status: "pending_participant_approval",
    },
    data: {
      status: "submitted",
      approvedAt: new Date(),
    },
  });

  if (request.count === 0) {
    throw new Error("Navigator request not found or not awaiting approval");
  }

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.participantId,
    action: "navigator.request.approved",
    entityType: "NavigatorRequest",
    entityId: input.requestId,
    participantId: input.participantId,
  });

  return prisma.navigatorRequest.findUnique({ where: { id: input.requestId } });
}

export async function assignNavigator(input: {
  requestId: string;
  participantId: string;
  navigatorId: string;
  navigatorProfileId?: string;
  sharedFields: string[];
  correlationId: string;
  actorUserId: string;
}) {
  const assignment = await prisma.navigatorAssignment.create({
    data: {
      requestId: input.requestId,
      participantId: input.participantId,
      navigatorId: input.navigatorId,
      navigatorProfileId: input.navigatorProfileId,
      sharedFields: input.sharedFields,
      correlationId: input.correlationId,
      status: "pending",
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.actorUserId,
    action: "navigator.assigned",
    entityType: "NavigatorAssignment",
    entityId: assignment.id,
    participantId: input.participantId,
    metadata: { sharedFields: input.sharedFields },
  });

  return assignment;
}

export async function revokeNavigatorAssignment(input: {
  assignmentId: string;
  participantId: string;
  correlationId: string;
}) {
  const assignment = await prisma.navigatorAssignment.updateMany({
    where: {
      id: input.assignmentId,
      participantId: input.participantId,
      status: { in: ["pending", "active"] },
    },
    data: { status: "revoked" },
  });

  if (assignment.count === 0) {
    throw new Error("Navigator assignment not found or already closed");
  }

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.participantId,
    action: "navigator.assignment.revoked",
    entityType: "NavigatorAssignment",
    entityId: input.assignmentId,
    participantId: input.participantId,
  });
}
