import { z } from "zod";

export const careOSOperationalEventTypeSchema = z.enum([
  "appointment_changed",
  "worker_cancelled",
  "provider_declined",
  "transport_cancelled",
  "credential_expired",
  "provider_no_response",
  "access_evidence_stale",
  "invoice_received",
  "mission_deadline_approaching",
  "participant_preference_changed",
]);

export const careOSOperationalEventSchema = z.object({
  missionId: z.string().uuid(),
  participantId: z.string().min(1),
  eventType: careOSOperationalEventTypeSchema,
  sourceModule: z.enum(["core", "care", "transport", "access", "payments"]),
  sourceEntityId: z.string().optional(),
  summary: z.string().trim().min(3).max(1000),
  occurredAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CareOSOperationalEvent = z.infer<typeof careOSOperationalEventSchema>;

export type CareOSContinuityIntervention = {
  severity: "information" | "attention" | "urgent";
  title: string;
  explanation: string;
  recoveryActions: string[];
  participantApprovalRequired: boolean;
  humanReviewRequired: boolean;
  assignedRole:
    | "support_coordinator"
    | "provider_coordinator"
    | "financial_reviewer"
    | null;
};

export function analyseCareOSOperationalEvent(
  event: CareOSOperationalEvent,
): CareOSContinuityIntervention {
  switch (event.eventType) {
    case "worker_cancelled":
      return intervention(
        "urgent",
        "Worker cancellation affects this mission",
        "The planned worker is no longer available. Existing transport or appointment arrangements may now be misaligned.",
        [
          "Review approved replacement workers.",
          "Confirm whether transport timing must change.",
          "Contact the participant using their preferred method.",
        ],
        true,
        true,
        "support_coordinator",
      );
    case "transport_cancelled":
      return intervention(
        "urgent",
        "Accessible transport was cancelled",
        "The mission no longer has confirmed transport. Care coverage and appointment timing should be reviewed together.",
        [
          "Search for compatible replacement transport.",
          "Keep the existing care booking unchanged until the participant decides.",
          "Check whether the appointment can be rescheduled.",
        ],
        true,
        true,
        "support_coordinator",
      );
    case "provider_declined":
      return intervention(
        "attention",
        "Provider declined the request",
        "The selected provider cannot currently deliver this part of the mission.",
        [
          "Prepare alternative provider options.",
          "Preserve the participant's hard requirements.",
        ],
        true,
        true,
        "provider_coordinator",
      );
    case "credential_expired":
      return intervention(
        "urgent",
        "A required credential has expired",
        "A worker or provider credential needed for this mission is no longer current.",
        [
          "Remove the affected option from the feasible shortlist.",
          "Route the mission to a human coordinator.",
        ],
        false,
        true,
        "provider_coordinator",
      );
    case "appointment_changed":
      return intervention(
        "attention",
        "Appointment details changed",
        "Care, transport and access arrangements may no longer align with the updated appointment.",
        [
          "Recalculate pickup and support times.",
          "Ask the participant to approve any revised service requests.",
        ],
        true,
        false,
        null,
      );
    case "provider_no_response":
      return intervention(
        "attention",
        "Provider response is overdue",
        "The provider has not responded within the expected service window.",
        [
          "Prepare alternative providers.",
          "Escalate to a coordinator if the mission deadline is near.",
        ],
        false,
        false,
        null,
      );
    case "access_evidence_stale":
      return intervention(
        "attention",
        "Accessibility evidence may be stale",
        "The destination access information is old enough that it should be reconfirmed.",
        [
          "Contact the venue for current access details.",
          "Keep unknown features labelled as unknown.",
        ],
        false,
        false,
        null,
      );
    case "mission_deadline_approaching":
      return intervention(
        "attention",
        "Mission deadline is approaching",
        "One or more mission dependencies remain unresolved close to the required time.",
        [
          "Prioritise unresolved care and transport dependencies.",
          "Offer a human coordination pathway.",
        ],
        false,
        true,
        "support_coordinator",
      );
    case "invoice_received":
      return intervention(
        "information",
        "Invoice received",
        "An invoice is available for participant review and reconciliation against delivered services.",
        ["Compare the invoice with booking and service-log evidence."],
        false,
        false,
        "financial_reviewer",
      );
    case "participant_preference_changed":
      return intervention(
        "information",
        "Participant preference changed",
        "Future recommendations should use the newly confirmed preference. Existing bookings remain unchanged.",
        ["Re-evaluate open recommendations without changing confirmed services."],
        false,
        false,
        null,
      );
  }
}

function intervention(
  severity: CareOSContinuityIntervention["severity"],
  title: string,
  explanation: string,
  recoveryActions: string[],
  participantApprovalRequired: boolean,
  humanReviewRequired: boolean,
  assignedRole: CareOSContinuityIntervention["assignedRole"],
): CareOSContinuityIntervention {
  return {
    severity,
    title,
    explanation,
    recoveryActions,
    participantApprovalRequired,
    humanReviewRequired,
    assignedRole,
  };
}
