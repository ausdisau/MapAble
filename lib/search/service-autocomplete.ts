import { prisma } from "@/lib/prisma";
import { keywordsMatchQuery, textMatchesQuery } from "@/lib/search/matches-query";
import { getStaticProactiveCatalog } from "@/lib/search/suggestion-fallback-catalog";
import type { AutocompleteSuggestion } from "@/types/search";

function filterByQuery<T extends { keywords: string[] }>(
  rows: T[],
  query: string,
  getSearchableText: (row: T) => string,
  limit: number,
): T[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return rows
    .filter(
      (row) =>
        textMatchesQuery(getSearchableText(row), q) ||
        keywordsMatchQuery(row.keywords, q),
    )
    .slice(0, limit);
}

export async function searchServiceCategories(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const rows = await prisma.serviceCategory.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    const matched = rows;
    if (matched.length < limit) {
      const extra = await prisma.serviceCategory.findMany({
        take: 80,
        orderBy: { name: "asc" },
      });
      const seen = new Set(matched.map((r) => r.id));
      for (const row of filterByQuery(extra, q, (r) => r.name, limit)) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        matched.push(row);
        if (matched.length >= limit) break;
      }
    }

    return matched.slice(0, limit).map((row) => ({
      id: `service-${row.id}`,
      type: "service",
      typeLabel: "Service",
      label: row.name,
      value: row.name,
    }));
  } catch (err) {
    console.error("[predictive-suggestions] service search failed", err);
    throw err;
  }
}

export async function listProactiveAccessibility(
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const rows = await prisma.searchAccessibilityFeature.findMany({
    take: limit,
    orderBy: { label: "asc" },
  });
  return rows.map((row) => ({
    id: `access-${row.id}`,
    type: "accessibility_feature",
    typeLabel: "Access",
    label: row.label,
    value: row.label,
  }));
}

export async function listProactiveLanguages(
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const rows = await prisma.searchLanguage.findMany({
    take: limit,
    orderBy: { label: "asc" },
  });
  return rows.map((row) => ({
    id: `language-${row.id}`,
    type: "language",
    typeLabel: "Language",
    label: row.label,
    value: row.label,
  }));
}

export async function searchAccessibilityFeatures(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const rows = await prisma.searchAccessibilityFeature.findMany({
      where: {
        label: { contains: q, mode: "insensitive" },
      },
      take: limit,
      orderBy: { label: "asc" },
    });

    const matched = rows;
    if (matched.length < limit) {
      const extra = await prisma.searchAccessibilityFeature.findMany({
        take: 80,
        orderBy: { label: "asc" },
      });
      const seen = new Set(matched.map((r) => r.id));
      for (const row of filterByQuery(extra, q, (r) => r.label, limit)) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        matched.push(row);
        if (matched.length >= limit) break;
      }
    }

    return matched.slice(0, limit).map((row) => ({
      id: `access-${row.id}`,
      type: "accessibility_feature",
      typeLabel: "Access",
      label: row.label,
      value: row.label,
    }));
  } catch (err) {
    console.error("[predictive-suggestions] accessibility search failed", err);
    throw err;
  }
}

export async function searchLanguages(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const rows = await prisma.searchLanguage.findMany({
      where: {
        label: { contains: q, mode: "insensitive" },
      },
      take: limit,
      orderBy: { label: "asc" },
    });

    const matched = rows;
    if (matched.length < limit) {
      const extra = await prisma.searchLanguage.findMany({
        take: 40,
        orderBy: { label: "asc" },
      });
      const seen = new Set(matched.map((r) => r.id));
      for (const row of filterByQuery(extra, q, (r) => r.label, limit)) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        matched.push(row);
        if (matched.length >= limit) break;
      }
    }

    return matched.slice(0, limit).map((row) => ({
      id: `language-${row.id}`,
      type: "language",
      typeLabel: "Language",
      label: row.label,
      value: row.label,
    }));
  } catch (err) {
    console.error("[predictive-suggestions] language search failed", err);
    throw err;
  }
}

export type ProactiveCatalogResult = {
  suggestions: AutocompleteSuggestion[];
  popularWeights: [string, number][];
  failed: boolean;
  usedFallback: boolean;
};

/** Curated suggestions shown before the user types (chips + proactive dropdown). */
export async function listProactiveCatalog(
  context: "homepage" | "provider_finder",
  limit: number,
): Promise<ProactiveCatalogResult> {
  try {
    const popularRows = await prisma.popularSearch.findMany({
      where: {
        OR: [{ context: "all" }, { context }],
      },
      orderBy: [{ weight: "desc" }, { query: "asc" }],
      take: Math.min(limit, 8),
    });

    const serviceRows = await prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
      take: 4,
    });

    const locationRows = await prisma.searchableLocation.findMany({
      orderBy: { displayName: "asc" },
      take: 3,
    });

    const popular: AutocompleteSuggestion[] = popularRows.map((row) => ({
      id: `popular-${row.id}`,
      type: "popular_search",
      typeLabel: "Popular",
      label: row.query,
      value: row.query,
    }));

    const services: AutocompleteSuggestion[] = serviceRows.map((row) => ({
      id: `service-${row.id}`,
      type: "service",
      typeLabel: "Service",
      label: row.name,
      value: row.name,
    }));

    const locations: AutocompleteSuggestion[] = locationRows.map((row) => ({
      id: `location-${row.id}`,
      type: "location",
      typeLabel: "Location",
      label: row.displayName,
      description: [row.suburb, row.state, row.postcode].filter(Boolean).join(", "),
      value: row.displayName,
      metadata: {
        suburb: row.suburb ?? undefined,
        state: row.state ?? undefined,
        postcode: row.postcode ?? undefined,
      },
    }));

    const popularWeights: [string, number][] = popularRows.map((row) => [
      row.query.toLowerCase(),
      row.weight,
    ]);

    const combined = [...popular, ...services, ...locations];
    if (combined.length > 0) {
      return {
        suggestions: combined,
        popularWeights,
        failed: false,
        usedFallback: false,
      };
    }

    const fallback = getStaticProactiveCatalog(limit);
    console.warn(
      "[predictive-suggestions] DB catalog empty — using static fallback (run prisma/seed-search-autocomplete.ts)",
    );
    return {
      suggestions: fallback.suggestions,
      popularWeights: fallback.popularWeights,
      failed: false,
      usedFallback: true,
    };
  } catch (err) {
    console.error("[predictive-suggestions] proactive catalog failed", err);
    const fallback = getStaticProactiveCatalog(limit);
    return {
      suggestions: fallback.suggestions,
      popularWeights: fallback.popularWeights,
      failed: true,
      usedFallback: true,
    };
  }
}

export async function searchPopularSearches(
  query: string,
  context: "homepage" | "provider_finder",
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const rows = await prisma.popularSearch.findMany({
      where: {
        query: { contains: q, mode: "insensitive" },
        OR: [{ context: "all" }, { context }],
      },
      take: limit,
      orderBy: [{ weight: "desc" }, { query: "asc" }],
    });

    return rows.map((row) => ({
      id: `popular-${row.id}`,
      type: "popular_search",
      typeLabel: "Popular",
      label: row.query,
      value: row.query,
    }));
  } catch (err) {
    console.error("[predictive-suggestions] popular search failed", err);
    throw err;
  }
}
