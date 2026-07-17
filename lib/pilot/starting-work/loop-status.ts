/**
 * Production-shaped Care / Transport / Billing loop status for the pilot.
 * Placeholders are explicit — not marketed as complete.
 */

export type LoopStageStatus =
  | "not_started"
  | "placeholder"
  | "governed_partial"
  | "evidence_linked"
  | "complete_for_pilot";

export type OperatingLoopStatus = {
  care: Record<string, LoopStageStatus>;
  transport: Record<string, LoopStageStatus>;
  billing: Record<string, LoopStageStatus>;
};

export function getStartingWorkLoopStatus(): OperatingLoopStatus {
  return {
    care: {
      request: "governed_partial",
      participant_introduction: "governed_partial",
      worker_readiness: "evidence_linked",
      service_agreement: "placeholder",
      shift_confirmation: "governed_partial",
      delivery_evidence: "governed_partial",
      participant_review: "governed_partial",
      invoice: "governed_partial",
      reconciliation: "placeholder",
      outcome: "evidence_linked",
    },
    transport: {
      request: "governed_partial",
      compatibility: "governed_partial",
      quote: "placeholder",
      participant_acceptance: "governed_partial",
      driver_vehicle_verification: "placeholder",
      dispatch: "governed_partial",
      trip_events: "governed_partial",
      evidence: "governed_partial",
      participant_review: "governed_partial",
      billing: "governed_partial",
      recovery: "governed_partial",
    },
    billing: {
      service_evidence: "governed_partial",
      billable_item: "governed_partial",
      invoice: "governed_partial",
      funding_route: "placeholder",
      claim_package: "placeholder",
      adapter: "placeholder",
      reconciliation: "placeholder",
      provider_payable: "placeholder",
      accounting_journal: "placeholder",
    },
  };
}
