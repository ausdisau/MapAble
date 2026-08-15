import { z } from "zod";

import { INTELLIGENCE_SESSION_CONSENT_SCOPES } from "./consent/session-consent";
import { mapAbleModuleSchema } from "./types";

export const platformBriefRequestSchema = z.object({
  modules: z.array(mapAbleModuleSchema).min(1).max(8).default([
    "core",
    "care",
    "transport",
    "jobs",
    "access",
    "payments",
  ]),
  includeAccessibilityProfile: z.boolean().default(false),
  consentScopes: z.array(z.enum(INTELLIGENCE_SESSION_CONSENT_SCOPES)).default([]),
  plainLanguage: z.boolean().default(true),
});

export type PlatformBriefRequest = z.infer<typeof platformBriefRequestSchema>;

export const platformModuleBriefSchema = z.object({
  module: mapAbleModuleSchema,
  status: z.enum(["available", "disabled", "not_authorised", "consent_required", "unavailable"]),
  summary: z.string(),
  itemCount: z.number().int().min(0),
  highlights: z.array(z.string()),
  evidence: z.array(z.object({
    label: z.string(),
    source: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  nonAiPath: z.string(),
});

export type PlatformModuleBrief = z.infer<typeof platformModuleBriefSchema>;

export const platformBriefSchema = z.object({
  generatedAt: z.string().datetime(),
  participantId: z.string(),
  modules: z.array(platformModuleBriefSchema),
  notices: z.array(z.string()),
  modelReasoningUsed: z.boolean(),
  writeActionsEnabled: z.boolean(),
  nonAiPath: z.object({ label: z.string(), href: z.string() }),
});

export type PlatformBrief = z.infer<typeof platformBriefSchema>;
