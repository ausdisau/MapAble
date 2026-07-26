import { createHash, randomBytes } from "crypto";

import { Prisma } from "@prisma/client";

import { recordIndoorAuditEvent } from "@/lib/access/indoor/audit/indoor-audit-service";
import { prisma } from "@/lib/prisma";

export async function createCorrectionProposal(params: {
  placeId: string;
  floorPlanId?: string;
  featureId?: string;
  correctionType: string;
  description: string;
  proposedChanges?: Record<string, unknown>;
  reporterId?: string;
}) {
  const proposal = await prisma.floorPlanCorrectionProposal.create({
    data: {
      placeId: params.placeId,
      floorPlanId: params.floorPlanId,
      featureId: params.featureId,
      correctionType: params.correctionType,
      description: params.description,
      proposedChanges: params.proposedChanges as Prisma.InputJsonValue | undefined,
      reporterId: params.reporterId,
      status: "pending",
    },
  });

  await recordIndoorAuditEvent({
    action: "correction.proposed",
    actorUserId: params.reporterId,
    entityType: "FloorPlanCorrectionProposal",
    entityId: proposal.id,
    placeId: params.placeId,
    metadata: { correctionType: params.correctionType },
  });

  return proposal;
}

export async function moderateCorrectionProposal(params: {
  proposalId: string;
  moderatorId: string;
  decision: "approved" | "rejected";
  notes?: string;
}) {
  const proposal = await prisma.floorPlanCorrectionProposal.update({
    where: { id: params.proposalId },
    data: {
      status: params.decision,
      moderatorId: params.moderatorId,
      moderatorNotes: params.notes,
    },
  });

  await recordIndoorAuditEvent({
    action: params.decision === "approved" ? "correction.approved" : "correction.rejected",
    actorUserId: params.moderatorId,
    entityType: "FloorPlanCorrectionProposal",
    entityId: proposal.id,
    placeId: proposal.placeId,
  });

  return proposal;
}

export async function listPendingCorrections(placeId?: string) {
  return prisma.floorPlanCorrectionProposal.findMany({
    where: {
      status: "pending",
      ...(placeId ? { placeId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}
