import { z } from "zod";

import type { CurrentUser } from "@/lib/auth/current-user";
import type { MobilityRequirements } from "@/lib/transport/mobility-schema";

export const mapAbleModuleSchema = z.enum([
  "core",
  "care",
  "transport",
  "jobs",
  "access",
  "moves",
  "foods",
  "payments",
]);

export type MapAbleModule = z.infer<typeof mapAbleModuleSchema>;

export const appointmentSummarySchema = z.object({
  id: z.string(),
  eventType: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startAt: z.string(),
  endAt: z.string(),
  timezone: z.string(),
});

export type AppointmentSummary = z.infer<typeof appointmentSummarySchema>;

export const evidenceItemSchema = z.object({
  source: z.enum([
    "participant_profile",
    "calendar",
    "mapable_transport_rules",
    "participant_input",
    "ai_explanation",
  ]),
  label: z.string(),
  confidence: z.number().min(0).max(1),
  details: z.string(),
});

export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const transportOptionSchema = z.object({
  id: z.string(),
  mode: z.enum([
    "wheelchair_accessible_vehicle",
    "community_transport",
    "accessible_public_transport",
    "support_worker_vehicle",
  ]),
  label: z.string(),
  pickupLeadMinutes: z.number().int().min(0),
  accessibilityFeatures: z.array(z.string()),
  rationale: z.string(),
  limitations: z.array(z.string()),
  liveAvailabilityChecked: z.boolean(),
});

export type TransportOption = z.infer<typeof transportOptionSchema>;

export const journeyNarrativeSchema = z.object({
  summary: z.string(),
  reasoning: z.string(),
  uncertainty: z.array(z.string()),
  selectedOptionId: z.string().nullable(),
});

export type JourneyNarrative = z.infer<typeof journeyNarrativeSchema>;

export const journeyPlanSchema = z.object({
  requestId: z.string(),
  status: z.enum([
    "ready_for_confirmation",
    "needs_information",
    "no_safe_option",
  ]),
  appointment: appointmentSummarySchema.nullable(),
  summary: z.string(),
  reasoning: z.string(),
  uncertainty: z.array(z.string()),
  options: z.array(transportOptionSchema),
  selectedOptionId: z.string().nullable(),
  evidence: z.array(evidenceItemSchema),
  approval: z.object({
    required: z.literal(true),
    action: z.literal("create_transport_trip"),
    token: z.string().nullable(),
    expiresAt: z.string().nullable(),
    confirmationText: z.string(),
  }),
  nonAiPath: z.object({
    label: z.string(),
    href: z.string(),
  }),
  toolsCalled: z.array(z.string()),
});

export type JourneyPlan = z.infer<typeof journeyPlanSchema>;

export const journeyPlanRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  appointmentId: z.string().trim().min(1).optional(),
  origin: z.string().trim().min(3).max(500).optional(),
  destination: z.string().trim().min(3).max(500).optional(),
  useAccessibilityProfile: z.boolean().default(false),
  plainLanguage: z.boolean().default(true),
});

export type JourneyPlanRequest = z.infer<typeof journeyPlanRequestSchema>;

export type MapAbleIntelligenceContext = {
  user: CurrentUser;
  appointments: AppointmentSummary[];
  selectedAppointment: AppointmentSummary | null;
  mobilityRequirements: MobilityRequirements;
  accessNotes?: string;
  profileUsed: boolean;
  plainLanguage: boolean;
};

export const transportTripApprovalInputSchema = z.object({
  pickupAddress: z.string().min(3).max(500),
  dropoffAddress: z.string().min(3).max(500),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime().optional(),
  accessNotes: z.string().max(2000).optional(),
  mobilityRequirements: z.record(z.string(), z.unknown()).optional(),
  prefillFromProfile: z.literal(false),
});

export const approvalPayloadSchema = z.object({
  version: z.literal(1),
  action: z.literal("create_transport_trip"),
  requestId: z.string(),
  userId: z.string(),
  optionId: z.string(),
  expiresAt: z.string().datetime(),
  trip: transportTripApprovalInputSchema,
});

export type ApprovalPayload = z.infer<typeof approvalPayloadSchema>;
