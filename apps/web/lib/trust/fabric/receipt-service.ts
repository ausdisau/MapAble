import { randomUUID } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isTrustFabricEnabled } from "@/lib/config/trust-fabric";
import { prisma } from "@/lib/prisma";
import type {
  AccessFieldCategory,
  AccessOutcome,
  AuthoritySource,
  ParticipantAccessHistoryItem,
  PurposeBoundAccessReceiptInput,
} from "@/lib/trust/fabric/types";

export class TrustFabricError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "TrustFabricError";
    this.status = status;
  }
}

export function assertTrustFabricEnabled(): void {
  if (!isTrustFabricEnabled()) {
    throw new TrustFabricError("Trust Fabric is not enabled", 503);
  }
}

function normaliseCategories(categories: AccessFieldCategory[]): string[] {
  return Array.from(new Set(categories.map((c) => c.trim()).filter(Boolean)));
}

/**
 * Canonical writer for purpose-bound access receipts.
 * Does not create or replace ConsentRecord authority.
 */
export async function recordPurposeBoundAccessReceipt(
  input: PurposeBoundAccessReceiptInput,
): Promise<{ id: string; correlationId: string } | null> {
  if (!isTrustFabricEnabled()) {
    return null;
  }

  const purpose = input.purpose.trim();
  if (purpose.length < 3) {
    throw new TrustFabricError("purpose must be at least 3 characters", 400);
  }

  const fieldCategories = normaliseCategories(input.fieldCategories);
  if (fieldCategories.length === 0) {
    throw new TrustFabricError("fieldCategories required", 400);
  }

  const correlationId = input.correlationId?.trim() || randomUUID();

  const receipt = await prisma.participantAccessReceipt.create({
    data: {
      participantId: input.participantId,
      actorUserId: input.actorUserId ?? null,
      organisationId: input.organisationId ?? null,
      purpose,
      fieldCategories,
      authoritySource: input.authoritySource,
      authorityRef: input.authorityRef ?? null,
      consentRecordId: input.consentRecordId ?? null,
      expiresAt: input.expiresAt ?? null,
      correlationId,
      outcome: input.outcome,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "trust_fabric.access_receipt.created",
    entityType: "ParticipantAccessReceipt",
    entityId: receipt.id,
    participantId: input.participantId,
    organisationId: input.organisationId,
    metadata: {
      purpose,
      fieldCategories,
      authoritySource: input.authoritySource,
      outcome: input.outcome,
      correlationId,
    },
  });

  return { id: receipt.id, correlationId };
}

async function resolveAuthorityActive(params: {
  authoritySource: string;
  consentRecordId: string | null;
  expiresAt: Date | null;
}): Promise<boolean> {
  const now = Date.now();
  if (params.expiresAt && params.expiresAt.getTime() <= now) {
    return false;
  }
  if (params.authoritySource === "break_glass") {
    return Boolean(params.expiresAt && params.expiresAt.getTime() > now);
  }
  if (params.consentRecordId) {
    const consent = await prisma.consentRecord.findUnique({
      where: { id: params.consentRecordId },
      select: { status: true, expiryDate: true },
    });
    if (!consent || consent.status !== "active") return false;
    if (consent.expiryDate && consent.expiryDate.getTime() <= now) return false;
    return true;
  }
  if (params.authoritySource === "participant_self") return true;
  return Boolean(!params.expiresAt || params.expiresAt.getTime() > now);
}

/**
 * Participant-facing history — categories only, no security internals.
 */
export async function listParticipantAccessHistory(
  participantId: string,
  viewerUserId: string,
): Promise<ParticipantAccessHistoryItem[]> {
  assertTrustFabricEnabled();
  if (participantId !== viewerUserId) {
    throw new TrustFabricError("Access denied", 403);
  }

  const rows = await prisma.participantAccessReceipt.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      actorUser: { select: { id: true, name: true } },
      organisation: { select: { id: true, name: true } },
    },
  });

  const items: ParticipantAccessHistoryItem[] = [];
  for (const row of rows) {
    const authorityActive = await resolveAuthorityActive({
      authoritySource: row.authoritySource,
      consentRecordId: row.consentRecordId,
      expiresAt: row.expiresAt,
    });
    items.push({
      id: row.id,
      actorDisplayName: row.actorUser?.name ?? "Unknown actor",
      organisationName: row.organisation?.name ?? null,
      purpose: row.purpose,
      fieldCategories: row.fieldCategories,
      authoritySource: row.authoritySource,
      authorityActive,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      outcome: row.outcome,
      challenged: Boolean(row.challengedAt),
      createdAt: row.createdAt.toISOString(),
      canChallenge:
        !row.challengedAt &&
        (row.outcome === "disclosed" || row.outcome === "exported"),
      consentRecordId: row.consentRecordId,
    });
  }
  return items;
}

export async function challengeAccessReceipt(input: {
  receiptId: string;
  participantId: string;
  note?: string;
}): Promise<{ receiptId: string; consentRevokeSuggested: boolean }> {
  assertTrustFabricEnabled();
  const receipt = await prisma.participantAccessReceipt.findUnique({
    where: { id: input.receiptId },
  });
  if (!receipt || receipt.participantId !== input.participantId) {
    throw new TrustFabricError("Receipt not found", 404);
  }
  if (receipt.challengedAt) {
    throw new TrustFabricError("Receipt already challenged", 409);
  }

  const note = input.note?.trim().slice(0, 1000) || null;
  const challengedOutcome: AccessOutcome = "challenged";
  await prisma.participantAccessReceipt.update({
    where: { id: receipt.id },
    data: {
      challengedAt: new Date(),
      challengeNote: note,
      outcome: challengedOutcome,
    },
  });

  await createAuditEvent({
    actorUserId: input.participantId,
    action: "trust_fabric.access_receipt.challenged",
    entityType: "ParticipantAccessReceipt",
    entityId: receipt.id,
    participantId: input.participantId,
    organisationId: receipt.organisationId,
    metadata: {
      note,
      consentRecordId: receipt.consentRecordId,
      correlationId: receipt.correlationId,
    },
  });

  return {
    receiptId: receipt.id,
    consentRevokeSuggested: Boolean(receipt.consentRecordId),
  };
}

export async function recordDisclosureReceipt(input: {
  actorUserId: string;
  participantId: string;
  organisationId?: string;
  purpose: string;
  fieldCategories: AccessFieldCategory[];
  authoritySource?: AuthoritySource;
  consentRecordId?: string;
  expiresAt?: Date | null;
  correlationId?: string;
}): Promise<{ id: string; correlationId: string } | null> {
  return recordPurposeBoundAccessReceipt({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    organisationId: input.organisationId,
    purpose: input.purpose,
    fieldCategories: input.fieldCategories,
    authoritySource: input.authoritySource ?? "consent",
    consentRecordId: input.consentRecordId,
    expiresAt: input.expiresAt,
    correlationId: input.correlationId,
    outcome: "disclosed",
  });
}
