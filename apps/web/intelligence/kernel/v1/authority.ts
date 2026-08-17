import type {
  AppointmentAuthorityDecision,
  AppointmentMissionRequest,
} from "./appointment-types";

const ALWAYS_PROHIBITED = [
  "assign_worker_or_provider",
  "make_clinical_decision",
  "resolve_safeguarding_matter",
  "approve_payment_or_claim",
  "cancel_service_without_participant_instruction",
  "infer_capacity_emotion_or_disability_severity",
];

export function evaluateAppointmentAuthority(params: {
  participantId: string;
  request: AppointmentMissionRequest;
}): AppointmentAuthorityDecision {
  const permittedReads = ["appointment_input"];
  const permittedActions: AppointmentAuthorityDecision["permittedActions"] = [];
  const reasons: string[] = [
    "The participant supplied the mission outcome and appointment details.",
  ];

  if (params.request.authority.includeExistingRecords) {
    permittedReads.push("participant_care_records");
  }
  if (params.request.authority.includeAccessibilityProfile) {
    permittedReads.push("participant_accessibility_profile");
  }
  if (params.request.authority.allowProviderEvidenceRead) {
    permittedReads.push("provider_capacity_evidence");
  }
  if (params.request.authority.allowWorkerEvidenceRead) {
    permittedReads.push("worker_capability_evidence");
  }
  if (params.request.care.required) permittedActions.push("draft_care_request");
  if (params.request.transport.required) {
    permittedActions.push("draft_transport_request");
  }
  if (params.request.authority.allowHumanReview) {
    permittedActions.push("request_human_coordination");
  }

  const requiresHumanReview =
    params.request.care.highIntensitySupport ||
    (params.request.care.required &&
      params.request.care.backupPreference === "undecided");

  if (params.request.care.highIntensitySupport) {
    reasons.push(
      "High-intensity support requires verified competency evidence and qualified human review.",
    );
  }
  if (
    params.request.care.required &&
    params.request.care.backupPreference === "undecided"
  ) {
    reasons.push(
      "The participant has not yet confirmed how replacement support should be handled.",
    );
  }

  return {
    participantId: params.participantId,
    decision: requiresHumanReview ? "human_review_required" : "allow",
    permittedReads,
    permittedActions,
    prohibitedActions: ALWAYS_PROHIBITED,
    reasons,
  };
}
