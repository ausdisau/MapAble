import type {
  BillingServiceRecord,
  BillingServiceRecordSourceType,
  BillingServiceType,
  BillingFundingSourceType,
  Prisma,
} from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { prisma } from "@/lib/prisma";

export type CreateServiceRecordFromSourceInput = {
  organisationId?: string | null;
  participantId: string;
  sourceType: BillingServiceRecordSourceType;
  sourceId: string;
  serviceType: BillingServiceType;
  serviceStart: Date;
  serviceEnd?: Date | null;
  quantity?: number;
  unit?: string;
  supportItemCode?: string | null;
  workerOrProviderId?: string | null;
  fundingSourceType?: BillingFundingSourceType | null;
  estimatedCents?: number;
  notesForBilling?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
};

/**
 * Create (or return existing) service record projection from an ops source.
 * Unique on (sourceType, sourceId) — duplicate sources are idempotent.
 */
export async function createFromSource(
  input: CreateServiceRecordFromSourceInput
): Promise<BillingServiceRecord> {
  const existing = await prisma.billingServiceRecord.findUnique({
    where: {
      sourceType_sourceId: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    },
  });
  if (existing) {
    return existing;
  }

  const record = await prisma.billingServiceRecord.create({
    data: {
      organisationId: input.organisationId ?? undefined,
      participantId: input.participantId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      serviceType: input.serviceType,
      status: "open",
      serviceStart: input.serviceStart,
      serviceEnd: input.serviceEnd ?? undefined,
      quantity: input.quantity ?? 1,
      unit: input.unit ?? "hour",
      supportItemCode: input.supportItemCode ?? undefined,
      workerOrProviderId: input.workerOrProviderId ?? undefined,
      fundingSourceType: input.fundingSourceType ?? undefined,
      estimatedCents: input.estimatedCents ?? 0,
      notesForBilling: input.notesForBilling ?? undefined,
    },
  });

  await writeFinancialAudit({
    organisationId: input.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "service_record_created",
    entityType: "BillingServiceRecord",
    entityId: record.id,
    participantId: input.participantId,
    newValues: {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      serviceType: input.serviceType,
    },
  });

  return record;
}

export type LockServiceRecordInput = {
  serviceRecordId: string;
  actorId: string;
  actorRole?: string | null;
  reason?: string;
};

/**
 * Lock a service record so charge generation may proceed.
 * Charge generation must refuse unlocked records.
 */
export async function lockServiceRecord(
  input: LockServiceRecordInput
): Promise<BillingServiceRecord> {
  const record = await prisma.billingServiceRecord.findUnique({
    where: { id: input.serviceRecordId },
    include: { evidence: true },
  });
  if (!record) {
    throw new Error(`Service record not found: ${input.serviceRecordId}`);
  }
  if (record.status === "cancelled") {
    throw new Error("Cannot lock a cancelled service record");
  }
  if (record.status === "locked" || record.status === "charged" || record.status === "invoiced") {
    return record;
  }

  const updated = await prisma.billingServiceRecord.update({
    where: { id: record.id },
    data: {
      status: "locked",
      lockedAt: new Date(),
      lockedByUserId: input.actorId,
    },
  });

  await writeFinancialAudit({
    organisationId: record.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "service_record_locked",
    entityType: "BillingServiceRecord",
    entityId: record.id,
    participantId: record.participantId,
    previousValues: { status: record.status },
    newValues: { status: "locked" },
    reason: input.reason,
  });

  return updated;
}

/**
 * Assert the service record is locked before charge generation.
 */
export function assertServiceRecordLocked(record: {
  status: string;
  lockedAt: Date | null;
}): void {
  if (record.status !== "locked" && record.status !== "charged") {
    throw new Error(
      "Charge generation refused: service record must be locked first."
    );
  }
  if (!record.lockedAt && record.status === "locked") {
    throw new Error(
      "Charge generation refused: service record lock timestamp missing."
    );
  }
}

export type ListUnbilledInput = {
  organisationId?: string | null;
  participantId?: string | null;
  take?: number;
};

export async function listUnbilled(
  input: ListUnbilledInput = {}
): Promise<BillingServiceRecord[]> {
  return prisma.billingServiceRecord.findMany({
    where: {
      invoiceId: null,
      status: { in: ["open", "evidence_pending", "locked", "charged"] },
      ...(input.organisationId
        ? { organisationId: input.organisationId }
        : {}),
      ...(input.participantId ? { participantId: input.participantId } : {}),
    },
    orderBy: { serviceStart: "asc" },
    take: input.take ?? 100,
  });
}

export type AttachEvidenceInput = {
  serviceRecordId: string;
  evidenceType: string;
  summary: string;
  referenceId?: string | null;
  metadata?: Prisma.InputJsonValue;
  actorId?: string | null;
  actorRole?: string | null;
};

export async function attachEvidence(input: AttachEvidenceInput) {
  const record = await prisma.billingServiceRecord.findUnique({
    where: { id: input.serviceRecordId },
  });
  if (!record) {
    throw new Error(`Service record not found: ${input.serviceRecordId}`);
  }
  if (record.status === "cancelled" || record.status === "invoiced") {
    throw new Error(
      `Cannot attach evidence to service record in status ${record.status}`
    );
  }

  const evidence = await prisma.billingServiceEvidence.create({
    data: {
      serviceRecordId: record.id,
      evidenceType: input.evidenceType,
      summary: input.summary,
      referenceId: input.referenceId ?? undefined,
      metadata: input.metadata,
      status: "submitted",
    },
  });

  if (record.status === "open" || record.status === "evidence_pending") {
    await prisma.billingServiceRecord.update({
      where: { id: record.id },
      data: { status: "evidence_pending" },
    });
  }

  await writeFinancialAudit({
    organisationId: record.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "service_evidence_attached",
    entityType: "BillingServiceEvidence",
    entityId: evidence.id,
    participantId: record.participantId,
    newValues: {
      serviceRecordId: record.id,
      evidenceType: input.evidenceType,
    },
  });

  return evidence;
}
