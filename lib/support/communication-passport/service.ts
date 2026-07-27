import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isCommunicationPassportEnabled } from "@/lib/config/communication-workforce";
import { prisma } from "@/lib/prisma";
import {
  communicationPassportFromProfile,
  workerFacingPassportSubset,
} from "@/lib/support/communication-passport/from-profile";
import type {
  CommunicationPassport,
  WorkerPassportAcknowledgement,
} from "@/lib/support/communication-passport/types";
import { recordDisclosureReceipt } from "@/lib/trust/fabric/receipt-service";

export class CommunicationPassportError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CommunicationPassportError";
    this.status = status;
  }
}

export function assertCommunicationPassportEnabled(): void {
  if (!isCommunicationPassportEnabled()) {
    throw new CommunicationPassportError(
      "Communication Passport is not enabled",
      503,
    );
  }
}

export async function getCommunicationPassport(
  participantId: string,
): Promise<CommunicationPassport> {
  assertCommunicationPassportEnabled();
  let profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: participantId },
  });
  if (!profile) {
    profile = await prisma.accessibilityProfile.create({
      data: { userId: participantId },
    });
  }
  return communicationPassportFromProfile(profile);
}

export async function updateCommunicationPassportModes(input: {
  participantId: string;
  modes: string[];
  cognitive?: {
    oneQuestionAtATime?: boolean;
    extraResponseTime?: boolean;
    writtenAndSpoken?: boolean;
    usesAac?: boolean;
  };
}): Promise<CommunicationPassport> {
  assertCommunicationPassportEnabled();
  const existing = await prisma.accessibilityProfile.findUnique({
    where: { userId: input.participantId },
  });
  const priorCognitive =
    existing?.cognitivePreferences &&
    typeof existing.cognitivePreferences === "object"
      ? (existing.cognitivePreferences as Record<string, unknown>)
      : {};
  const nextVersion =
    (typeof priorCognitive.communicationPassportVersion === "number"
      ? priorCognitive.communicationPassportVersion
      : 0) + 1;

  const profile = await prisma.accessibilityProfile.upsert({
    where: { userId: input.participantId },
    create: {
      userId: input.participantId,
      communicationPreferences: input.modes,
      cognitivePreferences: {
        ...input.cognitive,
        communicationPassportVersion: nextVersion,
      },
    },
    update: {
      communicationPreferences: input.modes,
      cognitivePreferences: {
        ...priorCognitive,
        ...input.cognitive,
        communicationPassportVersion: nextVersion,
      },
    },
  });

  await createAuditEvent({
    actorUserId: input.participantId,
    action: "communication_passport.updated",
    entityType: "CommunicationPassport",
    entityId: input.participantId,
    participantId: input.participantId,
    metadata: { version: nextVersion, modes: input.modes },
  });

  return communicationPassportFromProfile(profile);
}

/**
 * Purpose-bound worker view — caller must have already enforced consent/relationship.
 */
export async function getWorkerFacingPassport(input: {
  participantId: string;
  workerUserId: string;
  purpose: string;
}): Promise<ReturnType<typeof workerFacingPassportSubset>> {
  assertCommunicationPassportEnabled();
  if (!input.purpose.trim()) {
    throw new CommunicationPassportError("purpose is required", 400);
  }
  const passport = await getCommunicationPassport(input.participantId);
  await createAuditEvent({
    actorUserId: input.workerUserId,
    action: "communication_passport.disclosed",
    entityType: "CommunicationPassport",
    entityId: input.participantId,
    participantId: input.participantId,
    metadata: {
      purpose: input.purpose,
      version: passport.version,
      fields: passport.disclosableFieldKeys,
    },
  });
  await recordDisclosureReceipt({
    actorUserId: input.workerUserId,
    participantId: input.participantId,
    purpose: input.purpose,
    fieldCategories: ["communication_preferences", "cognitive_preferences"],
    authoritySource: "consent",
  });
  return workerFacingPassportSubset(passport);
}

export async function acknowledgeCommunicationPassport(input: {
  workerUserId: string;
  participantId: string;
  passportVersion: number;
  organisationId?: string;
}): Promise<WorkerPassportAcknowledgement> {
  assertCommunicationPassportEnabled();
  const passport = await getCommunicationPassport(input.participantId);
  if (input.passportVersion !== passport.version) {
    throw new CommunicationPassportError(
      "Passport version mismatch — refresh and acknowledge again",
      409,
    );
  }
  const acknowledgedAt = new Date().toISOString();
  await createAuditEvent({
    actorUserId: input.workerUserId,
    action: "communication_passport.acknowledged",
    entityType: "CommunicationPassport",
    entityId: input.participantId,
    participantId: input.participantId,
    organisationId: input.organisationId,
    metadata: {
      passportVersion: input.passportVersion,
      acknowledgedAt,
    },
  });
  return {
    workerUserId: input.workerUserId,
    participantId: input.participantId,
    passportVersion: input.passportVersion,
    acknowledgedAt,
    organisationId: input.organisationId,
  };
}

export async function hasWorkerAcknowledgedPassport(input: {
  workerUserId: string;
  participantId: string;
  passportVersion: number;
}): Promise<boolean> {
  const event = await prisma.auditEvent.findFirst({
    where: {
      actorUserId: input.workerUserId,
      participantId: input.participantId,
      action: "communication_passport.acknowledged",
      entityType: "CommunicationPassport",
    },
    orderBy: { createdAt: "desc" },
  });
  if (!event?.metadata || typeof event.metadata !== "object") return false;
  const meta = event.metadata as Record<string, unknown>;
  return meta.passportVersion === input.passportVersion;
}
