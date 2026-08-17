import { z } from "zod";

export const contractVersionSchema = z.literal("1.0");
export const opaqueIdSchema = z.string().min(1).max(128);
export const correlationIdSchema = z.string().uuid();
export const jurisdictionCodeSchema = z.enum(["AU", "INTL_SYNTHETIC"]);
export const localeSchema = z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/);
export const timeZoneSchema = z.string().min(1).max(100);
export const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);
export const moneySchema = z.object({
  currency: currencyCodeSchema,
  minorUnits: z.number().int().safe(),
}).strict();

export const autonomyLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const authorityGrantSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  actorId: opaqueIdSchema,
  principalId: opaqueIdSchema,
  tenantId: opaqueIdSchema,
  domain: z.enum(["care", "transport", "employment", "foods", "rehabilitation", "finance", "communication"]),
  permittedActions: z.array(z.string().min(1)).min(1),
  autonomyCeiling: autonomyLevelSchema,
  constraints: z.record(z.string(), z.unknown()).default({}),
  jurisdiction: jurisdictionCodeSchema,
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
}).strict();

export const accessPassportSchema = z.object({
  schemaVersion: contractVersionSchema,
  participantId: opaqueIdSchema,
  provenance: z.enum(["participant_confirmed", "authoritative_core_record"]),
  visibility: z.enum(["private", "request_scoped", "approved_service"]),
  communication: z.array(z.string()).default([]),
  mobility: z.array(z.string()).default([]),
  sensory: z.array(z.string()).default([]),
  cognitive: z.array(z.string()).default([]),
  assistanceAnimal: z.boolean().default(false),
  equipment: z.array(z.string()).default([]),
  privacyPreferences: z.array(z.string()).default([]),
}).strict();

export const journeyNodeSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  domain: z.enum(["care", "transport", "employment", "foods", "rehabilitation", "finance", "communication", "human_review"]),
  dependencies: z.array(opaqueIdSchema).default([]),
  status: z.enum(["proposed", "blocked", "awaiting_confirmation", "confirmed", "completed", "recovery_required"]),
  confirmationState: z.enum(["not_required", "required", "granted", "declined"]),
  recoveryState: z.enum(["none", "proposal_required", "human_review"]),
}).strict();

export const journeySessionSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  participantId: opaqueIdSchema,
  tenantId: opaqueIdSchema,
  goal: z.string().min(1).max(500),
  locale: localeSchema,
  jurisdiction: jurisdictionCodeSchema,
  nodes: z.array(journeyNodeSchema),
  status: z.enum(["draft", "proposed", "blocked", "completed"]),
}).strict();

export const domainIntentSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  domain: journeyNodeSchema.shape.domain,
  proposedAction: z.string().min(1),
  reason: z.string().min(1),
  evidenceIds: z.array(opaqueIdSchema),
  uncertainty: z.array(z.string()),
  reversibility: z.enum(["reversible", "irreversible", "unknown"]),
  risk: z.enum(["low", "moderate", "high"]),
  requiredAuthority: z.string().min(1),
}).strict();

export const policyDecisionSchema = z.object({
  schemaVersion: contractVersionSchema,
  decision: z.enum(["allow_display", "allow_draft", "require_confirmation", "require_human_review", "deny"]),
  reasonCodes: z.array(z.string().min(1)).min(1),
  authorityId: opaqueIdSchema.nullable(),
}).strict();

export const toolInvocationSchema = z.object({
  schemaVersion: contractVersionSchema,
  capability: z.string().min(1),
  input: z.unknown(),
  authorityReference: opaqueIdSchema,
  idempotencyKey: z.string().uuid(),
  correlationId: correlationIdSchema,
  dryRun: z.boolean(),
}).strict();

export const domainEventEnvelopeSchema = z.object({
  schemaVersion: contractVersionSchema,
  eventType: z.string().min(1),
  tenantId: opaqueIdSchema,
  participantId: opaqueIdSchema,
  actorId: opaqueIdSchema,
  correlationId: correlationIdSchema,
  causationId: correlationIdSchema.nullable(),
  occurredAt: z.string().datetime(),
  source: z.string().min(1),
  payload: z.unknown(),
}).strict();

