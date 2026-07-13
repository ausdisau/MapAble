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
