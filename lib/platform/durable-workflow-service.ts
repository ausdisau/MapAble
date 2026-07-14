import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createDurableWorkflow(input: {
  workflowKey: string;
  tenantId: string;
  participantId?: string;
  missionId?: string;
  currentStep: string;
  input: Record<string, unknown>;
  maximumAttempts?: number;
}) {
  return prisma.workflowRun.create({
    data: {
      workflowKey: input.workflowKey,
      tenantId: input.tenantId,
      participantId: input.participantId,
      missionId: input.missionId,
      currentStep: input.currentStep,
      maximumAttempts: input.maximumAttempts ?? 5,
      status: "pending",
      metadataJson: { input: input.input } as Prisma.InputJsonValue,
    },
  });
}

export async function claimDueWorkflow(now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const due = await tx.workflowRun.findFirst({
      where: {
        status: { in: ["pending", "retry_scheduled"] },
        attempts: { lt: 5 },
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
      },
      orderBy: { startedAt: "asc" },
    });
    if (!due) return null;
    return tx.workflowRun.update({
      where: { id: due.id },
      data: {
        status: "running_local",
        attempts: { increment: 1 },
        lastError: null,
      },
    });
  });
}

export async function pauseWorkflow(
  workflowId: string,
  reason: "human_review" | "participant_confirmation",
) {
  return prisma.workflowRun.update({
    where: { id: workflowId },
    data: {
      status:
        reason === "human_review"
          ? "paused_human_review"
          : "paused_participant_confirmation",
    },
  });
}

export async function scheduleWorkflowRetry(input: {
  workflowId: string;
  errorCode: string;
  attempts: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return prisma.workflowRun.update({
    where: { id: input.workflowId },
    data: {
      status: "retry_scheduled",
      lastError: input.errorCode.slice(0, 500),
      nextRunAt: calculateWorkflowRetryAt(input.attempts, now),
      failures: {
        create: {
          errorMessage: input.errorCode.slice(0, 500),
          retryable: true,
        },
      },
    },
  });
}

export function calculateWorkflowRetryAt(attempts: number, now = new Date()) {
  return new Date(now.getTime() + Math.min(3600, 2 ** attempts * 30) * 1000);
}

export async function cancelWorkflow(workflowId: string) {
  return prisma.workflowRun.update({
    where: { id: workflowId },
    data: { status: "cancelled", completedAt: new Date() },
  });
}
