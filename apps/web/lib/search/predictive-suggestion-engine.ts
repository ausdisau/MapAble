import { listProactiveLocations } from "@/lib/search/local-location-adapter";
import { searchLocations } from "@/lib/search/location-autocomplete-adapter";
import {
  listProactiveProviders,
  searchProviders,
} from "@/lib/search/provider-autocomplete";
import {
  listProactiveAccessibility,
  listProactiveCatalog,
  listProactiveLanguages,
  searchAccessibilityFeatures,
  searchLanguages,
  searchPopularSearches,
  searchServiceCategories,
} from "@/lib/search/service-autocomplete";
import {
  getStaticProactiveCatalog,
  getStaticReactiveSuggestions,
} from "@/lib/search/suggestion-fallback-catalog";
import {
  rankSuggestions,
  stripRanking,
  type RankedSuggestion,
} from "@/lib/search/suggestion-ranking";
import {
  AUTOCOMPLETE_MAX_SUGGESTIONS,
  AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from "@/types/search";
import type {
  AutocompleteContext,
  AutocompleteField,
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
  PredictiveSuggestionResult,
  SuggestionMode,
  SuggestionSignals,
  SuggestionSourceCounts,
} from "@/types/search";

export type PredictiveSuggestionInput = {
  mode: SuggestionMode;
  query: string;
  context: AutocompleteContext;
  field?: AutocompleteField;
  signals?: SuggestionSignals;
};

const emptyGroups = (): AutocompleteGroupedResult => ({
  providers: [],
  services: [],
  locations: [],
  accessibilityFeatures: [],
  languages: [],
  popularSearches: [],
});

function perGroupLimit(
  field: AutocompleteField,
  context: AutocompleteContext,
  mode: SuggestionMode,
): number {
  if (mode === "proactive") {
    return field === "all" ? 6 : AUTOCOMPLETE_MAX_SUGGESTIONS;
  }
  if (field !== "all") return AUTOCOMPLETE_MAX_SUGGESTIONS;
  return context === "provider_finder" ? 4 : 3;
}

function shouldInclude(
  field: AutocompleteField,
  target: AutocompleteField,
): boolean {
  return field === "all" || field === target;
}

function countSources(groups: AutocompleteGroupedResult): SuggestionSourceCounts {
  return {
    providers: groups.providers.length,
    services: groups.services.length,
    locations: groups.locations.length,
    accessibilityFeatures: groups.accessibilityFeatures.length,
    languages: groups.languages.length,
    popularSearches: groups.popularSearches.length,
  };
}

function splitIntoGroups(
  ranked: RankedSuggestion[],
  max: number,
): AutocompleteGroupedResult {
  const flat = stripRanking(ranked).slice(0, max);
  const take = (type: AutocompleteSuggestion["type"]) =>
    flat.filter((s) => s.type === type);

  return {
    providers: take("provider"),
    services: take("service"),
    locations: take("location"),
    accessibilityFeatures: take("accessibility_feature"),
    languages: take("language"),
    popularSearches: take("popular_search"),
  };
}

function applyContextCaps(
  groups: AutocompleteGroupedResult,
  context: AutocompleteContext,
  field: AutocompleteField,
  mode: SuggestionMode,
): AutocompleteGroupedResult {
  if (mode === "proactive" || field !== "all") {
    return trimTotal(groups, AUTOCOMPLETE_MAX_SUGGESTIONS);
  }

  if (context === "provider_finder") {
    return trimTotal(
      {
        providers: groups.providers.slice(0, 3),
        services: groups.services.slice(0, 3),
        locations: groups.locations.slice(0, 2),
        accessibilityFeatures: groups.accessibilityFeatures.slice(0, 2),
        languages: groups.languages.slice(0, 1),
        popularSearches: [],
      },
      AUTOCOMPLETE_MAX_SUGGESTIONS,
    );
  }

  return trimTotal(groups, AUTOCOMPLETE_MAX_SUGGESTIONS);
}

function trimTotal(
  groups: AutocompleteGroupedResult,
  max: number,
): AutocompleteGroupedResult {
  const order: AutocompleteSuggestion[] = [
    ...groups.providers,
    ...groups.services,
    ...groups.locations,
    ...groups.accessibilityFeatures,
    ...groups.languages,
    ...groups.popularSearches,
  ].slice(0, max);

  const ids = new Set(order.map((s) => s.id));
  const pick = (items: AutocompleteSuggestion[]) =>
    items.filter((i) => ids.has(i.id));

  return {
    providers: pick(groups.providers),
    services: pick(groups.services),
    locations: pick(groups.locations),
    accessibilityFeatures: pick(groups.accessibilityFeatures),
    languages: pick(groups.languages),
    popularSearches: pick(groups.popularSearches),
  };
}

type AdapterOutcome = {
  suggestions: AutocompleteSuggestion[];
  failed: boolean;
};

async function safeAdapter(
  label: string,
  fn: () => Promise<AutocompleteSuggestion[]>,
): Promise<AdapterOutcome> {
  try {
    return { suggestions: await fn(), failed: false };
  } catch (err) {
    console.error(`[predictive-suggestions] ${label} adapter failed`, err);
    return { suggestions: [], failed: true };
  }
}

export async function searchPredictiveSuggestions(
  input: PredictiveSuggestionInput,
): Promise<PredictiveSuggestionResult> {
  const { mode, query, context, field = "all", signals } = input;
  const limit = perGroupLimit(field, context, mode);
  const q = query.trim();

  if (mode === "reactive" && q.length < AUTOCOMPLETE_MIN_QUERY_LENGTH) {
    return {
      groups: emptyGroups(),
      meta: { mode, degraded: false, sourceCounts: countSources(emptyGroups()) },
    };
  }

  let degraded = false;
  const degradedReasons: string[] = [];

  if (mode === "proactive") {
    let proactivePool: AutocompleteSuggestion[] = [];
    let popularWeights: [string, number][] = [];

    if (field === "provider") {
      const out = await safeAdapter("proactive-providers", () =>
        listProactiveProviders(limit),
      );
      proactivePool = out.suggestions;
      if (out.failed) degraded = true;
    } else if (field === "location") {
      const out = await safeAdapter("proactive-locations", () =>
        listProactiveLocations(limit),
      );
      proactivePool = out.suggestions;
      if (out.failed) degraded = true;
    } else if (field === "accessibility") {
      const out = await safeAdapter("proactive-accessibility", () =>
        listProactiveAccessibility(limit),
      );
      proactivePool = out.suggestions;
      if (out.failed) degraded = true;
    } else if (field === "language") {
      const out = await safeAdapter("proactive-languages", () =>
        listProactiveLanguages(limit),
      );
      proactivePool = out.suggestions;
      if (out.failed) degraded = true;
    } else {
      const catalog = await listProactiveCatalog(
        context,
        AUTOCOMPLETE_MAX_SUGGESTIONS,
      );
      if (catalog.failed) {
        degraded = true;
        degradedReasons.push("catalog_unavailable");
      }
      if (catalog.usedFallback) {
        degraded = true;
        degradedReasons.push("static_fallback");
      }
      proactivePool = catalog.suggestions;
      popularWeights = catalog.popularWeights;
    }

    if (proactivePool.length === 0) {
      const fallback = getStaticProactiveCatalog(AUTOCOMPLETE_MAX_SUGGESTIONS);
      proactivePool = fallback.suggestions;
      popularWeights = fallback.popularWeights;
      degraded = true;
      degradedReasons.push("static_fallback");
    }

    const filteredCatalog = proactivePool.filter((s) => {
      if (field === "all") return true;
      if (field === "provider") return s.type === "provider";
      if (field === "service") return s.type === "service" || s.type === "popular_search";
      if (field === "location") return s.type === "location";
      if (field === "accessibility") return s.type === "accessibility_feature";
      if (field === "language") return s.type === "language";
      return true;
    });

    const popularWeightMap = new Map(
      popularWeights.map(([k, v]) => [k, v]),
    );
    const ranked = rankSuggestions({
      suggestions: filteredCatalog,
      query: q,
      mode: "proactive",
      signals,
      popularWeights: popularWeightMap,
    });

    const groups = applyContextCaps(
      splitIntoGroups(ranked, AUTOCOMPLETE_MAX_SUGGESTIONS),
      context,
      field,
      mode,
    );

    return {
      groups,
      meta: {
        mode,
        degraded,
        degradedReason: degradedReasons.join(",") || undefined,
        sourceCounts: countSources(groups),
      },
    };
  }

  const [
    providersOut,
    servicesOut,
    locationsOut,
    accessOut,
    languagesOut,
    popularOut,
  ] = await Promise.all([
    shouldInclude(field, "provider")
      ? safeAdapter("providers", () => searchProviders(q, limit))
      : Promise.resolve({ suggestions: [], failed: false }),
    shouldInclude(field, "service")
      ? safeAdapter("services", () => searchServiceCategories(q, limit))
      : Promise.resolve({ suggestions: [], failed: false }),
    shouldInclude(field, "location")
      ? safeAdapter("locations", () => searchLocations(q, limit))
      : Promise.resolve({ suggestions: [], failed: false }),
    shouldInclude(field, "accessibility")
      ? safeAdapter("accessibility", () => searchAccessibilityFeatures(q, limit))
      : Promise.resolve({ suggestions: [], failed: false }),
    shouldInclude(field, "language")
      ? safeAdapter("languages", () => searchLanguages(q, limit))
      : Promise.resolve({ suggestions: [], failed: false }),
    field === "all"
      ? safeAdapter("popular", () =>
          searchPopularSearches(q, context, context === "homepage" ? 3 : 2),
        )
      : Promise.resolve({ suggestions: [], failed: false }),
  ]);

  for (const out of [
    providersOut,
    servicesOut,
    locationsOut,
    accessOut,
    languagesOut,
    popularOut,
  ]) {
    if (out.failed) degraded = true;
  }
  if (degraded) degradedReasons.push("partial_adapter_failure");

  const popularWeights = new Map(
    popularOut.suggestions.map((s) => [s.value.toLowerCase(), 10]),
  );

  let pool: AutocompleteSuggestion[] = [
    ...providersOut.suggestions,
    ...servicesOut.suggestions,
    ...locationsOut.suggestions,
    ...accessOut.suggestions,
    ...languagesOut.suggestions,
    ...popularOut.suggestions,
  ];

  if (pool.length === 0) {
    pool = getStaticReactiveSuggestions(q, limit, field);
    degraded = true;
    degradedReasons.push("static_fallback");
  }

  const ranked = rankSuggestions({
    suggestions: pool,
    query: q,
    mode: "reactive",
    signals,
    popularWeights,
  });

  const groups = applyContextCaps(
    splitIntoGroups(ranked, AUTOCOMPLETE_MAX_SUGGESTIONS),
    context,
    field,
    mode,
  );

  return {
    groups,
    meta: {
      mode,
      degraded,
      degradedReason: degradedReasons.join(",") || undefined,
      sourceCounts: countSources(groups),
    },
  };
}
