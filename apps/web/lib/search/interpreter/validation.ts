import { z } from "zod";

import type { AutocompleteContext } from "@/types/search";

export const naturalLanguageFiltersSchema = z.object({
  q: z.string(),
  location: z.string(),
  access: z.string(),
  service: z.string(),
  provider: z.string(),
  serviceCategorySlug: z.string().optional(),
  accessNeedIds: z.array(z.string()).max(5).optional(),
});

export type ParsedNlFilters = z.infer<typeof naturalLanguageFiltersSchema>;

export const searchInterpretRequestSchema = z.object({
  query: z.string().min(1).max(500),
  context: z.enum(["homepage", "provider_finder"]).optional(),
});

export type SearchInterpretRequest = z.infer<typeof searchInterpretRequestSchema>;

export function normalizeNlFilters(raw: ParsedNlFilters) {
  const accessNeedIds = (raw.accessNeedIds ?? [])
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 5);
  return {
    q: raw.q.trim(),
    location: raw.location.trim(),
    access: raw.access.trim(),
    service: raw.service.trim(),
    provider: raw.provider.trim(),
    serviceCategorySlug: raw.serviceCategorySlug?.trim() || undefined,
    accessNeedIds: accessNeedIds.length > 0 ? accessNeedIds : undefined,
  };
}

export function passthroughFilters(query: string) {
  const trimmed = query.trim();
  return {
    q: trimmed,
    location: "",
    access: "",
    service: "",
    provider: "",
    serviceCategorySlug: undefined as string | undefined,
    accessNeedIds: undefined as string[] | undefined,
  };
}

export function looksLikeNaturalLanguage(query: string): boolean {
  const q = query.trim();
  if (q.length < 5) return false;
  const wordCount = q.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 3) return true;
  return /\b(near|with|in|for|accessible|transport|worker|support|ndis|therapy|physio)\b/i.test(
    q,
  );
}

export type AutocompleteContextInput = AutocompleteContext | undefined;
