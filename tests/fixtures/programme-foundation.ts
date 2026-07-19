export const programmeFoundationFixtures = {
  participantId: "fixture-participant-1",
  supporterId: "fixture-supporter-1",
  navigatorId: "fixture-navigator-1",
  adminId: "fixture-admin-1",
  organisationId: "fixture-org-1",
  correlationId: "fixture-correlation-1",
  authorityGrant: {
    purpose: "view_calendar",
    allowedFields: ["calendar.events", "calendar.next_appointment"],
    allowedActions: ["view"],
  },
  navigatorRequest: {
    goalSummary: "Coordinate employment support, transport and home assistance",
    sharedFields: ["goals", "calendar.events", "transport.preferences"],
    preferredModes: ["video", "plain_language"],
  },
  sourceRecord: {
    sourceOrganisation: "Australian Government",
    jurisdiction: "AU-Commonwealth",
    title: "Test Programme Source",
    sourceType: "government_guidance" as const,
    version: "2026-01",
  },
};

export const forbiddenAuraActions = [
  "decide_eligibility",
  "approve_funding",
  "release_payment",
  "decide_clinical_readiness",
  "resolve_safeguarding",
  "infer_diagnosis",
  "infer_capacity",
  "send_without_approval",
] as const;

export const programmeFlagEnvVars = [
  "MAPABLE_PATHWAYS_ENABLED",
  "MAPABLE_TRANSITION_HOME_ENABLED",
  "MAPABLE_KIDS_ENABLED",
  "MAPABLE_LIFESPAN_ENABLED",
  "MAPABLE_HOME_ENABLED",
  "MAPABLE_AT_LIFECYCLE_ENABLED",
  "MAPABLE_WORK_RETENTION_ENABLED",
  "MAPABLE_CARER_CONTINUITY_ENABLED",
  "MAPABLE_REGIONAL_CAPACITY_ENABLED",
  "MAPABLE_RIGHTS_NAVIGATOR_ENABLED",
  "MAPABLE_INTEGRATION_FOUNDRY_ENABLED",
  "MAPABLE_DATA_COOPERATIVE_ENABLED",
] as const;
