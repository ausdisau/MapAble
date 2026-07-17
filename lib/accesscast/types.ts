import type { AccessEvidenceClass } from "@/lib/access-intelligence-next";

import type { AccessCastForecastState } from "./states";

export type AccessCastForecastHorizon =
  | "nowcast"
  | "near_term"
  | "day_outlook"
  | "planning_outlook"
  | "long_range";

export type AccessCastRequirementStatus = "matched" | "failed" | "unresolved";

export type AccessCastRequirement = {
  ontologyConceptId: string;
  kind: "require" | "prefer" | "avoid";
  status: AccessCastRequirementStatus;
  detail: string;
  hard: boolean;
};

export type AccessCastCondition = {
  conditionId: string;
  label: string;
  kind:
    | "incident"
    | "scheduled_change"
    | "construction"
    | "service_unconfirmed"
    | "evidence_gap"
    | "conflict"
    | "model_candidate"
    | "environmental_advisory";
  effectiveFrom: string | null;
  effectiveTo: string | null;
  affectsSegmentIds: string[];
  evidenceClass: AccessEvidenceClass;
  summary: string;
  /** Model candidates must never independently block. */
  independentlyBlocks: boolean;
};

export type AccessCastAdvisory = {
  advisoryId: string;
  title: string;
  body: string;
  state: AccessCastForecastState;
  placeOrAssetRef: string;
  evidenceSummary: string;
  limitations: string[];
};

export type AccessCastConfirmationTaskStatus =
  | "suggested"
  | "confirmation_requested"
  | "confirmation_received"
  | "evidence_verified";

export type AccessCastConfirmationTask = {
  taskId: string;
  label: string;
  responsibleOrganisation: string;
  dueAt: string | null;
  status: AccessCastConfirmationTaskStatus;
  segmentId: string | null;
  /** Never equals journey_guaranteed. */
  doesNotGuaranteeJourney: true;
};

export type AccessCastFallback = {
  fallbackId: string;
  label: string;
  verified: boolean;
  summary: string;
  limitations: string[];
};

export type AccessCastSegmentKind =
  | "origin"
  | "local_route"
  | "pickup"
  | "transport"
  | "interchange"
  | "destination_stop"
  | "external_path"
  | "entrance"
  | "internal_route"
  | "exact_destination"
  | "return_journey";

export type AccessCastSegment = {
  segmentId: string;
  kind: AccessCastSegmentKind;
  label: string;
  currentState: AccessCastForecastState;
  futureState: AccessCastForecastState | null;
  evidenceSummary: string;
  freshness: "fresh" | "aging" | "stale" | "unknown";
  reliability: "stable_history" | "recurring_disruption" | "insufficient_history" | "cannot_forecast";
  hardRequirementEffect: "none" | "supported" | "unresolved" | "blocked";
  fallback: AccessCastFallback | null;
  confirmationTask: AccessCastConfirmationTask | null;
  responsibleOrganisation: string;
  canonicalRef: string | null;
  singlePointOfFailure: boolean;
};

export type AccessCastTimelineEntry = {
  at: string;
  label: string;
  kind:
    | "confirmation_due"
    | "scheduled_change"
    | "departure_buffer"
    | "journey_start"
    | "expected_arrival"
    | "appointment"
    | "return_confirmation";
  segmentId: string | null;
};

export type AccessCastEvidenceItem = {
  evidenceId: string;
  class: AccessEvidenceClass;
  ontologyConceptId?: string;
  source: string;
  observedAt: string;
  summary: string;
  limitations: string[];
  stale: boolean;
};

export type AccessCastEvidenceEnvelope = {
  forecastId: string;
  journeyOrPlaceRef: string;
  requirementSetRef: string;
  forecastGeneratedAt: string;
  intendedJourneyTime: string;
  horizon: AccessCastForecastHorizon;
  conclusionState: AccessCastForecastState;
  matchedRequirements: AccessCastRequirement[];
  failedRequirements: AccessCastRequirement[];
  unresolvedRequirements: AccessCastRequirement[];
  conditions: AccessCastCondition[];
  sourceEvidence: AccessCastEvidenceItem[];
  freshness: {
    oldestEvidenceAt: string | null;
    newestEvidenceAt: string | null;
    staleConceptIds: string[];
  };
  reliability: string | null;
  conflicts: Array<{
    conceptId: string;
    leftEvidenceId: string;
    rightEvidenceId: string;
    note: string;
  }>;
  assumptions: string[];
  fallback: AccessCastFallback | null;
  confirmationTasks: AccessCastConfirmationTask[];
  confidenceHorizon: string;
  expiry: string;
  auditCorrelationId: string;
  limitations: string[];
};

export type AccessCastRequest = {
  placeRef?: string;
  journeyRef?: string;
  requirementSetRef: string;
  intendedJourneyTime: string;
  now?: string;
  /** Scenario overrides for synthetic fixtures. */
  scenarioId?:
    | "harbour_place_baseline"
    | "harbour_lift_outage"
    | "harbour_conflicting_lift"
    | "harbour_vision_candidate"
    | "starting_work_tomorrow"
    | "return_journey_fragile";
};

export type AccessCastResult = {
  forecastId: string;
  synthetic: true;
  productionClaim: "none";
  tagline: "Know before you go.";
  journeyLabel: string;
  intendedJourneyTime: string;
  horizon: AccessCastForecastHorizon;
  state: AccessCastForecastState;
  stateLabel: string;
  why: string[];
  suggestedChecks: string[];
  fallbackSummary: string;
  confidenceHorizon: string;
  segments: AccessCastSegment[];
  timeline: AccessCastTimelineEntry[];
  advisories: AccessCastAdvisory[];
  envelope: AccessCastEvidenceEnvelope;
  /** Authoritative list alternative to any map view. */
  listAlternative: Array<{
    id: string;
    label: string;
    state: AccessCastForecastState;
    stateLabel: string;
    summary: string;
  }>;
  limitations: string[];
};

export type AccessCastOfflinePack = {
  packId: string;
  forecastId: string;
  generatedAt: string;
  expiresAt: string;
  savedAt: string;
  journeyLabel: string;
  stateAtSave: AccessCastForecastState;
  result: AccessCastResult;
  sourcesNotRefreshed: string[];
  limitations: string[];
  /** Never present offline pack as silently current. */
  offlineClaim: "saved_snapshot_only";
};

export type AccessCastOfflineEvaluation = {
  pack: AccessCastOfflinePack;
  evaluatedAt: string;
  effectiveState: AccessCastForecastState;
  changedSinceSaved: boolean;
  expired: boolean;
  reasons: string[];
  limitations: string[];
};
