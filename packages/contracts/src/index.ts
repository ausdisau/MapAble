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
