import { z } from "zod";

import {
  AUTOCOMPLETE_MAX_SUGGESTIONS,
  AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from "@/types/search";

const fieldSchema = z
  .enum(["all", "provider", "service", "location", "accessibility", "language"])
  .optional()
  .default("all");

const signalsSchema = z
  .object({
    recentQueries: z.array(z.string().trim().max(120)).max(10).optional(),
    preferredState: z.string().trim().max(8).optional(),
  })
  .optional();

export const autocompleteQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional().default(""),
    context: z.enum(["homepage", "provider_finder"]),
    field: fieldSchema,
    mode: z.enum(["proactive", "reactive"]).optional().default("reactive"),
    signals: signalsSchema,
  })
  .superRefine((data, ctx) => {
    const q = data.q ?? "";
    if (data.mode === "reactive" && q.length < AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Query must be at least ${AUTOCOMPLETE_MIN_QUERY_LENGTH} characters for reactive mode`,
        path: ["q"],
      });
    }
  });

export type AutocompleteQueryParams = z.infer<typeof autocompleteQuerySchema>;

export { AUTOCOMPLETE_MAX_SUGGESTIONS, AUTOCOMPLETE_MIN_QUERY_LENGTH };
