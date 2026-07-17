import { issueOutcomeReceipt } from "@/lib/outcomes/ledger";
import type { AssignmentReadinessResult } from "@/lib/workforce-readiness/evaluate";

/**
 * Taylor @ Harbour Civic Centre — Starting Work golden journey state machine.
 * Synthetic / controlled-pilot only. No live NDIA. No AI decisions.
 */

export type JourneyStepId =
  | "passport_selected"
  | "consent_checked"
  | "worker_fields_disclosed"
  | "readiness_evaluated"
  | "equipment_checked"
  | "care_authorised"
  | "transport_authorised"
  | "door_to_room_preflight"
  | "visit_pack_compiled"
  | "service_events_recorded"
  | "outcome_reviewed"
  | "invoice_created"
  | "provider_ops_surfaced"
  | "return_transport_cancelled"
  | "continuity_opened"
  | "regional_candidates_found"
  | "participant_approved_replacement"
  | "accountability_preserved";

export type JourneyFailureMode =
  | "stale_credential"
  | "inaccessible_vehicle"
  | "expired_consent"
  | "worker_cancellation"
  | "lift_outage"
  | "lost_phone"
  | "equipment_breakdown"
  | "rejected_invoice"
  | "handoff_not_accepted"
  | "participant_declines_outcome_review"
  | "provider_disputes_evidence"
  | "cross_tenant_access"
  | "duplicated_request"
  | "external_timeout";

export type GoldenJourneyState = {
  journeyId: string;
  participantLabel: "Taylor";
  venueLabel: "Harbour Civic Centre";
  stepsCompleted: JourneyStepId[];
  blocked: boolean;
  blockReason?: string;
  failureMode?: JourneyFailureMode;
  readiness?: AssignmentReadinessResult;
  outcomeReceiptId?: string;
  regionalCandidates: string[];
  regionalConfirmed: string[];
  notices: string[];
};

const NORMAL_FLOW: JourneyStepId[] = [
  "passport_selected",
  "consent_checked",
  "worker_fields_disclosed",
  "readiness_evaluated",
  "equipment_checked",
  "care_authorised",
  "transport_authorised",
  "door_to_room_preflight",
  "visit_pack_compiled",
  "service_events_recorded",
  "outcome_reviewed",
  "invoice_created",
  "provider_ops_surfaced",
  "return_transport_cancelled",
  "continuity_opened",
  "regional_candidates_found",
  "participant_approved_replacement",
  "accountability_preserved",
];

export function createStartingWorkJourney(): GoldenJourneyState {
  return {
    journeyId: `starting_work_${Date.now()}`,
    participantLabel: "Taylor",
    venueLabel: "Harbour Civic Centre",
    stepsCompleted: [],
    blocked: false,
    regionalCandidates: [],
    regionalConfirmed: [],
    notices: [
      "estimate ≠ guaranteed arrival",
      "request ≠ confirmed trip",
      "trip completed ≠ outcome achieved",
      "Academy completion ≠ competency",
      "candidate ≠ confirmed capacity",
      "unknown lift evidence remains unknown",
    ],
  };
}

export function runGoldenJourney(input: {
  failureMode?: JourneyFailureMode;
  readinessReady?: boolean;
  consentActive?: boolean;
}): GoldenJourneyState {
  const state = createStartingWorkJourney();
  const consentActive = input.consentActive !== false;
  const readinessReady = input.readinessReady !== false;

  for (const step of NORMAL_FLOW) {
    if (input.failureMode === "expired_consent" && step === "consent_checked") {
      state.blocked = true;
      state.blockReason = "Consent expired — fail closed";
      state.failureMode = "expired_consent";
      break;
    }
    if (input.failureMode === "cross_tenant_access" && step === "worker_fields_disclosed") {
      state.blocked = true;
      state.blockReason = "Cross-tenant disclosure denied";
      state.failureMode = "cross_tenant_access";
      break;
    }
    if (step === "readiness_evaluated") {
      if (input.failureMode === "stale_credential" || !readinessReady) {
        state.blocked = true;
        state.blockReason = "Readiness blocked — stale credential or missing evidence";
        state.failureMode = input.failureMode ?? "stale_credential";
        state.readiness = {
          ready: false,
          autoAssignment: false,
          evaluatedAt: new Date().toISOString(),
          reasons: [
            {
              code: "credential_expired",
              severity: "block",
              message: "Credential expired",
            },
          ],
        };
        break;
      }
      state.readiness = {
        ready: true,
        autoAssignment: false,
        evaluatedAt: new Date().toISOString(),
        reasons: [
          {
            code: "ready",
            severity: "info",
            message: "Human assignment still required",
          },
        ],
      };
    }
    if (input.failureMode === "inaccessible_vehicle" && step === "transport_authorised") {
      state.blocked = true;
      state.blockReason = "Vehicle not power-chair compatible";
      state.failureMode = "inaccessible_vehicle";
      break;
    }
    if (input.failureMode === "lift_outage" && step === "door_to_room_preflight") {
      state.stepsCompleted.push(step);
      state.notices.push("Lift evidence unknown/outage — route not claimed safe");
      continue;
    }
    if (input.failureMode === "lost_phone" && step === "visit_pack_compiled") {
      state.stepsCompleted.push(step);
      state.notices.push(
        "Device revoked — Visit Pack cleared; web / human assistance pathway remains",
      );
      continue;
    }
    if (
      input.failureMode === "participant_declines_outcome_review" &&
      step === "outcome_reviewed"
    ) {
      const receipt = issueOutcomeReceipt({
        participantId: "taylor-synthetic",
        goalStatement: "Start new job at Harbour Civic Centre with accessible support",
        participantDeclinedReview: true,
        unresolvedIssues: ["Participant declined outcome review"],
      });
      state.outcomeReceiptId = receipt.receiptId;
      state.stepsCompleted.push(step);
      continue;
    }
    if (input.failureMode === "rejected_invoice" && step === "invoice_created") {
      state.stepsCompleted.push(step);
      state.notices.push("Invoice rejected — Provider Ops attention item");
      continue;
    }
    if (step === "regional_candidates_found") {
      state.regionalCandidates = ["vehicle_alt_1", "worker_alt_1"];
      state.regionalConfirmed = [];
      state.stepsCompleted.push(step);
      continue;
    }
    if (
      input.failureMode === "handoff_not_accepted" &&
      step === "participant_approved_replacement"
    ) {
      state.blocked = true;
      state.blockReason = "Handoff not accepted — candidate remains unconfirmed";
      state.failureMode = "handoff_not_accepted";
      break;
    }
    if (!consentActive && step !== "passport_selected") {
      state.blocked = true;
      state.blockReason = "Consent inactive";
      break;
    }
    state.stepsCompleted.push(step);
  }

  if (
    state.stepsCompleted.includes("outcome_reviewed") &&
    !state.outcomeReceiptId
  ) {
    const receipt = issueOutcomeReceipt({
      participantId: "taylor-synthetic",
      goalStatement: "Start new job at Harbour Civic Centre with accessible support",
      serviceEvidenceRefs: ["care_event_1", "transport_trip_1"],
      participantObservation: "I arrived and started the induction",
      finalOutcome: "Employment day started with supports in place",
    });
    state.outcomeReceiptId = receipt.receiptId;
  }

  return state;
}

export function assertCandidateNotConfirmed(state: GoldenJourneyState): boolean {
  return state.regionalConfirmed.every((id) =>
    state.regionalCandidates.includes(id),
  ) && state.regionalConfirmed.length === 0
    ? true
    : state.regionalConfirmed.every((c) => state.regionalCandidates.includes(c));
}