export const auditEventSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  previousHash: z.string().nullable(),
  currentHash: z.string(),
  policyDecision: policyDecisionSchema,
  proposedAction: z.string().nullable(),
  executedAction: z.string().nullable(),
  modelMetadata: z.record(z.string(), z.string()).default({}),
  outcome: z.string().min(1),
}).strict();

export const evaluationResultSchema = z.object({
  schemaVersion: contractVersionSchema,
  scenarioId: opaqueIdSchema,
  expectedOutcome: z.string(),
  observedOutcome: z.string(),
  safetyAssertions: z.array(z.object({ id: z.string(), passed: z.boolean() })),
  accessibilityAssertions: z.array(z.object({ id: z.string(), passed: z.boolean() })),
  latencyMs: z.number().int().nonnegative(),
  regressionMetadata: z.record(z.string(), z.string()).default({}),
}).strict();

export type AuthorityGrant = z.infer<typeof authorityGrantSchema>;
export type AccessPassport = z.infer<typeof accessPassportSchema>;
export type JourneySession = z.infer<typeof journeySessionSchema>;
export type JourneyNode = z.infer<typeof journeyNodeSchema>;
export type DomainIntent = z.infer<typeof domainIntentSchema>;
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;
export type ToolInvocation = z.infer<typeof toolInvocationSchema>;
export type DomainEventEnvelope = z.infer<typeof domainEventEnvelopeSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

/** Access as Infrastructure — twenty functional domains (not impairment labels). */
export const accessDomainSchema = z.enum([
  "mobility_movement",
  "reach_strength_dexterity",
  "seating_stamina",
  "vision",
  "hearing",
  "speech_communication",
  "auslan_language",
  "cognition_learning",
  "executive_memory",
  "sensory_regulation",
  "psychosocial",
  "pain_fatigue_fluctuating",
  "self_care_continence",
  "equipment_at",
  "assistance_animals",
  "digital",
  "service_staff",
  "financial_admin",
  "transport",
  "emergency",
]);

export const accessCriticalitySchema = z.enum(["required", "strong_preference", "preference"]);
export const accessContextScopeSchema = z.enum(["always", "activity_specific", "journey_specific"]);
export const accessTimingSchema = z.enum(["permanent", "temporary", "fluctuating"]);
export const accessAssistanceModeSchema = z.enum(["independent", "optional", "required"]);
export const accessDisclosureScopeSchema = z.enum([
  "private",
  "service_provider",
  "worker",
  "employer",
  "venue",
  "transport_provider",
  "emergency",
  "support_coordinator",
]);
export const accessProvenanceStatusSchema = z.enum([
  "verified",
  "observed",
  "venue_reported",
  "community_reported",
  "unknown",
  "outdated",
  "disputed",
]);
export const accessCompatibilityStateSchema = z.enum([
  "compatible",
  "compatible_with_adjustment",
  "uncertain",
  "incompatible",
]);
export const accessEntityTypeSchema = z.enum([
  "place",
  "footpath",
  "transport_stop",
  "vehicle",
  "support_provider",
  "workplace",
  "school",
  "hospital",
  "event",
  "park",
  "accommodation",
  "digital_service",
  "path_segment",
  "entrance",
  "amenity",
  "other",
]);
export const accessJourneySegmentKindSchema = z.enum([
  "preparation",
  "origin",
  "path_to_transport",
  "pickup_or_station",
  "boarding",
  "vehicle",
  "interchange",
  "drop_off",
  "path_to_destination",
  "entrance",
  "internal_movement",
  "service_or_activity",
  "amenities",
  "return_journey",
]);

export const accessRequirementSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  passportId: opaqueIdSchema,
  ontologyConceptId: z.string().min(1),
  domain: accessDomainSchema,
  attribute: z.string().min(1),
  comparator: z.enum(["eq", "neq", "gte", "lte", "gt", "lt", "includes"]).optional(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  unit: z.string().nullable().optional(),
  criticality: accessCriticalitySchema,
  contextScope: accessContextScopeSchema,
  timing: accessTimingSchema,
  assistance: accessAssistanceModeSchema,
  disclosureScopes: z.array(accessDisclosureScopeSchema).default([]),
  userConfirmed: z.boolean(),
  acceptableAdjustmentIds: z.array(opaqueIdSchema).optional(),
  notes: z.string().optional(),
}).strict();

