import { randomUUID } from "node:crypto";

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
): Promise<string> {
  const receiptId = randomUUID();
  const inserted = await prisma.$executeRaw`
    INSERT INTO "careos_action_receipts" (
      "id", "tokenId", "proposalId", "requestId", "participantId",
      "actionType", "payloadHash", "status", "claimedAt"
    ) VALUES (
      ${receiptId}, ${envelope.tokenId}, ${envelope.proposalId},
      ${envelope.requestId}, ${envelope.participantId}, ${envelope.actionType},
      ${envelope.payloadHash}, 'claimed', NOW()
    )
    ON CONFLICT ("tokenId") DO NOTHING
  `;
  if (inserted !== 1) throw new Error("CAREOS_ACTION_ALREADY_USED");
  return receiptId;
}

export async function completeCareOSAction(params: {
  receiptId: string;
  resultEntityType: string;
  resultEntityId: string;
}): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "careos_action_receipts"
    SET "status" = 'completed',
        "resultEntityType" = ${params.resultEntityType},
        "resultEntityId" = ${params.resultEntityId},
        "completedAt" = NOW()
    WHERE "id" = ${params.receiptId} AND "status" = 'claimed'
  `;
}

export async function failCareOSAction(params: {
  receiptId: string;
  errorCode: string;
}): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "careos_action_receipts"
    SET "status" = 'failed',
        "errorCode" = ${params.errorCode.slice(0, 120)},
        "completedAt" = NOW()
    WHERE "id" = ${params.receiptId} AND "status" = 'claimed'
  `;
}

export async function listCareOSActionReceipts(
  participantId: string,
  limit = 30,
): Promise<CareOSActionReceipt[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  return prisma.$queryRaw<CareOSActionReceipt[]>`
    SELECT "id", "tokenId", "proposalId", "requestId", "participantId",
           "actionType", "payloadHash", "status", "resultEntityType",
           "resultEntityId", "errorCode", "claimedAt", "completedAt"
    FROM "careos_action_receipts"
    WHERE "participantId" = ${participantId}
    ORDER BY "claimedAt" DESC
    LIMIT ${safeLimit}
  `;
}
