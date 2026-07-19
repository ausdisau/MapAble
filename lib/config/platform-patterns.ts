export const platformPatternsConfig = {
  onboardingGateEnabled:
    process.env.ONBOARDING_GATE_ENABLED === "true",
  journeyPersistenceEnabled:
    process.env.JOURNEY_PERSISTENCE_ENABLED === "true",
  intakeClassifierEnabled:
    process.env.INTAKE_CLASSIFIER_ENABLED === "true",
  bookingGraphEnabled: process.env.BOOKING_GRAPH_ENABLED === "true",
  consentSharingPanelEnabled:
    process.env.CONSENT_SHARING_PANEL_ENABLED === "true",
  transparentBillingEnabled:
    process.env.TRANSPARENT_BILLING_ENABLED === "true",
  trustSafetyQueueEnabled:
    process.env.TRUST_SAFETY_QUEUE_ENABLED === "true",
  agentRunPersistenceEnabled:
    process.env.AGENT_RUN_PERSISTENCE_ENABLED === "true",
  reliabilityAdvisoryEnabled:
    process.env.RELIABILITY_ADVISORY_ENABLED === "true",
  matchParticipantConfirmRequired:
    process.env.MATCH_PARTICIPANT_CONFIRM_REQUIRED !== "false",
};
