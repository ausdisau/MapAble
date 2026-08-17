import { addBusinessDays } from "@/lib/workflows/temporal/business-days";
import { recordWorkflowDeadline } from "@/lib/workflows/temporal/workflow-audit-service";

export async function scheduleComplaintAckDeadlines(workflowRunId: string) {
  const deadlineAt = addBusinessDays(new Date(), 2);
  await recordWorkflowDeadline({
    workflowRunId,
    deadlineAt,
    label: "complaint_acknowledgement_2_business_days",
  });
}
