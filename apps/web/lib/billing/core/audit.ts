import { prisma } from "@/lib/prisma";

export async function writeBillingAuditLog(params: {
  actorUserId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}) {
  return prisma.billingAuditLog.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      before: params.before ? (params.before as object) : undefined,
      after: params.after ? (params.after as object) : undefined,
    },
  });
}
