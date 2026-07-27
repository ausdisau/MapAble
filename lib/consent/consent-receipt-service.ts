import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createConsentReceipt(input: {
  consentRecordId?: string;
  participantId: string;
  actorUserId: string;
  scope: string;
  purpose: string;
  recipientType?: string;
  recipientId?: string;
  action: "granted" | "revoked" | "used" | "blocked";
}) {
  const receipt = await prisma.consentReceipt.create({
    data: {
      consentRecordId: input.consentRecordId,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      scope: input.scope,
      purpose: input.purpose,
      recipientType: input.recipientType,
      recipientId: input.recipientId,
      action: input.action,
    },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: `consent.receipt.${input.action}`,
    entityType: "ConsentReceipt",
    entityId: receipt.id,
    metadata: { scope: input.scope },
  });
  return receipt;
}

export async function listConsentTimeline(
  participantId: string,
  actorUserId: string,
  take = 100,
) {
  if (participantId !== actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  return prisma.consentReceipt.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
