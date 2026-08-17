import { keywordsMatchQuery, textMatchesQuery } from "@/lib/search/matches-query";
import type { AutocompleteSuggestion, SuggestionSignals } from "@/types/search";

export type MatchTier = "prefix" | "substring" | "keyword" | "proactive" | "none";

export type RankedSuggestion = AutocompleteSuggestion & {
  score: number;
  matchTier: MatchTier;
};

const TIER_SCORE: Record<MatchTier, number> = {
  prefix: 100,
  substring: 60,
  keyword: 40,
  proactive: 30,
  none: 0,
};

function matchTierForSuggestion(
  suggestion: AutocompleteSuggestion,
  query: string,
  keywords: string[] = [],
): MatchTier {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return "proactive";

  const label = suggestion.label.toLowerCase();
  if (label.startsWith(q)) return "prefix";
  if (textMatchesQuery(suggestion.label, q)) return "substring";
  if (keywordsMatchQuery(keywords, q)) return "keyword";
  if (suggestion.description && textMatchesQuery(suggestion.description, q)) {
    return "substring";
  }
  if (
    suggestion.metadata?.suburb &&
    textMatchesQuery(suggestion.metadata.suburb, q)
  ) {
    return "substring";
  }
  if (
    suggestion.metadata?.state &&
    textMatchesQuery(suggestion.metadata.state, q)
  ) {
    return "substring";
  }
  return "none";
}

function verifiedBoost(suggestion: AutocompleteSuggestion): number {
  if (suggestion.type !== "provider") return 0;
  return suggestion.typeLabel.includes("unverified") ? 0 : 15;
}

function popularWeightBoost(weight: number | undefined): number {
  if (weight == null) return 0;
  return Math.min(weight, 20);
}

function recentQueryBoost(
  suggestion: AutocompleteSuggestion,
  signals?: SuggestionSignals,
): number {
  const recent = signals?.recentQueries ?? [];
  const value = suggestion.value.toLowerCase();
  for (let i = 0; i < recent.length; i++) {
    const r = recent[i]?.trim().toLowerCase();
    if (!r) continue;
    if (value === r || value.includes(r) || r.includes(value)) {
      return 12 - i * 2;
    }
  }
  return 0;
}

function stateAffinityBoost(
  suggestion: AutocompleteSuggestion,
  signals?: SuggestionSignals,
): number {
  const state = signals?.preferredState?.trim().toUpperCase();
  if (!state || state.length < 2) return 0;
  const metaState = suggestion.metadata?.state?.toUpperCase();
  if (metaState === state) return 8;
  if (suggestion.description?.toUpperCase().includes(state)) return 4;
  return 0;
}

export type RankSuggestionsInput = {
  suggestions: AutocompleteSuggestion[];
  query: string;
  mode: "proactive" | "reactive";
  signals?: SuggestionSignals;
  popularWeights?: Map<string, number>;
  keywordLookup?: (id: string) => string[];
};

export function rankSuggestions(input: RankSuggestionsInput): RankedSuggestion[] {
  const { suggestions, query, mode, signals, popularWeights, keywordLookup } =
    input;

  const ranked: RankedSuggestion[] = suggestions.map((s) => {
    const keywords = keywordLookup?.(s.id) ?? [];
    const tier =
      mode === "proactive"
        ? ("proactive" as const)
        : matchTierForSuggestion(s, query, keywords);

    if (mode === "reactive" && tier === "none") {
      return { ...s, score: -1, matchTier: tier };
    }

    const weight = popularWeights?.get(s.value.toLowerCase());
    const score =
      TIER_SCORE[tier] +
      verifiedBoost(s) +
      popularWeightBoost(weight) +
      recentQueryBoost(s, signals) +
      stateAffinityBoost(s, signals);

    return { ...s, score, matchTier: tier };
  });

  return ranked
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

export function stripRanking(ranked: RankedSuggestion[]): AutocompleteSuggestion[] {
  return ranked.map(({ score: _s, matchTier: _m, ...rest }) => rest);
}