export const accessCapabilitySchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  entityType: accessEntityTypeSchema,
  entityId: opaqueIdSchema,
  placeId: opaqueIdSchema.nullable().optional(),
  ontologyConceptId: z.string().min(1),
  attribute: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().nullable().optional(),
  availability: z.unknown().optional(),
  evidenceObservationId: opaqueIdSchema,
  status: accessProvenanceStatusSchema,
}).strict();

export const accessObservationSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  featureKey: z.string().min(1),
  ontologyConceptId: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().nullable().optional(),
  sourceType: z.enum([
    "trained_assessor",
    "venue",
    "community",
    "operator",
    "system",
    "synthetic",
  ]),
  observedAt: z.string().datetime(),
  evidenceKinds: z.array(z.string()).default([]),
  verificationStatus: accessProvenanceStatusSchema,
  confidence: z.number().min(0).max(1).nullable().optional(),
  reviewDue: z.string().datetime().nullable().optional(),
  disputed: z.boolean(),
  placeId: opaqueIdSchema.nullable().optional(),
  entityType: accessEntityTypeSchema.nullable().optional(),
  entityId: opaqueIdSchema.nullable().optional(),
  evidenceEnvelopeId: opaqueIdSchema.nullable().optional(),
  observerUserId: opaqueIdSchema.nullable().optional(),
}).strict();

export const accessAdjustmentSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  entityType: accessEntityTypeSchema,
  entityId: opaqueIdSchema,
  ontologyConceptId: z.string().nullable().optional(),
  summary: z.string().min(1).max(500),
  description: z.string().nullable().optional(),
  availability: z.unknown().optional(),
  status: accessProvenanceStatusSchema,
}).strict();

export const accessCompatibilitySchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  passportId: opaqueIdSchema,
  entityType: accessEntityTypeSchema,
  entityId: opaqueIdSchema,
  journeyId: opaqueIdSchema.nullable().optional(),
  state: accessCompatibilityStateSchema,
  required: z.object({
    met: z.array(z.string()),
    unmet: z.array(z.string()),
    uncertain: z.array(z.string()),
  }),
  preferences: z.object({
    met: z.array(z.string()),
    unmet: z.array(z.string()),
    uncertain: z.array(z.string()),
  }),
  adjustments: z.array(z.object({
    id: opaqueIdSchema,
    summary: z.string(),
  })).default([]),
  evidenceRefs: z.array(opaqueIdSchema).default([]),
  limitations: z.array(z.string()).default([]),
  participantDecisionRequired: z.boolean(),
  evaluatedAt: z.string().datetime(),
}).strict();

export const accessCompatibilityRequestSchema = z.object({
  schemaVersion: contractVersionSchema,
  passportId: opaqueIdSchema,
  entityType: accessEntityTypeSchema,
  entityId: opaqueIdSchema,
  context: z.object({
    activity: z.string().nullable().optional(),
    journeyId: opaqueIdSchema.nullable().optional(),
  }).default({}),
}).strict();

