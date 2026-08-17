import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureAacCommunicationEnabled,
  mobileCommunicationConfig,
} from "@/lib/config/mobile-communication";
import { prisma } from "@/lib/prisma";

const PASSPORT_INCLUDE = {
  preferredQuestions: { orderBy: { sortOrder: "asc" } },
  savedPhrases: { orderBy: { sortOrder: "asc" } },
  aacMethodPreferences: { orderBy: { sortOrder: "asc" } },
  emergencyCard: true,
} as const satisfies Prisma.CommunicationPassportInclude;

export type CommunicationPassportWithRelations =
  Prisma.CommunicationPassportGetPayload<{
    include: typeof PASSPORT_INCLUDE;
  }>;

export interface UpsertPassportInput {
  participantId: string;
  title?: string;
  aboutMe?: string | null;
  howICommunicate?: string | null;
  pleaseDo?: string | null;
  pleaseDont?: string | null;
  capacityNotes?: string | null;
  shareScope?: string[];
}

export async function getOrCreatePassport(
  participantId: string,
): Promise<CommunicationPassportWithRelations> {
  ensureAacCommunicationEnabled();

  const existing = await prisma.communicationPassport.findFirst({
    where: { participantId, status: { not: "archived" } },
    include: PASSPORT_INCLUDE,
  });

  if (existing) return existing;

  return prisma.communicationPassport.create({
    data: { participantId },
    include: PASSPORT_INCLUDE,
  });
}

export async function getPassportForParticipant(participantId: string) {
  ensureAacCommunicationEnabled();

  return prisma.communicationPassport.findFirst({
    where: { participantId, status: { not: "archived" } },
    include: PASSPORT_INCLUDE,
  });
}

export async function updatePassport(
  passportId: string,
  participantId: string,
  input: UpsertPassportInput,
  actorUserId: string,
) {
  ensureAacCommunicationEnabled();
  assertSpeechDifficultyNotCapacityReduction(input.capacityNotes);

  const passport = await prisma.communicationPassport.findFirst({
    where: { id: passportId, participantId },
  });
  if (!passport) throw new Error("PASSPORT_NOT_FOUND");

  const updated = await prisma.communicationPassport.update({
    where: { id: passportId },
    data: {
      title: input.title,
      aboutMe: input.aboutMe,
      howICommunicate: input.howICommunicate,
      pleaseDo: input.pleaseDo,
      pleaseDont: input.pleaseDont,
      capacityNotes: input.capacityNotes,
      shareScope: input.shareScope,
    },
    include: PASSPORT_INCLUDE,
  });

  await createAuditEvent({
    actorUserId,
    participantId,
    action: "communication_passport.updated",
    entityType: "CommunicationPassport",
    entityId: passportId,
  });

  return updated;
}

export async function publishPassport(
  passportId: string,
  participantId: string,
  actorUserId: string,
) {
  ensureAacCommunicationEnabled();

  const updated = await prisma.communicationPassport.update({
    where: { id: passportId, participantId },
    data: { status: "published", publishedAt: new Date() },
    include: PASSPORT_INCLUDE,
  });

  await createAuditEvent({
    actorUserId,
    participantId,
    action: "communication_passport.published",
    entityType: "CommunicationPassport",
    entityId: passportId,
  });

  return updated;
}

/**
 * Hard rule: speech difficulty is never treated as reduced capacity.
 * Rejects system-authored or inferred capacity-reduction language.
 */
export function assertSpeechDifficultyNotCapacityReduction(
  capacityNotes: string | null | undefined,
): void {
  if (mobileCommunicationConfig.speechDifficultyImpliesCapacityReduction) {
    throw new Error("PROHIBITED_SPEECH_DIFFICULTY_CAPACITY_REDUCTION");
  }

  if (!capacityNotes) return;

  const prohibitedPatterns = [
    /\bunable to (decide|consent|understand)\b/i,
    /\breduced capacity\b/i,
    /\black(?:s)? capacity\b/i,
    /\bincapable of (deciding|consenting)\b/i,
    /\bspeech difficulty implies\b/i,
  ];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(capacityNotes)) {
      throw new Error("PROHIBITED_CAPACITY_INFERENCE_FROM_SPEECH");
    }
  }
}
