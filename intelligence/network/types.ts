import { z } from "zod";

import { mapAbleModuleSchema } from "../types";

export const careOSAgentIdSchema = z.enum([
  "manager",
  "participant_advocate",
  "care_coordination",
  "transport_coordination",
  "access_evidence",
  "continuity",
  "worker_support",
  "provider_capacity",
  "rights",
  "safeguarding",
  "finance",
  "robotics",
]);

export type CareOSAgentId = z.infer<typeof careOSAgentIdSchema>;

export const careOSAuthorityLevelSchema = z.enum([
  "L0_INFORMATION",
  "L1_DRAFT",
  "L2_RECOMMEND",
  "L3_CONFIRMED_ACTION",
  "PROHIBITED",
]);

export type CareOSAuthorityLevel = z.infer<typeof careOSAuthorityLevelSchema>;

export const careOSNetworkRequestSchema = z.object({
  goal: z.string().trim().min(3).max(4000),
  modules: z
    .array(mapAbleModuleSchema)
    .min(1)
    .max(8)
    .default(["core", "care", "transport", "access"]),
  includeAccessibilityProfile: z.boolean().default(false),
  includeContinuityAnalysis: z.boolean().default(true),
  plainLanguage: z.boolean().default(true),
});

export type CareOSNetworkRequest = z.infer<typeof careOSNetworkRequestSchema>;

export const careOSAgentActivationSchema = z.object({
  id: careOSAgentIdSchema,
  name: z.string(),
  purpose: z.string(),
  status: z.enum(["active", "available", "disabled", "human_only", "research_only"]),
  maximumAuthorityLevel: careOSAuthorityLevelSchema,
  capabilities: z.array(z.string()),
  reason: z.string(),
});

export type CareOSAgentActivation = z.infer<typeof careOSAgentActivationSchema>;

export const careOSMissionNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "goal",
    "appointment",
    "care_support",
    "transport",
    "accessibility",
    "provider",
    "worker",
    "funding",
    "approval",
    "contingency",
    "human_review",
  ]),
  label: z.string(),
  status: z.enum([
    "confirmed",
    "available",
    "missing",
    "needs_review",
    "not_authorised",
    "disabled",
  ]),
  sourceModule: mapAbleModuleSchema,
  recordId: z.string().nullable(),
  startsAt: z.string().nullable(),
  details: z.string(),
  evidence: z.array(z.string()),
});

export type CareOSMissionNode = z.infer<typeof careOSMissionNodeSchema>;

export const careOSMissionEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  relationship: z.enum([
    "requires",
    "supports",
    "depends_on",
    "validated_by",
    "reviewed_by",
    "fallback_for",
  ]),
});

export type CareOSMissionEdge = z.infer<typeof careOSMissionEdgeSchema>;

export const careOSContinuityAlertSchema = z.object({
  id: z.string(),
  severity: z.enum(["information", "attention", "urgent"]),
  code: z.enum([
    "APPOINTMENT_NOT_FOUND",
    "CARE_COVERAGE_UNCONFIRMED",
    "TRANSPORT_UNCONFIRMED",
    "LINKED_TRANSPORT_MISSING",
    "ACCESS_EVIDENCE_MISSING",
    "MODULE_NOT_AUTHORISED",
    "MODULE_DISABLED",
    "HUMAN_REVIEW_REQUIRED",
  ]),
  title: z.string(),
  explanation: z.string(),
  affectedNodeIds: z.array(z.string()),
  recoveryActions: z.array(z.string()),
  humanReviewRequired: z.boolean(),
});

export type CareOSContinuityAlert = z.infer<typeof careOSContinuityAlertSchema>;

export const careOSRecommendationSchema = z.object({
  id: z.string(),
  priority: z.number().int().min(1).max(10),
  title: z.string(),
  explanation: z.string(),
  agentIds: z.array(careOSAgentIdSchema),
  affectedNodeIds: z.array(z.string()),
  nextAction: z.object({
    label: z.string(),
    href: z.string().nullable(),
    authorityLevel: careOSAuthorityLevelSchema,
  }),
});

export type CareOSRecommendation = z.infer<typeof careOSRecommendationSchema>;

export const careOSActionProposalSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  participantId: z.string(),
  actionType: z.enum([
    "submit_care_request",
    "submit_transport_request",
    "send_provider_message",
    "save_participant_preference",
    "request_human_coordination",
  ]),
  title: z.string(),
  summary: z.string(),
  status: z.enum(["draft", "awaiting_approval", "approved", "expired", "cancelled"]),
  authorityLevel: z.literal("L3_CONFIRMED_ACTION"),
  requiredApprovals: z.array(z.enum(["participant", "authorised_delegate"])),
  informationToShare: z.array(z.string()),
  estimatedCost: z.number().nonnegative().nullable(),
  cancellationTerms: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.string().datetime(),
});

export type CareOSActionProposal = z.infer<typeof careOSActionProposalSchema>;

export const careOSHumanReviewItemSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  participantId: z.string(),
  category: z.enum([
    "care_coordination",
    "transport_continuity",
    "access_evidence",
    "safeguarding",
    "authority_review",
    "financial_review",
    "general_coordination",
  ]),
  priority: z.enum(["information", "attention", "urgent"]),
  title: z.string(),
  summary: z.string(),
  affectedNodeIds: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  status: z.enum(["open", "assigned", "in_progress", "resolved", "cancelled"]),
  assignedRole: z.enum([
    "support_coordinator",
    "provider_coordinator",
    "safeguarding_officer",
    "financial_reviewer",
    "system_administrator",
  ]),
  dueAt: z.string().datetime(),
  participantContactRequired: z.boolean(),
  evidence: z.array(z.string()),
});

export type CareOSHumanReviewItem = z.infer<typeof careOSHumanReviewItemSchema>;

export const careOSNetworkResponseSchema = z.object({
  generatedAt: z.string(),
  requestId: z.string(),
  participantId: z.string(),
  goal: z.string(),
  status: z.enum(["ready", "needs_information", "human_review_required"]),
  agents: z.array(careOSAgentActivationSchema),
  mission: z.object({
    nodes: z.array(careOSMissionNodeSchema),
    edges: z.array(careOSMissionEdgeSchema),
  }),
  continuityAlerts: z.array(careOSContinuityAlertSchema),
  recommendations: z.array(careOSRecommendationSchema),
  actionProposals: z.array(careOSActionProposalSchema),
  humanReviewQueue: z.array(careOSHumanReviewItemSchema),
  notices: z.array(z.string()),
  modelReasoningUsed: z.boolean(),
  writeActionsEnabled: z.boolean(),
  nonAiPath: z.object({
    label: z.string(),
    href: z.string(),
  }),
});

export type CareOSNetworkResponse = z.infer<typeof careOSNetworkResponseSchema>;

export type CareOSModuleReadResult = {
  module: z.infer<typeof mapAbleModuleSchema>;
  status: "available" | "empty" | "not_authorised" | "consent_required" | "disabled" | "unavailable";
  items: unknown[];
};
