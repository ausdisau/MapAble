/**
 * Source-of-record labels, not conclusions about safety, attendance or
 * credential validity. Unknown statuses fail closed.
 */
export type SupportRecordKind = "care" | "transport";
export type SupportEvidenceCategory =
  | "awaiting"
  | "arranged"
  | "underway"
  | "recorded_complete"
  | "disrupted"
  | "disputed"
  | "unknown";

export type SupportEvidence = {
  category: SupportEvidenceCategory;
  label: string;
  detail: string;
};

const UNKNOWN: SupportEvidence = {
  category: "unknown",
  label: "Status requires review",
  detail: "The available record does not establish whether support is arranged or delivered.",
};

const CARE: Record<string, SupportEvidence> = {
  pending_provider: {
    category: "awaiting",
    label: "Awaiting provider response",
    detail: "A request is recorded; no visit is confirmed by this status.",
  },
  accepted: {
    category: "arranged",
    label: "Provider accepted",
    detail: "Acceptance is recorded. Worker identity and attendance require separate checks.",
  },
  worker_assigned: {
    category: "arranged",
    label: "Worker assigned in record",
    detail: "Assignment does not prove current screening, competence or attendance.",
  },
  in_progress: {
    category: "underway",
    label: "Marked in progress",
    detail: "This system status does not independently verify the service.",
  },
  completed: {
    category: "recorded_complete",
    label: "Marked completed",
    detail: "Check the service evidence before accepting an invoice or attendance claim.",
  },
  declined: {
    category: "disrupted",
    label: "Provider declined",
    detail: "This recorded response does not establish a replacement arrangement.",
  },
  cancelled: {
    category: "disrupted",
    label: "Recorded as cancelled",
    detail: "Other linked services are not assumed cancelled or rearranged.",
  },
  disputed: {
    category: "disputed",
    label: "Disputed",
    detail: "A disputed record needs human review; do not imply agreement.",
  },
};

const TRANSPORT: Record<string, SupportEvidence> = {
  requested: {
    category: "awaiting",
    label: "Trip requested",
    detail: "A trip request is not an accepted booking.",
  },
  provider_review: {
    category: "awaiting",
    label: "Under provider review",
    detail: "No accepted journey is established by this status.",
  },
  accepted: {
    category: "arranged",
    label: "Provider accepted",
    detail: "Vehicle accessibility and driver competence require separate evidence.",
  },
  dispatch_pending: {
    category: "arranged",
    label: "Dispatch pending",
    detail: "A driver and suitable vehicle are not yet confirmed by this status.",
  },
  driver_vehicle_assigned: {
    category: "arranged",
    label: "Driver and vehicle assigned",
    detail: "Assignment alone is not proof of accessibility fit or completion.",
  },
  driver_accepted: {
    category: "arranged",
    label: "Driver accepted",
    detail: "Acceptance does not prove arrival or pickup.",
  },
  pre_start_check_required: {
    category: "arranged",
    label: "Pre-start checks required",
    detail: "Do not treat required safety and access checks as completed.",
  },
  en_route_to_pickup: {
    category: "underway",
    label: "Driver en route",
    detail: "Pickup has not been recorded.",
  },
  arrived_at_pickup: {
    category: "underway",
    label: "Driver at pickup",
    detail: "Boarding has not been recorded.",
  },
  participant_boarded: {
    category: "underway",
    label: "Boarding recorded",
    detail: "A completed journey is not established.",
  },
  en_route_to_dropoff: {
    category: "underway",
    label: "Journey in progress",
    detail: "Arrival and safe handover are not yet established.",
  },
  arrived_at_dropoff: {
    category: "underway",
    label: "Arrival recorded",
    detail: "A completed handover is not established by this status.",
  },
  handover_completed: {
    category: "underway",
    label: "Handover recorded",
    detail: "Review any outstanding trip evidence or disputed charges.",
  },
  trip_completed: {
    category: "recorded_complete",
    label: "Trip marked completed",
    detail: "The record alone does not establish suitability or an undisputed invoice.",
  },
  evidence_submitted: {
    category: "recorded_complete",
    label: "Trip evidence submitted",
    detail: "Evidence submission does not mean participant acceptance.",
  },
  participant_review: {
    category: "recorded_complete",
    label: "Awaiting participant review",
    detail: "The participant has not necessarily accepted the trip record.",
  },
  closed: {
    category: "recorded_complete",
    label: "Trip record closed",
    detail: "Closure does not override a complaint or correction request.",
  },
  cancelled: {
    category: "disrupted",
    label: "Trip cancelled",
    detail: "No alternative trip should be inferred.",
  },
  declined: {
    category: "disrupted",
    label: "Trip declined",
    detail: "No alternative trip should be inferred.",
  },
  driver_no_show: {
    category: "disrupted",
    label: "Driver did not arrive (recorded)",
    detail: "The participant may need an accessible recovery option.",
  },
  participant_no_show: {
    category: "disrupted",
    label: "Trip did not proceed (recorded)",
    detail: "Do not infer responsibility or fault from this status alone.",
  },
  handover_failed: {
    category: "disrupted",
    label: "Handover not completed",
    detail: "Human review is required before making claims about resolution.",
  },
  unsafe_to_continue: {
    category: "disrupted",
    label: "Trip stopped for safety review",
    detail: "Do not automatically substitute transport or restart the journey.",
  },
  disputed: {
    category: "disputed",
    label: "Trip disputed",
    detail: "The participant's concerns must remain visible.",
  },
  service_recovery_required: {
    category: "disrupted",
    label: "Service recovery needed",
    detail: "No replacement is accepted without the relevant authority and confirmation.",
  },
};

export function describeSupportStatus(
  kind: SupportRecordKind,
  rawStatus: string,
): SupportEvidence {
  return (kind === "care" ? CARE : TRANSPORT)[rawStatus] ?? UNKNOWN;
}

export type LocalPreviewChoice =
  | "review_replacement"
  | "decline_replacement"
  | "request_human";

export function describeLocalPreviewChoice(choice: LocalPreviewChoice): string {
  switch (choice) {
    case "review_replacement":
      return "Review the proposed worker and relevant evidence before deciding.";
    case "decline_replacement":
      return "Do not agree to this proposed replacement. An unmet support need remains.";
    case "request_human":
      return "Ask for human assistance to discuss options without approving a replacement.";
  }
}
