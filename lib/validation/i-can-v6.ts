import { z } from "zod";

/** ICF-aligned I-CAN v6 domain identifiers. */
export const ICAN_V6_DOMAIN_IDS = [
  "communication",
  "mobility",
  "self_care",
  "domestic_life",
  "interpersonal_interactions",
  "learning_and_applying_knowledge",
  "general_tasks_and_demands",
  "education",
  "community_social_civic_life",
  "work_and_employment",
  "economic_life",
  "looking_after_ones_health",
] as const;

export const iCanV6DomainIdSchema = z.enum(ICAN_V6_DOMAIN_IDS);
export type ICanV6DomainId = z.infer<typeof iCanV6DomainIdSchema>;

export const iCanV6SupportNeedLevelSchema = z.enum([
  "none",
  "intermittent",
  "limited",
  "extensive",
  "pervasive",
]);
export type ICanV6SupportNeedLevel = z.infer<
  typeof iCanV6SupportNeedLevelSchema
>;

export const iCanV6FrequencySchema = z.enum([
  "never",
  "occasionally",
  "regularly",
  "daily",
  "constantly",
]);
export type ICanV6Frequency = z.infer<typeof iCanV6FrequencySchema>;

function sanitizeNotes(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

export const iCanV6DomainEntrySchema = z.object({
  supportNeedLevel: iCanV6SupportNeedLevelSchema,
  frequency: iCanV6FrequencySchema.optional(),
  notes: z
    .string()
    .max(2000)
    .transform(sanitizeNotes)
    .pipe(z.string().max(2000)),
  completed: z.boolean(),
});

export type ICanV6DomainEntry = z.infer<typeof iCanV6DomainEntrySchema>;

export const iCanV6DomainsSchema = z.object({
  communication: iCanV6DomainEntrySchema,
  mobility: iCanV6DomainEntrySchema,
  self_care: iCanV6DomainEntrySchema,
  domestic_life: iCanV6DomainEntrySchema,
  interpersonal_interactions: iCanV6DomainEntrySchema,
  learning_and_applying_knowledge: iCanV6DomainEntrySchema,
  general_tasks_and_demands: iCanV6DomainEntrySchema,
  education: iCanV6DomainEntrySchema,
  community_social_civic_life: iCanV6DomainEntrySchema,
  work_and_employment: iCanV6DomainEntrySchema,
  economic_life: iCanV6DomainEntrySchema,
  looking_after_ones_health: iCanV6DomainEntrySchema,
});

/** Mid-wizard draft — domains may be incomplete. */
export const ICanV6IntakeDraftSchema = z.object({
  domains: iCanV6DomainsSchema.partial().passthrough().optional(),
  consentDraftProcessing: z.boolean().optional(),
  consentNoClinicalPaste: z.boolean().optional(),
  clientSessionId: z.string().min(1).max(100).optional(),
});

/**
 * Full submission schema — all 12 domains required and consents must be true.
 */
export const ICanV6IntakeSchema = z
  .object({
    domains: iCanV6DomainsSchema,
    consentDraftProcessing: z.literal(true),
    consentNoClinicalPaste: z.literal(true),
    clientSessionId: z.string().min(1).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    for (const id of ICAN_V6_DOMAIN_IDS) {
      const entry = data.domains[id];
      if (!entry.completed) {
        ctx.addIssue({
          code: "custom",
          path: ["domains", id, "completed"],
          message: `Domain ${id} must be completed before submission`,
        });
      }
      if (entry.completed && entry.frequency === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["domains", id, "frequency"],
          message: `Domain ${id} requires a frequency when completed`,
        });
      }
    }
  });

export type ICanV6Intake = z.infer<typeof ICanV6IntakeSchema>;
export type ICanV6IntakeDraft = z.infer<typeof ICanV6IntakeDraftSchema>;

export function createEmptyDomainEntry(): ICanV6DomainEntry {
  return {
    supportNeedLevel: "none",
    notes: "",
    completed: false,
  };
}

export function createEmptyDomains(): Record<
  ICanV6DomainId,
  ICanV6DomainEntry
> {
  return {
    communication: createEmptyDomainEntry(),
    mobility: createEmptyDomainEntry(),
    self_care: createEmptyDomainEntry(),
    domestic_life: createEmptyDomainEntry(),
    interpersonal_interactions: createEmptyDomainEntry(),
    learning_and_applying_knowledge: createEmptyDomainEntry(),
    general_tasks_and_demands: createEmptyDomainEntry(),
    education: createEmptyDomainEntry(),
    community_social_civic_life: createEmptyDomainEntry(),
    work_and_employment: createEmptyDomainEntry(),
    economic_life: createEmptyDomainEntry(),
    looking_after_ones_health: createEmptyDomainEntry(),
  };
}
