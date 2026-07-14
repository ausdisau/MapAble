import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureJobsParticipationEnabled } from "@/lib/config/jobs-participation";
import { prisma } from "@/lib/prisma";

export type EmploymentProfileInput = {
  participantId: string;
  actorUserId: string;
  skills?: string[];
  interests?: string[];
  preferredWorkTypes?: string[];
  preferredHours?: string[];
  preferredLocations?: string[];
  remotePreference?: string | null;
  communicationPrefs?: Prisma.InputJsonValue;
  adjustmentPrefs?: Prisma.InputJsonValue;
  disclosureChoices?: Prisma.InputJsonValue;
  transportDependency?: boolean;
  supportDependency?: boolean;
};

function assertParticipantAuthority(
  participantId: string,
  actorUserId: string,
): void {
  if (participantId !== actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
}

export async function getEmploymentProfile(participantId: string) {
  ensureJobsParticipationEnabled();
  return prisma.employmentProfile.findUnique({
    where: { participantId },
    include: {
      goals: { where: { status: { not: "archived" } }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function upsertEmploymentProfile(input: EmploymentProfileInput) {
  ensureJobsParticipationEnabled();
  assertParticipantAuthority(input.participantId, input.actorUserId);

  const profile = await prisma.employmentProfile.upsert({
    where: { participantId: input.participantId },
    create: {
      participantId: input.participantId,
      skills: input.skills ?? [],
      interests: input.interests ?? [],
      preferredWorkTypes: input.preferredWorkTypes ?? [],
      preferredHours: input.preferredHours ?? [],
      preferredLocations: input.preferredLocations ?? [],
      remotePreference: input.remotePreference ?? null,
      communicationPrefs: input.communicationPrefs ?? {},
      adjustmentPrefs: input.adjustmentPrefs ?? {},
      disclosureChoices: input.disclosureChoices ?? {},
      transportDependency: input.transportDependency ?? false,
      supportDependency: input.supportDependency ?? false,
    },
    update: {
      skills: input.skills,
      interests: input.interests,
      preferredWorkTypes: input.preferredWorkTypes,
      preferredHours: input.preferredHours,
      preferredLocations: input.preferredLocations,
      remotePreference: input.remotePreference,
      communicationPrefs: input.communicationPrefs,
      adjustmentPrefs: input.adjustmentPrefs,
      disclosureChoices: input.disclosureChoices,
      transportDependency: input.transportDependency,
      supportDependency: input.supportDependency,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "employment_profile.updated",
    entityType: "EmploymentProfile",
    entityId: profile.id,
  });

  return profile;
}
