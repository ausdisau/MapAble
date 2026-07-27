import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureMovesRehabilitationEnabled,
  movesRehabilitationConfig,
} from "@/lib/config/moves-rehabilitation";
import { assertClinicalBoundaryAllowed } from "@/lib/moves/clinical-boundaries";
import { requireClinicalAuthor } from "@/lib/moves/plans-service";
import { prisma } from "@/lib/prisma";
import { mockVideoAdapter } from "@/lib/telehealth/video/mock-video-adapter";

export interface CreateTelehealthSessionInput {
  participantId: string;
  clinicianId?: string | null;
  planId?: string | null;
  scheduledAt: Date;
}

export async function createTelehealthSessionRecord(
  input: CreateTelehealthSessionInput,
  actorUserId: string,
) {
  ensureMovesRehabilitationEnabled();
  if (!movesRehabilitationConfig.telehealthEnabled) {
    throw new Error("MOVES_TELEHEALTH_DISABLED");
  }
  assertClinicalBoundaryAllowed("create_telehealth_session");

  if (input.clinicianId) {
    await requireClinicalAuthor(input.clinicianId);
  } else {
    await requireClinicalAuthor(actorUserId);
  }

  const clinicianId = input.clinicianId ?? actorUserId;
  const external = await mockVideoAdapter.createRoom({
    roomId: `moves-${input.participantId}-${Date.now()}`,
  });

  const session = await prisma.telehealthSessionRecord.create({
    data: {
      participantId: input.participantId,
      clinicianId,
      planId: input.planId ?? null,
      scheduledAt: input.scheduledAt,
      joinUrl: external.joinUrl,
      status: "scheduled",
    },
  });

  await createAuditEvent({
    actorUserId,
    participantId: input.participantId,
    action: "moves.telehealth.session_created",
    entityType: "TelehealthSessionRecord",
    entityId: session.id,
  });

  return session;
}

export interface ImportDeviceDataInput {
  participantId: string;
  sourceLabel: string;
  payload: Record<string, unknown>;
}

export async function importHealthDeviceData(
  input: ImportDeviceDataInput,
  actorUserId: string,
) {
  ensureMovesRehabilitationEnabled();
  if (!movesRehabilitationConfig.deviceImportEnabled) {
    throw new Error("MOVES_DEVICE_IMPORT_DISABLED");
  }
  assertClinicalBoundaryAllowed("import_device_data");

  if (!input.sourceLabel.trim()) {
    throw new Error("SOURCE_LABEL_REQUIRED");
  }

  const record = await prisma.healthDeviceImport.create({
    data: {
      participantId: input.participantId,
      sourceLabel: input.sourceLabel.trim(),
      payloadJson: input.payload as Prisma.InputJsonValue,
    },
  });

  await createAuditEvent({
    actorUserId,
    participantId: input.participantId,
    action: "moves.device.imported",
    entityType: "HealthDeviceImport",
    entityId: record.id,
    metadata: { sourceLabel: input.sourceLabel },
  });

  return record;
}

export async function revokeHealthDeviceImport(input: {
  importId: string;
  participantId: string;
  actorUserId: string;
}) {
  ensureMovesRehabilitationEnabled();
  if (!movesRehabilitationConfig.deviceImportEnabled) {
    throw new Error("MOVES_DEVICE_IMPORT_DISABLED");
  }

  const existing = await prisma.healthDeviceImport.findUnique({
    where: { id: input.importId },
  });
  if (!existing) throw new Error("DEVICE_IMPORT_NOT_FOUND");
  if (existing.participantId !== input.participantId) {
    throw new Error("PARTICIPANT_MISMATCH");
  }
  if (existing.revokedAt) throw new Error("DEVICE_IMPORT_ALREADY_REVOKED");

  const revoked = await prisma.healthDeviceImport.update({
    where: { id: input.importId },
    data: { revokedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "moves.device.revoked",
    entityType: "HealthDeviceImport",
    entityId: revoked.id,
    metadata: { sourceLabel: existing.sourceLabel },
  });

  return revoked;
}

export async function listDeviceImports(participantId: string) {
  ensureMovesRehabilitationEnabled();

  return prisma.healthDeviceImport.findMany({
    where: { participantId },
    orderBy: { importedAt: "desc" },
  });
}

export async function listTelehealthSessions(participantId: string) {
  ensureMovesRehabilitationEnabled();

  return prisma.telehealthSessionRecord.findMany({
    where: { participantId },
    orderBy: { scheduledAt: "desc" },
  });
}
