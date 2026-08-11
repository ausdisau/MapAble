import { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { NAVIGATOR_AUDIT } from "@/lib/ai/navigator/gates";
import { isNavigatorMemoryEnabled } from "@/lib/config/navigator-pilot";
import { prisma } from "@/lib/prisma";

/** Approved governed-memory categories only. */
export const NAVIGATOR_MEMORY_CATEGORIES = [
  "explicit_preference",
  "communication_requirement",
  "accessibility_requirement",
  "participant_exclusion",
  "consented_workflow_state",
] as const;

export type NavigatorMemoryCategory = (typeof NAVIGATOR_MEMORY_CATEGORIES)[number];

export const navigatorMemoryCategorySchema = z.enum(NAVIGATOR_MEMORY_CATEGORIES);

/** Labels that must never be stored as governed memory. */
export const FORBIDDEN_MEMORY_LABELS = [
  "inferred_capacity",
  "capacity",
  "diagnosis",
  "diagnostic",
  "emotion",
  "emotional_state",
  "clinical_assessment",
  "clinical_inference",
  "inferred_preference",
  "conversation_dump",
  "chat_log",
  "free_form_conversation",
] as const;

const CONTENT_SUMMARY_MAX = 500;

export const memoryUpsertSchema = z
  .object({
    id: z.string().min(1).optional(),
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    creatingActorId: z.string().min(1),
    purpose: z.string().min(1).max(200),
    category: navigatorMemoryCategorySchema,
    contentSummary: z.string().min(1).max(CONTENT_SUMMARY_MAX),
    provenance: z.string().min(1).max(200),
    consentRecordId: z.string().min(1).nullable().optional(),
    confidence: z.string().max(80).default("stated"),
    expiresAt: z.coerce.date().nullable().optional(),
  })
  .strict();

export type MemoryUpsertInput = z.infer<typeof memoryUpsertSchema>;

export type NavigatorMemoryItemRecord = {
  id: string;
  tenantId: string;
  participantId: string;
  purpose: string;
  category: NavigatorMemoryCategory;
  contentSummary: string;
  provenance: string;
  verification: string;
  creatingActorId: string;
  consentRecordId: string | null;
  confidence: string;
  expiresAt: Date | null;
  correctedAt: Date | null;
  withdrawnAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
};

function assertMemoryEnabled(): void {
  if (!isNavigatorMemoryEnabled()) {
    throw new Error("NAVIGATOR_MEMORY_DISABLED");
  }
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * Reject inferred capacity/diagnosis/emotion and other forbidden labels.
 * Categories must be on the approved allowlist.
 */
export function assertApprovedMemoryCategory(category: string): void {
  const normalized = normalizeLabel(category);
  if (
    (FORBIDDEN_MEMORY_LABELS as readonly string[]).includes(normalized) ||
    normalized.includes("diagnos") ||
    normalized.includes("emotion") ||
    normalized.includes("inferred_capacity") ||
    normalized.includes("clinical")
  ) {
    throw new Error(`NAVIGATOR_MEMORY_FORBIDDEN_CATEGORY:${category}`);
  }

  const parsed = navigatorMemoryCategorySchema.safeParse(category);
  if (!parsed.success) {
    throw new Error(`NAVIGATOR_MEMORY_CATEGORY_NOT_ALLOWED:${category}`);
  }
}

function assertNoConversationDump(contentSummary: string): void {
  if (contentSummary.length > CONTENT_SUMMARY_MAX) {
    throw new Error("NAVIGATOR_MEMORY_CONTENT_TOO_LONG");
  }
  const lower = contentSummary.toLowerCase();
  if (
    lower.includes("transcript:") ||
    lower.includes("conversation dump") ||
    lower.includes("full chat log")
  ) {
    throw new Error("NAVIGATOR_MEMORY_CONVERSATION_DUMP_FORBIDDEN");
  }
}

function mapRow(row: {
  id: string;
  tenantId: string;
  participantId: string;
  purpose: string;
  category: string;
  contentSummary: string;
  provenance: string;
  verification: string;
  creatingActorId: string;
  consentRecordId: string | null;
  confidence: string;
  expiresAt: Date | null;
  correctedAt: Date | null;
  withdrawnAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
}): NavigatorMemoryItemRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    participantId: row.participantId,
    purpose: row.purpose,
    category: row.category as NavigatorMemoryCategory,
    contentSummary: row.contentSummary,
    provenance: row.provenance,
    verification: row.verification,
    creatingActorId: row.creatingActorId,
    consentRecordId: row.consentRecordId,
    confidence: row.confidence,
    expiresAt: row.expiresAt,
    correctedAt: row.correctedAt,
    withdrawnAt: row.withdrawnAt,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewedAt: row.reviewedAt,
  };
}

