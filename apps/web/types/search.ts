export type AutocompleteContext = "homepage" | "provider_finder";

export type AutocompleteSuggestionType =
  | "provider"
  | "service"
  | "location"
  | "accessibility_feature"
  | "language"
  | "popular_search";

export type AutocompleteSuggestion = {
  id: string;
  type: AutocompleteSuggestionType;
  label: string;
  /** Screen reader + visible secondary text */
  description?: string;
  /** Short type label shown beside suggestion (not colour-only) */
  typeLabel: string;
  value: string;
  metadata?: {
    slug?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    providerId?: string;
  };
};

export type AutocompleteField =
  | "all"
  | "provider"
  | "service"
  | "location"
  | "accessibility"
  | "language";

export type AutocompleteGroupedResult = {
  providers: AutocompleteSuggestion[];
  services: AutocompleteSuggestion[];
  locations: AutocompleteSuggestion[];
  accessibilityFeatures: AutocompleteSuggestion[];
  languages: AutocompleteSuggestion[];
  popularSearches: AutocompleteSuggestion[];
};

export const AUTOCOMPLETE_MAX_SUGGESTIONS = 10;
export const AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;

export type SuggestionMode = "proactive" | "reactive";

/** Optional client hints for rules-based ranking (no ML). */
export type SuggestionSignals = {
  recentQueries?: string[];
  preferredState?: string;
};

export type SuggestionSourceCounts = {
  providers: number;
  services: number;
  locations: number;
  accessibilityFeatures: number;
  languages: number;
  popularSearches: number;
};

export type LocationSearchDiagnostics = {
  auspostConfigured: boolean;
  auspostLocationSearch: boolean;
  /** `AUSPOST_PAC_ENABLED` is not explicitly `false`. */
  pacEnabled?: boolean;
  /** `AUSPOST_PAC_API_KEY` key exists in runtime env (value may be empty). */
  pacApiKeyDefined?: boolean;
  /** Trimmed `AUSPOST_PAC_API_KEY` is non-empty. */
  pacApiKeyPresent?: boolean;
  /** Length of trimmed `AUSPOST_PAC_API_KEY` (0 when unset). */
  pacApiKeyLength?: number;
  /** Trimmed `AUSPOST_API_KEY` alias is non-empty. */
  auspostApiKeyAliasPresent?: boolean;
};

export type SuggestionResultMeta = {
  mode: SuggestionMode;
  degraded: boolean;
  degradedReason?: string;
  sourceCounts?: SuggestionSourceCounts;
  /** Present on location-field autocomplete when suburb enrichment may apply. */
  locationDiagnostics?: LocationSearchDiagnostics;
};

export type PredictiveSuggestionResult = {
  groups: AutocompleteGroupedResult;
  meta: SuggestionResultMeta;
};

/** Structured filters extracted from a natural-language provider search query. */
export type NaturalLanguageSearchFilters = {
  q: string;
  location: string;
  access: string;
  service: string;
  provider: string;
};

/** Resolved Provider Finder ACCESS_NEEDS chip ids from NL text. */
export type AccessNeedResolution = {
  ids: string[];
  confidence: number;
  source: "llm_ids" | "keyword" | "llm_step" | "none";
  unmatchedText?: string;
};

/** Server-side interpreter result for provider / homepage search. */
export type SearchInterpretation = {
  sourceQuery: string;
  parsed: boolean;
  configured: boolean;
  filters: NaturalLanguageSearchFilters;
  serviceCategorySlug: string | null;
  serviceCategoryId: string | null;
  accessNeedIds: string[];
  accessNeeds: AccessNeedResolution;
  confidence: number;
  engineId: string;
};

export type SearchInterpretResponse = SearchInterpretation;
