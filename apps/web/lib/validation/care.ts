import { z } from "zod";

export const careRequestTypeSchema = z.enum([
  "personal_care",
  "domestic_assistance",
  "community_access",
  "appointment_support",
  "employment_support",
  "meal_preparation",
  "therapy_assistance",
  "skill_building",
  "overnight_support",
  "other",
]);

export const createCareRequestSchema = z.object({
  requestType: careRequestTypeSchema,
  title: z.string().min(3).max(200),
  description: z.string().min(1).max(5000),
  preferredDate: z.string().datetime().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  accessRequirementsSummary: z.string().optional(),
  linkedTransportRequired: z.boolean().optional(),
  shareAccessibility: z.boolean().optional(),
  shareAccessibilityConfirmed: z.boolean().optional(),
  fundingSourceId: z.string().optional(),
  tasks: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const createCareShiftSchema = z.object({
  careRequestId: z.string(),
  organisationId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().optional(),
  workerProfileId: z.string().optional(),
});

export const assignCareProviderSchema = z.object({
  organisationId: z.string(),
});

export const careTaskSchema = z.object({
  name: z.string().optional(),
  intensity: z.enum(["standard", "high"]).optional(),
});

export const assignCareWorkerSchema = z.object({
  workerProfileId: z.string(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
});

export const createCareServiceLogSchema = z.object({
  careShiftId: z.string(),
  supportsDelivered: z.array(z.record(z.string(), z.unknown())).optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
});

export const disputeCareServiceLogSchema = z.object({
  disputeReason: z.string().min(3).max(2000),
});

export const createCareIncidentSchema = z.object({
  category: z.enum([
    "late_or_no_show",
    "access_need_not_met",
    "unsafe_transport",
    "unsafe_care",
    "injury_or_health_event",
    "privacy_concern",
    "worker_conduct",
    "driver_conduct",
    "property_damage",
    "complaint",
    "safeguarding_concern",
    "possible_reportable_incident",
    "other",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().min(3).max(200),
  description: z.string().min(3).max(5000),
  careShiftId: z.string().optional(),
  immediateRiskPresent: z.boolean().optional(),
  safeguardingConcern: z.boolean().optional(),
});