/** Full Access Passport for Access Infrastructure (distinct from programme projection schema). */
export const accessInfrastructurePassportSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  participantId: opaqueIdSchema,
  visibilityDefault: z.enum(["private", "request_scoped", "approved_service"]),
  containsDiagnosis: z.literal(false),
  requirements: z.array(accessRequirementSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export type AccessDomain = z.infer<typeof accessDomainSchema>;
export type AccessRequirementContract = z.infer<typeof accessRequirementSchema>;
export type AccessCapabilityContract = z.infer<typeof accessCapabilitySchema>;
export type AccessObservationContract = z.infer<typeof accessObservationSchema>;
export type AccessAdjustmentContract = z.infer<typeof accessAdjustmentSchema>;
export type AccessCompatibilityContract = z.infer<typeof accessCompatibilitySchema>;
export type AccessInfrastructurePassport = z.infer<typeof accessInfrastructurePassportSchema>;

export const commonsContributionPreferenceSchema = z.object({
  schemaVersion: contractVersionSchema,
  participantId: opaqueIdSchema,
  categories: z.array(z.string()).default([]),
  geographicPrecision: z.enum(["none", "region", "coarse_locality"]),
  retentionDays: z.number().int().min(1).max(3650),
  allowResearch: z.boolean().default(false),
  allowAdvocacy: z.boolean().default(false),
  allowModelEvaluation: z.boolean().default(false),
  optedInAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
}).strict();

export const commonsEvidenceTypeSchema = z.enum([
  "participant_report",
  "carer_report",
  "provider_statement",
  "professional_assessment",
  "mapable_verification",
  "government_data",
  "transport_feed",
  "community_corroboration",
  "ai_inference",
]);

export const publicDecisionRegisterEntrySchema = z.object({
  schemaVersion: contractVersionSchema,
  systemName: z.string().min(1),
  purpose: z.string().min(1),
  affectedUsers: z.array(z.string()),
  dataCategories: z.array(z.string()),
  decisionAuthority: z.string().min(1),
  humanOversight: z.string().min(1),
  risks: z.array(z.string()),
  prohibitedUses: z.array(z.string()),
  testingCompleted: z.array(z.string()),
  versionHistory: z.array(z.string()),
  complaintPathway: z.string().min(1),
  rollbackProcess: z.string().min(1),
}).strict();

export type CommonsContributionPreference = z.infer<
  typeof commonsContributionPreferenceSchema
>;

export const humanReviewCaseSchema = z.object({
  schemaVersion: contractVersionSchema,
  id: opaqueIdSchema,
  participantId: opaqueIdSchema,
  tenantId: opaqueIdSchema,
  category: z.enum(["uncertainty", "recovery", "safeguarding"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  reasonCodes: z.array(z.string()).min(1),
  ownerId: opaqueIdSchema.nullable(),
  dueAt: z.string().datetime().nullable(),
  status: z.enum(["open", "acknowledged", "resolved"]),
}).strict();

export const capabilityRiskTierSchema = z.enum(["low", "moderate", "high", "restricted"]);
export const actionDecisionSchema = z.enum([
  "ALLOW_DISPLAY",
  "ALLOW_DRAFT",
  "REQUIRE_PARTICIPANT_CONFIRMATION",
  "REQUIRE_HUMAN_REVIEW",
  "REQUIRE_MORE_EVIDENCE",
  "DENY_NO_AUTHORITY",
  "DENY_PROHIBITED",
  "DENY_EXPIRED",
  "ESCALATE_SAFEGUARDING",
]);
export const evidenceReferenceSchema = z.object({
  sourceType: z.enum(["verified_platform_fact", "participant_preference", "provider_claim", "derived_inference", "model_suggestion", "missing"]),
  sourceId: opaqueIdSchema.optional(),
  timestamp: z.string().datetime(),
  jurisdiction: jurisdictionCodeSchema,
  verificationStatus: z.enum(["verified", "unverified", "conflicting", "missing"]),
}).strict();
export const proposedActionSchema = z.object({
  id: opaqueIdSchema,
  capability: z.string().min(1),
  domain: z.string().min(1),
  purpose: z.string().min(1),
  participantId: opaqueIdSchema,
  operation: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
  evidence: z.array(evidenceReferenceSchema),
  uncertainty: z.array(z.string()),
  reversibility: z.enum(["reversible", "irreversible", "unknown"]),
  autonomyLevel: autonomyLevelSchema,
  confirmationRequired: z.boolean(),
  expiresAt: z.string().datetime(),
}).strict();
export const intelligenceRequestSchema = z.object({
  requestId: correlationIdSchema,
  participantId: opaqueIdSchema,
  actorId: opaqueIdSchema,
  tenantId: opaqueIdSchema,
  capability: z.string().min(1),
  purpose: z.string().min(1),
  input: z.record(z.string(), z.unknown()),
}).strict();
export const intelligenceContextSchema = z.object({
  participantId: opaqueIdSchema,
  actorId: opaqueIdSchema,
  tenantId: opaqueIdSchema,
  authority: authorityGrantSchema,
  evidence: z.array(evidenceReferenceSchema),
  jurisdiction: jurisdictionCodeSchema,
}).strict();
export const proposedPlanSchema = z.object({
  id: opaqueIdSchema,
  actions: z.array(proposedActionSchema),
  uncertainty: z.array(z.string()),
  humanFallback: z.string().min(1),
}).strict();
export type ProposedAction = z.infer<typeof proposedActionSchema>;
export type ActionDecision = z.infer<typeof actionDecisionSchema>;
