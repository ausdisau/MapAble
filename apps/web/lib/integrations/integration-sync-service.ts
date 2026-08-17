import type { Prisma } from "@prisma/client";

import { auditIntegrationAction } from "@/lib/integrations/integration-audit-service";
import { getIntegrationConnection } from "@/lib/integrations/integration-connection-service";
import { prisma } from "@/lib/prisma";

export async function createSyncJob(input: {
  integrationKey: string;
  jobKey: string;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
}) {
  const connection = await getIntegrationConnection(input.integrationKey);
  if (!connection) throw new Error(`Unknown integration: ${input.integrationKey}`);

  const existing = await prisma.integrationSyncJob.findUnique({
    where: {
      connectionId_idempotencyKey: {
        connectionId: connection.id,
        idempotencyKey: input.idempotencyKey,
      },
    },
  });
  if (existing) return existing;

  const job = await prisma.integrationSyncJob.create({
    data: {
      connectionId: connection.id,
      jobKey: input.jobKey,
      idempotencyKey: input.idempotencyKey,
      payloadJson: (input.payload ?? undefined) as Prisma.InputJsonValue | undefined,
      status: "pending",
    },
  });

  await auditIntegrationAction({
    integrationKey: input.integrationKey,
    action: "sync_job_created",
    metadata: { jobKey: input.jobKey, idempotencyKey: input.idempotencyKey },
  });

  return job;
}

export async function recordSyncError(
  syncJobId: string,
  errorMessage: string,
  retryable = true
) {
  const job = await prisma.integrationSyncJob.findUnique({
    where: { id: syncJobId },
    include: { connection: true },
  });
  if (!job) return;

  await prisma.integrationSyncError.create({
    data: { syncJobId, errorMessage, retryable },
  });

  await prisma.integrationSyncJob.update({
    where: { id: syncJobId },
    data: { status: "failed", retryCount: { increment: 1 } },
  });

  await auditIntegrationAction({
    integrationKey: job.connection.integrationKey,
    action: "sync_failed",
    metadata: { errorMessage, retryable, jobKey: job.jobKey },
    severity: "error",
  });
}

export async function completeSyncJob(syncJobId: string) {
  return prisma.integrationSyncJob.update({
    where: { id: syncJobId },
    data: { status: "completed", completedAt: new Date() },
  });
}
