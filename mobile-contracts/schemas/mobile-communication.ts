import { z } from "zod";

export const offlineQueuedActionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "draft_incident",
    "draft_timesheet_note",
    "draft_message",
    "voice_intent_draft",
  ]),
  payload: z.record(z.string(), z.unknown()),
  status: z.enum(["queued", "syncing", "conflict", "failed", "completed"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  idempotencyKey: z.string(),
  conflictReason: z.string().optional(),
});

export type OfflineQueuedActionContract = z.infer<
  typeof offlineQueuedActionSchema
>;

export const communicationPassportSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.string().datetime().nullable().optional(),
});

export type CommunicationPassportSummary = z.infer<
  typeof communicationPassportSummarySchema
>;

export const voiceIntentSchema = z.object({
  type: z.enum([
    "open_mission",
    "check_bookings",
    "report_cancellation",
    "prepare_message",
    "review_options",
  ]),
  consequence: z.enum(["read_only", "consequential"]),
  parameters: z.record(z.string(), z.string()),
  rawTranscript: z.string(),
  confidence: z.number().min(0).max(1),
  parsedAt: z.string().datetime(),
});

export type VoiceIntentContract = z.infer<typeof voiceIntentSchema>;

export const pushPreferenceSchema = z.object({
  channel: z.enum([
    "booking_reminder",
    "mission_update",
    "message",
    "sync_complete",
  ]),
  enabled: z.boolean(),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
});

export type PushPreferenceContract = z.infer<typeof pushPreferenceSchema>;
