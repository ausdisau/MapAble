import { z } from "zod";

export const lifeTwinPreferencesSchema = z.object({
  communication: z.array(z.string()).default([]),
  accessibility: z.array(z.string()).default([]),
  mobilityEquipment: z.array(z.string()).default([]),
  support: z.array(z.string()).default([]),
  worker: z.array(z.string()).default([]),
  culturalAndLanguage: z.array(z.string()).default([]),
  routines: z.array(z.string()).default([]),
  meaningfulGoals: z.array(z.string()).default([]),
  trustedCircle: z.array(z.string()).default([]),
  delegatedAuthorities: z.array(z.string()).default([]),
  contingency: z.array(z.string()).default([]),
  rememberedCareOSPreferences: z.array(z.string()).default([]),
});

export type LifeTwinPreferences = z.infer<typeof lifeTwinPreferencesSchema>;

export const lifeTwinDomainSchema = z.enum([
  "identity_communication",
  "accessibility",
  "daily_routines",
  "goals_participation",
  "support_relationships",
  "appointments_commitments",
  "transport",
  "equipment",
  "home_environment",
  "delegated_authority",
  "safety_escalation",
  "funding_invoices",
  "community_participation",
]);

export const lifeTwinDomainRecordSchema = z.object({
  recordId: z.string().optional(),
  domain: lifeTwinDomainSchema,
  value: z.record(z.string(), z.unknown()),
  source: z.enum([
    "participant",
    "authorised_delegate",
    "verified_record",
    "provider",
    "community",
    "inference",
  ]),
  verificationStatus: z.enum([
    "participant_confirmed",
    "professionally_verified",
    "unverified",
    "disputed",
  ]),
  consentScopes: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

export type LifeTwinDomainRecordInput = z.infer<
  typeof lifeTwinDomainRecordSchema
>;
