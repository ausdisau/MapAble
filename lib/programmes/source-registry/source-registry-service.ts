import { prisma } from "@/lib/prisma";
import type { ProgrammeSourceType } from "@prisma/client";

import { emitProgrammeAuditEvent } from "@/lib/programmes/audit";
import type {
  ProgrammeSourceRecordView,
  ProgrammeSourceSearchInput,
} from "@/lib/programmes/contracts/programme-source-adapter";

function toView(record: {
  id: string;
  sourceOrganisation: string;
  jurisdiction: string;
  title: string;
  sourceType: ProgrammeSourceType;
  version: string;
  effectiveDate: Date | null;
  expiryDate: Date | null;
  authorityStatus: string;
  affectedProgrammes: string[];
  supersedingSourceId: string | null;
  supersededBy: { id: string }[];
}): ProgrammeSourceRecordView {
  return {
    id: record.id,
    sourceOrganisation: record.sourceOrganisation,
    jurisdiction: record.jurisdiction,
    title: record.title,
    sourceType: record.sourceType,
    version: record.version,
    effectiveDate: record.effectiveDate,
    expiryDate: record.expiryDate,
    authorityStatus: record.authorityStatus,
    affectedProgrammes: record.affectedProgrammes,
    isSuperseded: record.supersededBy.length > 0,
    supersedingSourceId: record.supersedingSourceId,
  };
}

export async function searchProgrammeSources(
  input: ProgrammeSourceSearchInput,
): Promise<ProgrammeSourceRecordView[]> {
  const records = await prisma.programmeSourceRecord.findMany({
    where: {
      jurisdiction: input.jurisdiction,
      sourceType: input.sourceType,
      ...(input.programmeId
        ? { affectedProgrammes: { has: input.programmeId } }
        : {}),
      ...(input.query
        ? {
            OR: [
              { title: { contains: input.query, mode: "insensitive" } },
              {
                sourceOrganisation: {
                  contains: input.query,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    include: { supersededBy: { select: { id: true } } },
    orderBy: { retrievalDate: "desc" },
    take: 50,
  });

  return records.map(toView);
}

export async function getProgrammeSourceById(
  id: string,
): Promise<ProgrammeSourceRecordView | null> {
  const record = await prisma.programmeSourceRecord.findUnique({
    where: { id },
    include: { supersededBy: { select: { id: true } } },
  });
  return record ? toView(record) : null;
}

export async function getSupersessionWarning(id: string): Promise<{
  superseded: boolean;
  message?: string;
}> {
  const record = await prisma.programmeSourceRecord.findUnique({
    where: { id },
    include: {
      supersededBy: { select: { id: true, version: true, title: true } },
    },
  });

  if (!record) {
    return { superseded: false };
  }

  if (record.supersededBy.length > 0) {
    const newer = record.supersededBy[0];
    return {
      superseded: true,
      message: `Superseded by ${newer.title} (version ${newer.version})`,
    };
  }

  if (record.authorityStatus === "draft") {
    return {
      superseded: false,
      message: "Draft source — not authoritative for production rules",
    };
  }

  return { superseded: false };
}

export interface CreateProgrammeSourceInput {
  sourceOrganisation: string;
  jurisdiction: string;
  title: string;
  sourceType: ProgrammeSourceType;
  version: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  authorityStatus?: "authoritative" | "draft" | "consultation";
  licence?: string;
  attribution?: string;
  sourceHash?: string;
  affectedProgrammes?: string[];
  reviewOwnerId?: string;
  nextReviewAt?: Date;
  supersedingSourceId?: string;
  createdById: string;
  correlationId: string;
}

export async function createProgrammeSourceRecord(
  input: CreateProgrammeSourceInput,
) {
  const record = await prisma.programmeSourceRecord.create({
    data: {
      sourceOrganisation: input.sourceOrganisation,
      jurisdiction: input.jurisdiction,
      title: input.title,
      sourceType: input.sourceType,
      version: input.version,
      effectiveDate: input.effectiveDate,
      expiryDate: input.expiryDate,
      authorityStatus: input.authorityStatus ?? "authoritative",
      licence: input.licence,
      attribution: input.attribution,
      sourceHash: input.sourceHash,
      affectedProgrammes: input.affectedProgrammes ?? [],
      reviewOwnerId: input.reviewOwnerId,
      nextReviewAt: input.nextReviewAt,
      supersedingSourceId: input.supersedingSourceId,
    },
    include: { supersededBy: { select: { id: true } } },
  });

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.createdById,
    action: "source.created",
    entityType: "ProgrammeSourceRecord",
    entityId: record.id,
    metadata: { title: record.title, version: record.version },
  });

  return toView(record);
}

export async function createSourceImpactReview(input: {
  sourceRecordId: string;
  summary: string;
  reviewOwnerId?: string;
  correlationId: string;
  actorUserId: string;
}) {
  const review = await prisma.programmeSourceImpactReview.create({
    data: {
      sourceRecordId: input.sourceRecordId,
      summary: input.summary,
      reviewOwnerId: input.reviewOwnerId,
      status: "pending",
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.actorUserId,
    action: "source.impact_review.created",
    entityType: "ProgrammeSourceImpactReview",
    entityId: review.id,
    metadata: { sourceRecordId: input.sourceRecordId },
  });

  return review;
}
