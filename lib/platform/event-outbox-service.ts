import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { QueueProvider } from "@/lib/platform/cloud-providers";

export const cloudEventEnvelopeSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  version: z.number().int().positive(),
  occurredAt: z.string().datetime(),
  tenantId: z.string().min(1),
  participantId: z.string().optional(),
  missionId: z.string().optional(),
  sourceModule: z.string().min(1),
  sourceEntityId: z.string().optional(),
  correlationId: z.string().uuid(),
  causationId: z.string().uuid().optional(),
  traceId: z.string().min(1),
  topic: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

export async function appendCloudEvent(
  tx: Prisma.TransactionClient,
  input: z.infer<typeof cloudEventEnvelopeSchema>,
) {
  const event = cloudEventEnvelopeSchema.parse(input);
  return tx.cloudEventOutbox.create({
    data: {
      id: event.id,
      eventType: event.type,
      schemaVersion: event.version,
      topic: event.topic,
      tenantId: event.tenantId,
      participantId: event.participantId,
      missionId: event.missionId,
      sourceModule: event.sourceModule,
      sourceEntityId: event.sourceEntityId,
      correlationId: event.correlationId,
      causationId: event.causationId,
      traceId: event.traceId,
      payloadJson: event.payload as Prisma.InputJsonValue,
      occurredAt: new Date(event.occurredAt),
    },
  });
}

export async function publishPendingCloudEvents(
  queue: QueueProvider,
  options: { limit?: number; now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const events = await prisma.cloudEventOutbox.findMany({
    where: {
      publishedAt: null,
      deadLetteredAt: null,
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { occurredAt: "asc" },
    take: options.limit ?? 50,
  });
  for (const event of events) {
    try {
      await queue.publish(event.topic, {
        id: event.id,
        type: event.eventType,
        version: event.schemaVersion,
        tenantId: event.tenantId,
        participantId: event.participantId,
        missionId: event.missionId,
        correlationId: event.correlationId,
        causationId: event.causationId,
        traceId: event.traceId,
        payload: event.payloadJson,
      });
      await prisma.cloudEventOutbox.update({
        where: { id: event.id },
        data: { publishedAt: now, attempts: { increment: 1 }, lastError: null },
      });
    } catch (error) {
      const attempts = event.attempts + 1;
      await prisma.cloudEventOutbox.update({
        where: { id: event.id },
        data: {
          attempts,
          lastError: error instanceof Error ? error.message.slice(0, 500) : "PUBLISH_FAILED",
          nextAttemptAt: new Date(now.getTime() + Math.min(3600, 2 ** attempts * 30) * 1000),
          deadLetteredAt: attempts >= 5 ? now : null,
        },
      });
    }
  }
  return { processed: events.length };
}
