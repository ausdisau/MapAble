import { keywordsMatchQuery, textMatchesQuery } from "@/lib/search/matches-query";
import type {
  AutocompleteField,
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
} from "@/types/search";
import { AUTOCOMPLETE_MAX_SUGGESTIONS } from "@/types/search";

/** In-memory catalog when DB search tables are empty (e.g. production before seed). */

const SERVICE_CATEGORIES = [
  { slug: "personal-care", name: "Personal care", keywords: ["personal", "care", "daily"] },
  {
    slug: "accessible-transport",
    name: "Accessible transport",
    keywords: ["transport", "wheelchair", "taxi"],
  },
  {
    slug: "occupational-therapy",
    name: "Occupational therapy",
    keywords: ["ot", "occupational"],
  },
  { slug: "physiotherapy", name: "Physiotherapy", keywords: ["physio", "physical"] },
  {
    slug: "support-coordination",
    name: "Support coordination",
    keywords: ["coordination", "sc"],
  },
] as const;

const ACCESSIBILITY = [
  {
    slug: "wheelchair-accessible",
    label: "Wheelchair accessible",
    keywords: ["wheelchair", "access"],
  },
  { slug: "hoist-trained", label: "Hoist trained", keywords: ["hoist", "transfer"] },
  { slug: "auslan", label: "Auslan", keywords: ["auslan", "deaf"] },
  { slug: "low-sensory", label: "Low sensory", keywords: ["sensory", "quiet"] },
] as const;

const LOCATIONS = [
  { displayName: "Sydney NSW", suburb: "Sydney", state: "NSW", postcode: undefined },
  {
    displayName: "Parramatta NSW",
    suburb: "Parramatta",
    state: "NSW",
    postcode: "2150",
  },
  { displayName: "Newcastle NSW", suburb: "Newcastle", state: "NSW", postcode: undefined },
  { displayName: "Wollongong NSW", suburb: "Wollongong", state: "NSW", postcode: undefined },
] as const;

const POPULAR = [
  "Support worker near St Ives",
  "Wheelchair accessible transport tomorrow",
  "OT assessment with NDIS registration",
  "Low sensory community access support",
  "Employment support with transport",
  "personal care",
  "accessible transport",
  "occupational therapy",
  "physiotherapy",
  "support coordination",
  "wheelchair accessible",
  "hoist trained",
  "Auslan",
  "low sensory",
] as const;

const LANGUAGES = [{ slug: "auslan", label: "Auslan", keywords: ["auslan", "sign"] }] as const;

const DEMO_PROVIDERS = [
  {
    slug: "mapable-demo-provider",
    name: "MapAble Demo Provider",
    suburb: "Parramatta",
    state: "NSW",
    isVerified: true,
  },
] as const;

function filterRows<T>(
  rows: readonly T[],
  query: string,
  getText: (row: T) => string,
  getKeywords: (row: T) => string[],
  limit: number,
): T[] {
  const q = query.trim();
  if (q.length < 2) return rows.slice(0, limit);
  return rows
    .filter(
      (row) =>
        textMatchesQuery(getText(row), q) || keywordsMatchQuery(getKeywords(row), q),
    )
    .slice(0, limit);
}

export function getStaticProactiveCatalog(limit: number): {
  suggestions: AutocompleteSuggestion[];
  popularWeights: [string, number][];
} {
  const popular: AutocompleteSuggestion[] = POPULAR.slice(0, 8).map((query, i) => ({
    id: `static-popular-${i}`,
    type: "popular_search",
    typeLabel: "Popular",
    label: query,
    value: query,
  }));

  const services: AutocompleteSuggestion[] = SERVICE_CATEGORIES.map((row) => ({
    id: `static-service-${row.slug}`,
    type: "service",
    typeLabel: "Service",
    label: row.name,
    value: row.name,
  }));

  const locations: AutocompleteSuggestion[] = LOCATIONS.map((row, i) => ({
    id: `static-location-${i}`,
    type: "location",
    typeLabel: "Location",
    label: row.displayName,
    description: [row.suburb, row.state, row.postcode].filter(Boolean).join(", "),
    value: row.displayName,
    metadata: {
      suburb: row.suburb,
      state: row.state,
      postcode: row.postcode,
    },
  }));

  const popularWeights: [string, number][] = POPULAR.map((query, i) => [
    query.toLowerCase(),
    POPULAR.length - i,
  ]);

  return {
    suggestions: [...popular, ...services, ...locations].slice(0, limit),
    popularWeights,
  };
}

