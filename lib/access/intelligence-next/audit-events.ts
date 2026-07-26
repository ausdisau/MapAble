/**
 * Audit / outbox event name constants for Access Intelligence Next.
 * Emitters may reference these; this foundation does not write production audit rows.
 */

export const ACCESS_INTELLIGENCE_NEXT_AUDIT_EVENTS = {
  ontologyVersionPublished: "access.ontology_version_published",
  queryCreated: "access.query_created",
  queryValidated: "access.query_validated",
  queryExecuted: "access.query_executed",
  requirementsCompiled: "access.requirements_compiled",
  evidenceRegistered: "access.evidence_registered",
  evidenceExpired: "access.evidence_expired",
  evidenceConflicted: "access.evidence_conflicted",
  evidenceSuperseded: "access.evidence_superseded",
  temporalStateChanged: "access.temporal_state_changed",
  changeCandidateDetected: "access.change_candidate_detected",
  changeReviewed: "access.change_reviewed",
  reliabilityUpdated: "access.reliability_updated",
  journeyDependencyCreated: "access.journey_dependency_created",
  journeyDependencyFailed: "access.journey_dependency_failed",
  journeyImpactCalculated: "access.journey_impact_calculated",
  journeyPreflightCompleted: "access.journey_preflight_completed",
  counterfactualCompleted: "access.counterfactual_completed",
  burdenRecorded: "access.burden_recorded",
  resultCreated: "access.result_created",
  outcomeRecorded: "access.outcome_recorded",
  safetyIncidentCreated: "access.safety_incident_created",
  modelEvaluationFailed: "access.model_evaluation_failed",
} as const;

export type AccessIntelligenceNextAuditEvent =
  (typeof ACCESS_INTELLIGENCE_NEXT_AUDIT_EVENTS)[keyof typeof ACCESS_INTELLIGENCE_NEXT_AUDIT_EVENTS];
