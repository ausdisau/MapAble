import {
  searchPredictiveSuggestions,
  type PredictiveSuggestionInput,
} from "@/lib/search/predictive-suggestion-engine";
import {
  getStaticFallbackGroups,
  isSuggestionGroupsEmpty,
} from "@/lib/search/suggestion-fallback-catalog";
import type {
  AutocompleteContext,
  AutocompleteField,
  AutocompleteGroupedResult,
  PredictiveSuggestionResult,
  SuggestionMode,
  SuggestionSignals,
  SuggestionSourceCounts,
} from "@/types/search";
import { AUTOCOMPLETE_MIN_QUERY_LENGTH } from "@/types/search";

export {
  buildLiveRegionMessage,
  flattenSuggestions,
} from "@/lib/search/autocomplete-utils";

export type AutocompleteSearchInput = {
  query: string;
  context: AutocompleteContext;
  field?: AutocompleteField;
  mode?: SuggestionMode;
  signals?: SuggestionSignals;
};

function countSuggestionSources(
  groups: AutocompleteGroupedResult,
): SuggestionSourceCounts {
  return {
    providers: groups.providers.length,
    services: groups.services.length,
    locations: groups.locations.length,
    accessibilityFeatures: groups.accessibilityFeatures.length,
    languages: groups.languages.length,
    popularSearches: groups.popularSearches.length,
  };
}

function shouldServeStaticFallback(input: AutocompleteSearchInput): boolean {
  const mode = input.mode ?? "reactive";
  const q = input.query.trim();
  if (mode === "proactive") return true;
  return q.length >= AUTOCOMPLETE_MIN_QUERY_LENGTH;
}

function withStaticFallbackIfEmpty(
  input: AutocompleteSearchInput,
  result: PredictiveSuggestionResult,
): PredictiveSuggestionResult {
  if (
    !shouldServeStaticFallback(input) ||
    !isSuggestionGroupsEmpty(result.groups)
  ) {
    return result;
  }

  const mode = input.mode ?? "reactive";
  const field = input.field ?? "all";
  const groups = getStaticFallbackGroups(mode, input.query, field);
  const reasons = result.meta.degradedReason
    ? `${result.meta.degradedReason},static_fallback`
    : "static_fallback";

  return {
    groups,
    meta: {
      ...result.meta,
      degraded: true,
      degradedReason: reasons,
      sourceCounts: countSuggestionSources(groups),
    },
  };
}

export async function searchAutocomplete(
  input: AutocompleteSearchInput,
): Promise<AutocompleteGroupedResult> {
  const result = await searchPredictiveSuggestions({
    mode: input.mode ?? "reactive",
    query: input.query,
    context: input.context,
    field: input.field,
    signals: input.signals,
  });
  return result.groups;
}

export async function searchAutocompleteWithMeta(
  input: AutocompleteSearchInput,
): Promise<PredictiveSuggestionResult> {
  const result = await searchPredictiveSuggestions({
    mode: input.mode ?? "reactive",
    query: input.query,
    context: input.context,
    field: input.field,
    signals: input.signals,
  });
  return withStaticFallbackIfEmpty(input, result);
}

export type { PredictiveSuggestionInput };