export function getStaticReactiveSuggestions(
  query: string,
  limit: number,
  field: "all" | "provider" | "service" | "location" | "accessibility" | "language",
): AutocompleteSuggestion[] {
  const q = query.trim();
  if (q.length < 2) return [];

  const out: AutocompleteSuggestion[] = [];

  if (field === "all" || field === "provider") {
    for (const row of filterRows(
      DEMO_PROVIDERS,
      q,
      (r) => r.name,
      () => [],
      limit,
    )) {
      out.push({
        id: `static-provider-${row.slug}`,
        type: "provider",
        typeLabel: row.isVerified ? "Provider" : "Provider (unverified)",
        label: row.name,
        description: [row.suburb, row.state].filter(Boolean).join(", "),
        value: row.name,
        metadata: { slug: row.slug, suburb: row.suburb, state: row.state },
      });
    }
  }

  if (field === "all" || field === "service") {
    for (const row of filterRows(
      SERVICE_CATEGORIES,
      q,
      (r) => r.name,
      (r) => [...r.keywords],
      limit,
    )) {
      out.push({
        id: `static-service-${row.slug}`,
        type: "service",
        typeLabel: "Service",
        label: row.name,
        value: row.name,
      });
    }
  }

  if (field === "all" || field === "location") {
    for (const [i, row] of filterRows(
      LOCATIONS,
      q,
      (r) => r.displayName,
      () => [],
      limit,
    ).entries()) {
      out.push({
        id: `static-location-${i}`,
        type: "location",
        typeLabel: "Location",
        label: row.displayName,
        description: [row.suburb, row.state, row.postcode].filter(Boolean).join(", "),
        value: row.displayName,
        metadata: {
          suburb: row.suburb,
          state: row.state,
          postcode: row.postcode,
        },
      });
    }
  }

  if (field === "all" || field === "accessibility") {
    for (const row of filterRows(
      ACCESSIBILITY,
      q,
      (r) => r.label,
      (r) => [...r.keywords],
      limit,
    )) {
      out.push({
        id: `static-access-${row.slug}`,
        type: "accessibility_feature",
        typeLabel: "Access",
        label: row.label,
        value: row.label,
      });
    }
  }

  if (field === "all" || field === "language") {
    for (const row of filterRows(
      LANGUAGES,
      q,
      (r) => r.label,
      (r) => [...r.keywords],
      limit,
    )) {
      out.push({
        id: `static-language-${row.slug}`,
        type: "language",
        typeLabel: "Language",
        label: row.label,
        value: row.label,
      });
    }
  }

  if (field === "all") {
    for (const [i, queryText] of filterRows(
      POPULAR.map((p) => ({ text: p })),
      q,
      (r) => r.text,
      () => [],
      limit,
    ).entries()) {
      out.push({
        id: `static-popular-reactive-${i}`,
        type: "popular_search",
        typeLabel: "Popular",
        label: queryText.text,
        value: queryText.text,
      });
    }
  }

  return out.slice(0, limit * 3);
}

export function groupStaticSuggestions(
  suggestions: AutocompleteSuggestion[],
): AutocompleteGroupedResult {
  const take = (type: AutocompleteSuggestion["type"]) =>
    suggestions.filter((s) => s.type === type);

  return {
    providers: take("provider"),
    services: take("service"),
    locations: take("location"),
    accessibilityFeatures: take("accessibility_feature"),
    languages: take("language"),
    popularSearches: take("popular_search"),
  };
}

export function isSuggestionGroupsEmpty(groups: AutocompleteGroupedResult): boolean {
  return (
    groups.providers.length === 0 &&
    groups.services.length === 0 &&
    groups.locations.length === 0 &&
    groups.accessibilityFeatures.length === 0 &&
    groups.languages.length === 0 &&
    groups.popularSearches.length === 0
  );
}

/** Last-resort grouped suggestions when DB and engine return nothing. */
export function getStaticFallbackGroups(
  mode: "proactive" | "reactive",
  query: string,
  field: AutocompleteField = "all",
  limit = AUTOCOMPLETE_MAX_SUGGESTIONS,
): AutocompleteGroupedResult {
  if (mode === "proactive") {
    return groupStaticSuggestions(getStaticProactiveCatalog(limit).suggestions);
  }
  return groupStaticSuggestions(
    getStaticReactiveSuggestions(query, limit, field),
  );
}