export async function upsertMemoryItem(
  rawInput: unknown,
): Promise<NavigatorMemoryItemRecord> {
  assertMemoryEnabled();
  const input = memoryUpsertSchema.parse(rawInput);
  assertApprovedMemoryCategory(input.category);
  assertNoConversationDump(input.contentSummary);

  if (input.id) {
    const existing = await prisma.navigatorGovernedMemoryItem.findFirst({
      where: {
        id: input.id,
        tenantId: input.tenantId,
        participantId: input.participantId,
        deletedAt: null,
      },
    });
    if (!existing) {
      throw new Error("NAVIGATOR_MEMORY_NOT_FOUND");
    }

    const row = await prisma.navigatorGovernedMemoryItem.update({
      where: { id: existing.id },
      data: {
        purpose: input.purpose,
        category: input.category,
        contentSummary: input.contentSummary,
        provenance: input.provenance,
        consentRecordId: input.consentRecordId ?? existing.consentRecordId,
        confidence: input.confidence,
        expiresAt: input.expiresAt ?? existing.expiresAt,
        verification: "participant_stated",
      },
    });

    await createAuditEvent({
      actorUserId: input.creatingActorId,
      participantId: input.participantId,
      action: NAVIGATOR_AUDIT.memoryUpserted,
      entityType: "NavigatorGovernedMemoryItem",
      entityId: row.id,
      metadata: {
        tenantId: input.tenantId,
        category: input.category,
        updated: true,
      },
    });

    return mapRow(row);
  }

  const row = await prisma.navigatorGovernedMemoryItem.create({
    data: {
      tenantId: input.tenantId,
      participantId: input.participantId,
      purpose: input.purpose,
      category: input.category,
      contentSummary: input.contentSummary,
      provenance: input.provenance,
      creatingActorId: input.creatingActorId,
      consentRecordId: input.consentRecordId ?? null,
      confidence: input.confidence,
      expiresAt: input.expiresAt ?? null,
      verification: "participant_stated",
    },
  });

  await createAuditEvent({
    actorUserId: input.creatingActorId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.memoryUpserted,
    entityType: "NavigatorGovernedMemoryItem",
    entityId: row.id,
    metadata: {
      tenantId: input.tenantId,
      category: input.category,
      updated: false,
    },
  });

  return mapRow(row);
}

export async function listMemoryItems(input: {
  tenantId: string;
  participantId: string;
  category?: NavigatorMemoryCategory;
  includeWithdrawn?: boolean;
  take?: number;
}): Promise<NavigatorMemoryItemRecord[]> {
  assertMemoryEnabled();
  if (input.category) {
    assertApprovedMemoryCategory(input.category);
  }

  const take = Math.max(1, Math.min(input.take ?? 50, 100));
  const rows = await prisma.navigatorGovernedMemoryItem.findMany({
    where: {
      tenantId: input.tenantId,
      participantId: input.participantId,
      deletedAt: null,
      ...(input.includeWithdrawn ? {} : { withdrawnAt: null }),
      ...(input.category ? { category: input.category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return rows.map(mapRow);
}

export async function correctMemoryItem(input: {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  contentSummary: string;
  note?: string;
}): Promise<NavigatorMemoryItemRecord> {
  assertMemoryEnabled();
  assertNoConversationDump(input.contentSummary);

  const existing = await prisma.navigatorGovernedMemoryItem.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
      deletedAt: null,
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_MEMORY_NOT_FOUND");
  }

  const row = await prisma.navigatorGovernedMemoryItem.update({
    where: { id: existing.id },
    data: {
      contentSummary: input.contentSummary.slice(0, CONTENT_SUMMARY_MAX),
      verification: "corrected",
      correctedAt: new Date(),
      reviewedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.memoryCorrected,
    entityType: "NavigatorGovernedMemoryItem",
    entityId: row.id,
    metadata: {
      tenantId: input.tenantId,
      note: input.note ?? null,
    },
  });

  return mapRow(row);
}

export async function withdrawMemoryItem(input: {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
}): Promise<NavigatorMemoryItemRecord> {
  assertMemoryEnabled();

  const existing = await prisma.navigatorGovernedMemoryItem.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
      deletedAt: null,
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_MEMORY_NOT_FOUND");
  }

  const row = await prisma.navigatorGovernedMemoryItem.update({
    where: { id: existing.id },
    data: {
      verification: "withdrawn",
      withdrawnAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.memoryWithdrawn,
    entityType: "NavigatorGovernedMemoryItem",
    entityId: row.id,
    metadata: { tenantId: input.tenantId },
  });

  return mapRow(row);
}

export async function deleteMemoryItem(input: {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
}): Promise<NavigatorMemoryItemRecord> {
  assertMemoryEnabled();

  const existing = await prisma.navigatorGovernedMemoryItem.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
      deletedAt: null,
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_MEMORY_NOT_FOUND");
  }

  const row = await prisma.navigatorGovernedMemoryItem.update({
    where: { id: existing.id },
    data: {
      verification: "deleted",
      deletedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.memoryDeleted,
    entityType: "NavigatorGovernedMemoryItem",
    entityId: row.id,
    metadata: { tenantId: input.tenantId, softDelete: true },
  });

  return mapRow(row);
}
