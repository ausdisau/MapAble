import { WORKFLOW_KEYS, type WorkflowKey } from "@/lib/workflows/temporal/workflow-types";

export function isTemporalEnabled(): boolean {
  return process.env.TEMPORAL_ENABLED === "true";
}

export function getTemporalConfig() {
  return {
    address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
    namespace: process.env.TEMPORAL_NAMESPACE ?? "default",
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? "mapable",
    tlsEnabled: process.env.TEMPORAL_TLS_ENABLED === "true",
  };
}

/** Start workflow — uses DB mirror when Temporal server unavailable. */
export async function startWorkflow(input: {
  workflowKey: WorkflowKey;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { prisma } = await import("@/lib/prisma");
  const { recordWorkflowStarted } = await import(
    "@/lib/workflows/temporal/workflow-audit-service"
  );

  if (!WORKFLOW_KEYS.includes(input.workflowKey)) {
    throw new Error(`Unknown workflow: ${input.workflowKey}`);
  }

  const run = await prisma.workflowRun.create({
    data: {
      workflowKey: input.workflowKey,
      entityType: input.entityType,
      entityId: input.entityId,
      metadataJson: (input.metadata ?? undefined) as import("@prisma/client").Prisma.InputJsonValue | undefined,
      status: isTemporalEnabled() ? "running" : "running_local",
    },
  });

  await recordWorkflowStarted(run.id, input.workflowKey);

  if (input.workflowKey === "complaintAcknowledgementWorkflow") {
    const { scheduleComplaintAckDeadlines } = await import(
      "@/lib/workflows/temporal/workflows/complaint-acknowledgement"
    );
    await scheduleComplaintAckDeadlines(run.id);
  }

  return run;
}
