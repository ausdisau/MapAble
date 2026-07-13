import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";

import type { AppointmentAuthorityDecision, AppointmentMissionRequest } from "./appointment-types";

export function evaluateAppointmentAuthority(params: {
  user: CurrentUser;
  request: AppointmentMissionRequest;
}): AppointmentAuthorityDecision {
  const permittedReads = ["appointment.summary"];
  const permittedActions: AppointmentAuthorityDecision["permittedActions"] = [];
  const reasons: string[] = [];

  if (params.request.authority.includeExistingRecords) permittedReads.push("care.summary");
  if (params.request.authority.includeAccessibilityProfile) permittedReads.push("profile.accessibility");
  if (params.request.authority.allowProviderEvidenceRead) permittedReads.push("provider.capacity");
  if (params.request.authority.allowWorkerEvidenceRead) permittedReads.push("worker.capability");
  if (params.request.care.required && hasPermission(params.user.primaryRole, "care:manage:self")) {
    permittedActions.push("draft_care_request");
  }
  if (params.request.transport.required && hasPermission(params.user.primaryRole, "transport:manage:self")) {
    permittedActions.push("draft_transport_request");
  }
  if (params.request.authority.allowHumanReview) permittedActions.push("request_human_coordination");

  if (params.request.care.highIntensitySupport) {
    reasons.push("High-intensity support requires qualified human review before service confirmation.");
  }
  if (params.request.care.backupPreference === "undecided") {
    reasons.push("The participant has not yet chosen a backup-support preference.");
  }

  const prohibitedActions = [
    "assign_worker", "assign_provider", "make_clinical_decision", "resolve_safeguarding",
    "approve_payment", "submit_ndis_claim", "cancel_linked_service_without_participant_instruction",
  ];

  return {
    participantId: params.user.id,
    decision: params.request.care.highIntensitySupport ? "human_review_required" : "allow",
    permittedReads,
    permittedActions,
    prohibitedActions,
    reasons,
  };
}
