import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function recordWorkflowStarted(
  workflowRunId: string,
  workflowKey: string
) {
  await prisma.workflowEvent.create({
    data: {
      workflowRunId,
      eventType: "started",
      payloadJson: { workflowKey },
    },
  });

  await createAuditEvent({
    action: "workflow:started",
    entityType: "WorkflowRun",
    entityId: workflowRunId,
    metadata: { workflowKey },
  });
}

export async function recordWorkflowDeadline(input: {
  workflowRunId: string;
  deadlineAt: Date;
  label: string;
}) {
  return prisma.workflowDeadline.create({
    data: input,
  });
}
