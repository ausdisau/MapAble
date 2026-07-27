import { z } from "zod";

export const appointmentMissionRequestSchema = z.object({
  outcome: z.string().trim().min(3).max(3000),
  appointment: z.object({
    title: z.string().trim().min(2).max(240),
    startAt: z.string().datetime(),
    endAt: z.string().datetime().nullable().optional(),
    location: z.string().trim().min(2).max(500),
    accessPlaceId: z.string().nullable().optional(),
  }),
  care: z.object({
    required: z.boolean().default(true),
    supportTypes: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
    communicationPreferences: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
    accessRequirements: z.array(z.string().trim().min(1).max(240)).max(30).default([]),
    highIntensitySupport: z.boolean().default(false),
    backupPreference: z.enum(["same_worker_only", "known_backup", "verified_provider_pool", "participant_selects_each_time", "undecided"]).default("undecided"),
  }),
  transport: z.object({
    required: z.boolean().default(true),
    pickupAddress: z.string().trim().max(500).nullable().optional(),
    returnTripRequired: z.boolean().default(true),
    vehicleRequirements: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  }),
  authority: z.object({
    includeExistingRecords: z.boolean().default(true),
    includeAccessibilityProfile: z.boolean().default(false),
    allowProviderEvidenceRead: z.boolean().default(true),
    allowWorkerEvidenceRead: z.boolean().default(true),
    allowHumanReview: z.boolean().default(true),
  }),
});

export type AppointmentMissionRequest = z.infer<typeof appointmentMissionRequestSchema>;

export const appointmentAuthorityDecisionSchema = z.object({
  participantId: z.string().min(1),
  decision: z.enum(["allow", "deny", "human_review_required"]),
  permittedReads: z.array(z.string()),
  permittedActions: z.array(z.enum(["draft_care_request", "draft_transport_request", "request_human_coordination"])),
  prohibitedActions: z.array(z.string()),
  reasons: z.array(z.string()),
});

export type AppointmentAuthorityDecision = z.infer<typeof appointmentAuthorityDecisionSchema>;

export const appointmentEventSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  participantId: z.string(),
  type: z.enum([
    "mission_created", "authority_evaluated", "support_intelligence_generated",
    "access_evidence_read", "provider_evidence_read", "worker_evidence_read",
    "care_action_prepared", "care_action_confirmed", "transport_action_prepared",
    "transport_action_confirmed", "human_review_created", "continuity_alerted",
    "service_completed", "outcome_recorded",
  ]),
  source: z.enum(["participant", "careos", "care", "transport", "access", "provider", "worker", "human_review"]),
  severity: z.enum(["information", "attention", "urgent"]),
  occurredAt: z.string().datetime(),
  summary: z.string(),
  entityId: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
});

export type AppointmentEvent = z.infer<typeof appointmentEventSchema>;

export type AppointmentOutcomeEvidence = {
  type: string;
  sourceId: string;
  observedAt: string;
  summary?: string;
  correctionOf?: string;
};

export type AppointmentMissionState = {
  missionId: string;
  participantId: string;
  outcome: string;
  phase: "draft" | "awaiting_participant" | "awaiting_human_review" | "coordinating" | "ready" | "completed" | "cancelled";
  authority: AppointmentAuthorityDecision;
  dependencies: Array<{ id: string; label: string; status: "confirmed" | "attention" | "unknown" | "blocked"; evidence: string[] }>;
  pendingConfirmations: Array<"care" | "transport">;
  humanReviewRequired: boolean;
  receipts: Array<{ actionType: string; entityType: string; entityId: string; receiptId: string }>;
  outcomeEvidence: AppointmentOutcomeEvidence[];
  events: AppointmentEvent[];
};
