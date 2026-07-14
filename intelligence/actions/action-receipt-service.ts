import { prisma } from "@/lib/prisma";

import type { CareOSActionEnvelope } from "./action-envelope";

export type CareOSActionReceipt = {
  id: string;
  tokenId: string;
  proposalId: string;
  requestId: string;
  participantId: string;
  actionType: string;
  payloadHash: string;
  status: "claimed" | "completed" | "failed";
  resultEntityType: string | null;
  resultEntityId: string | null;
  errorCode: string | null;
  claimedAt: Date;
  completedAt: Date | null;
};

export async function claimCareOSAction(
  envelope: CareOSActionEnvelope,
  missionId?: string,
): Promise<string> {
  try {
    const receipt = await prisma.careOSActionReceipt.create({
      data: {
        tokenId: envelope.tokenId,
        proposalId: envelope.proposalId,
        requestId: envelope.requestId,
        participantId: envelope.participantId,
        missionId,
        actionType: envelope.actionType,
        payloadHash: envelope.payloadHash,
        status: "claimed",
      },
    });
    return receipt.id;
  } catch {
    throw new Error("CAREOS_ACTION_ALREADY_USED");
  }
}

export async function completeCareOSAction(params: {
  receiptId: string;
  resultEntityType: string;
  resultEntityId: string;
}): Promise<void> {
  await prisma.careOSActionReceipt.updateMany({
    where: { id: params.receiptId, status: "claimed" },
    data: {
      status: "completed",
      resultEntityType: params.resultEntityType,
      resultEntityId: params.resultEntityId,
      completedAt: new Date(),
    },
  });
}

export async function failCareOSAction(params: {
  receiptId: string;
  errorCode: string;
}): Promise<void> {
  await prisma.careOSActionReceipt.updateMany({
    where: { id: params.receiptId, status: "claimed" },
    data: {
      status: "failed",
      errorCode: params.errorCode.slice(0, 120),
      completedAt: new Date(),
    },
  });
}

export async function listCareOSActionReceipts(
  participantId: string,
  limit = 30,
): Promise<CareOSActionReceipt[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const rows = await prisma.careOSActionReceipt.findMany({
    where: { participantId },
    orderBy: { claimedAt: "desc" },
    take: safeLimit,
  });
  return rows.map((row) => ({
    id: row.id,
    tokenId: row.tokenId,
    proposalId: row.proposalId,
    requestId: row.requestId,
    participantId: row.participantId,
    actionType: row.actionType,
    payloadHash: row.payloadHash,
    status: row.status as CareOSActionReceipt["status"],
    resultEntityType: row.resultEntityType,
    resultEntityId: row.resultEntityId,
    errorCode: row.errorCode,
    claimedAt: row.claimedAt,
    completedAt: row.completedAt,
  }));
}
