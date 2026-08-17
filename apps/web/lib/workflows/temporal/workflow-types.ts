export const WORKFLOW_KEYS = [
  "serviceRecoveryWorkflow",
  "complaintAcknowledgementWorkflow",
  "reportableIncidentDeadlineWorkflow",
  "workerCredentialExpiryWorkflow",
  "invoiceApprovalWorkflow",
  "claimValidationWorkflow",
  "evidencePackBuildWorkflow",
  "telehealthAppointmentReminderWorkflow",
  "livingAloneMonitoringWorkflow",
] as const;

export type WorkflowKey = (typeof WORKFLOW_KEYS)[number];
