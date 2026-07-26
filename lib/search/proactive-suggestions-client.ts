import { HERO_SUGGESTED_SEARCHES_FALLBACK } from "@/lib/provider/finder/filters";
import { flattenSuggestions } from "@/lib/search/autocomplete-utils";
import type {
  AutocompleteContext,
  AutocompleteGroupedResult,
  SuggestionResultMeta,
  SuggestionSignals,
} from "@/types/search";


export type ProactiveSuggestionsResponse = {
  groups: AutocompleteGroupedResult;
  meta?: SuggestionResultMeta;
};

export async function fetchProactiveSuggestions(
  context: AutocompleteContext,
  options?: {
    field?: string;
    signals?: SuggestionSignals;
    signal?: AbortSignal;
  },
): Promise<ProactiveSuggestionsResponse> {
  const params = new URLSearchParams({
    context,
    mode: "proactive",
    field: options?.field ?? "all",
  });
  if (options?.signals) {
    params.set("signals", JSON.stringify(options.signals));
  }

  const res = await fetch(`/api/search/autocomplete?${params.toString()}`, {
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Proactive suggestions failed: ${res.status}`);
  }

  return (await res.json()) as ProactiveSuggestionsResponse;
}

/** Chip labels from proactive API; falls back to static hero list. */
export async function fetchProactiveChipLabels(
  context: AutocompleteContext,
  limit = 5,
): Promise<string[]> {
  try {
    const { groups } = await fetchProactiveSuggestions(context);
    const flat = flattenSuggestions(groups);
    const labels = flat
      .filter((s) => s.type === "popular_search" || s.type === "service")
      .map((s) => s.label)
      .slice(0, limit);

    if (labels.length > 0) return labels;
  } catch {
    // fall through
  }

  return [...HERO_SUGGESTED_SEARCHES_FALLBACK].slice(0, limit);
}
