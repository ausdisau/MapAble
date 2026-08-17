import { z } from "zod";

export const adminListQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  atRiskOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const highRiskItemSchema = z.object({
  id: z.string(),
  domain: z.enum([
    "participants",
    "workers",
    "bookings",
    "safeguarding",
    "billing",
    "compliance",
    "agent-runs",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  title: z.string(),
  summary: z.string(),
  href: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  aiGenerated: z.boolean().optional(),
});

export const commandCentreMetricsSchema = z.object({
  pendingParticipantConfirmations: z.number(),
  bookingsAtRisk: z.number(),
  workerCredentialExpiries: z.number(),
  billingExceptions: z.number(),
  safeguardingAlerts: z.number(),
  unresolvedComplaints: z.number(),
  guardrailBlocks: z.number(),
  agentRunsNeedingReview: z.number(),
});

export const commandCentreResponseSchema = z.object({
  metrics: commandCentreMetricsSchema,
  highRiskItems: z.array(highRiskItemSchema),
});

export const participantAdminRowSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string(),
  homeSuburb: z.string().nullable().optional(),
  homeState: z.string().nullable().optional(),
  accessRequirementsSummary: z.string().nullable().optional(),
  participantNotes: z.string().nullable().optional(),
  pendingCareRequests: z.number().optional(),
  href: z.string(),
});

export const workerAdminRowSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  organisationId: z.string(),
  verificationStatus: z.string(),
  wwccStatus: z.string(),
  firstAidStatus: z.string(),
  workerScreeningStatus: z.string(),
  credentialAlert: z.boolean(),
  href: z.string(),
});

export const bookingAdminRowSchema = z.object({
  id: z.string(),
  careRequestId: z.string(),
  participantId: z.string(),
  status: z.string(),
  organisationId: z.string(),
  atRisk: z.boolean(),
  atRiskReason: z.string().optional(),
  href: z.string(),
});

export const safeguardingAdminRowSchema = z.object({
  id: z.string(),
  kind: z.enum(["incident", "risk_flag"]),
  title: z.string(),
  severity: z.string(),
  status: z.string(),
  occurredAt: z.string().nullable().optional(),
  descriptionPreview: z.string().nullable().optional(),
  href: z.string(),
});

export const billingExceptionRowSchema = z.object({
  id: z.string(),
  status: z.string(),
  reason: z.string(),
  userId: z.string().optional(),
  href: z.string(),
});

export const complianceTaskRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  dueAt: z.string().nullable().optional(),
  href: z.string(),
});

export const agentRunRowSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "care_transform",
    "ai_match",
    "fairness",
    "match_run",
  ]),
  title: z.string(),
  status: z.string(),
  needsReview: z.boolean(),
  plainLanguageReason: z.string().optional(),
  technicalDetail: z.string().optional(),
  aiGenerated: z.boolean(),
  href: z.string().optional(),
});

export type CommandCentreResponse = z.infer<typeof commandCentreResponseSchema>;
export type HighRiskItem = z.infer<typeof highRiskItemSchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
