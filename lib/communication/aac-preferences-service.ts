import type { AacMethodType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureAacCommunicationEnabled } from "@/lib/config/mobile-communication";
import { prisma } from "@/lib/prisma";

export async function addPreferredQuestion(input: {
  passportId: string;
  participantId: string;
  prompt: string;
  responseHint?: string | null;
  sortOrder?: number;
  actorUserId: string;
}) {
  ensureAacCommunicationEnabled();

  await assertPassportOwnership(input.passportId, input.participantId);

  const created = await prisma.preferredQuestion.create({
    data: {
      passportId: input.passportId,
      prompt: input.prompt,
      responseHint: input.responseHint ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "preferred_question.created",
    entityType: "PreferredQuestion",
    entityId: created.id,
  });

  return created;
}

export async function addSavedPhrase(input: {
  passportId: string;
  participantId: string;
  label: string;
  text: string;
  category?: string | null;
  sortOrder?: number;
  actorUserId: string;
}) {
  ensureAacCommunicationEnabled();
  await assertPassportOwnership(input.passportId, input.participantId);

  const created = await prisma.savedPhrase.create({
    data: {
      passportId: input.passportId,
      label: input.label,
      text: input.text,
      category: input.category ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "saved_phrase.created",
    entityType: "SavedPhrase",
    entityId: created.id,
  });

  return created;
}

export async function upsertAacMethodPreference(input: {
  passportId: string;
  participantId: string;
  method: AacMethodType;
  label?: string | null;
  preferred?: boolean;
  notes?: string | null;
  sortOrder?: number;
  actorUserId: string;
}) {
  ensureAacCommunicationEnabled();
  await assertPassportOwnership(input.passportId, input.participantId);

  const existing = await prisma.aacMethodPreference.findFirst({
    where: { passportId: input.passportId, method: input.method },
  });

  const record = existing
    ? await prisma.aacMethodPreference.update({
        where: { id: existing.id },
        data: {
          label: input.label,
          preferred: input.preferred ?? existing.preferred,
          notes: input.notes,
          sortOrder: input.sortOrder ?? existing.sortOrder,
        },
      })
    : await prisma.aacMethodPreference.create({
        data: {
          passportId: input.passportId,
          method: input.method,
          label: input.label ?? null,
          preferred: input.preferred ?? false,
          notes: input.notes ?? null,
          sortOrder: input.sortOrder ?? 0,
        },
      });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "aac_method_preference.upserted",
    entityType: "AacMethodPreference",
    entityId: record.id,
  });

  return record;
}

export async function upsertEmergencyCard(input: {
  passportId: string;
  participantId: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  medicalNotes?: string | null;
  communicationNeeds?: string | null;
  accessInstructions?: string | null;
  actorUserId: string;
}) {
  ensureAacCommunicationEnabled();
  await assertPassportOwnership(input.passportId, input.participantId);

  const record = await prisma.emergencyCommunicationCard.upsert({
    where: { passportId: input.passportId },
    create: {
      passportId: input.passportId,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      medicalNotes: input.medicalNotes ?? null,
      communicationNeeds: input.communicationNeeds ?? null,
      accessInstructions: input.accessInstructions ?? null,
      lastReviewedAt: new Date(),
    },
    update: {
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      medicalNotes: input.medicalNotes,
      communicationNeeds: input.communicationNeeds,
      accessInstructions: input.accessInstructions,
      lastReviewedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "emergency_communication_card.upserted",
    entityType: "EmergencyCommunicationCard",
    entityId: record.id,
  });

  return record;
}

async function assertPassportOwnership(
  passportId: string,
  participantId: string,
): Promise<void> {
  const passport = await prisma.communicationPassport.findFirst({
    where: { id: passportId, participantId },
    select: { id: true },
  });
  if (!passport) throw new Error("PASSPORT_NOT_FOUND");
}
