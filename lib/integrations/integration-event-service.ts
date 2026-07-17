import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function logIntegrationEvent(input: {
  integrationKey: string;
  eventType: string;
  severity?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  actorUserId?: string | null;
}): Promise<void> {
  const connection = await prisma.integrationConnection.findUnique({
    where: { integrationKey: input.integrationKey },
  });
  if (!connection) return;

  await prisma.integrationEvent.create({
    data: {
      connectionId: connection.id,
      eventType: input.eventType,
      severity: input.severity ?? "info",
      message: input.message,
      metadataJson: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      actorUserId: input.actorUserId ?? undefined,
    },
  });
}

export async function listIntegrationEvents(
  integrationKey?: string,
  limit = 50
) {
  const where = integrationKey
    ? { connection: { integrationKey } }
    : undefined;

  return prisma.integrationEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      connection: { select: { integrationKey: true, displayName: true } },
    },
  });
}
