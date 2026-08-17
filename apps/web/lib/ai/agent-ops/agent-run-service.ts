import type {
  AgentRunType,
  AgentRiskTier,
  AgentRunStatus,
  Prisma,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import { prisma } from "@/lib/prisma";

export type CreateAgentRunInput = {
  agentType: AgentRunType;
  participantId?: string;
  careRequestId?: string;
  matchRunId?: string;
  aiMatchRunId?: string;
  billingInvoiceId?: string;
  auditEventId?: string;
  inputSummary?: Record<string, unknown>;
  outputSummary?: Record<string, unknown>;
  toolsCalled?: string[];
  guardrailsTriggered?: string[];
  riskTier?: AgentRiskTier;
  humanReviewRequired?: boolean;
  participantConfirmationRequired?: boolean;
  actorUserId?: string;
};

export async function createAgentRun(input: CreateAgentRunInput) {
  if (!platformPatternsConfig.agentRunPersistenceEnabled) {
    return { id: null, skipped: true };
  }

  const run = await prisma.agentRun.create({
    data: {
      agentType: input.agentType,
      status: "completed",
      riskTier: input.riskTier ?? "low",
      humanReviewRequired: input.humanReviewRequired ?? false,
      participantConfirmationRequired:
        input.participantConfirmationRequired ?? false,
      inputSummary: (input.inputSummary ?? undefined) as Prisma.InputJsonValue | undefined,
      outputSummary: (input.outputSummary ?? undefined) as Prisma.InputJsonValue | undefined,
      toolsCalled: input.toolsCalled ?? [],
      guardrailsTriggered: input.guardrailsTriggered ?? [],
      participantId: input.participantId,
      careRequestId: input.careRequestId,
      matchRunId: input.matchRunId,
      aiMatchRunId: input.aiMatchRunId,
      billingInvoiceId: input.billingInvoiceId,
      auditEventId: input.auditEventId,
    },
  });

  if (input.actorUserId && !input.auditEventId) {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      action: "agent_run.completed",
      entityType: "AgentRun",
      entityId: run.id,
      participantId: input.participantId,
      metadata: {
        agentType: input.agentType,
        riskTier: run.riskTier,
        humanReviewRequired: run.humanReviewRequired,
      },
    });
  }

  return run;
}

export async function markAgentRunReviewed(
  agentRunId: string,
  reviewedById: string
) {
  return prisma.agentRun.update({
    where: { id: agentRunId },
    data: {
      status: "reviewed",
      reviewedById,
      reviewedAt: new Date(),
      humanReviewRequired: false,
    },
  });
}

export async function assertAgentRunAllowsAction(params: {
  careRequestId?: string;
  matchRunId?: string;
}) {
  if (!platformPatternsConfig.agentRunPersistenceEnabled) return;

  const orClauses: { careRequestId?: string; matchRunId?: string }[] = [];
  if (params.careRequestId) orClauses.push({ careRequestId: params.careRequestId });
  if (params.matchRunId) orClauses.push({ matchRunId: params.matchRunId });
  if (orClauses.length === 0) return;

  const blocking = await prisma.agentRun.findFirst({
    where: {
      OR: orClauses,
      status: { in: ["started", "completed", "blocked"] },
      humanReviewRequired: true,
    },
  });

  if (blocking) {
    throw new Error("AGENT_REVIEW_REQUIRED");
  }
}

export async function listAgentRunsForAdmin(filters?: {
  status?: AgentRunStatus;
  agentType?: AgentRunType;
}) {
  return prisma.agentRun.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.agentType ? { agentType: filters.agentType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
