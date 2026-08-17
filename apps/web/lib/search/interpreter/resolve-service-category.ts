import { isOpenSearchConfigured } from "@/lib/config/opensearch";
import { isElasticsearchCategorySearchConfigured } from "@/lib/config/search-interpreter";

import {
  listServiceCategories,
  type ServiceCategoryRow,
} from "./load-categories";
import { resolveServiceCategoryFromElasticsearch } from "./resolve-service-category-es";
import { resolveServiceCategoryFromOpenSearch } from "./resolve-service-category-opensearch";
import { scoreTextAgainstQuery } from "./score-text";

export type ServiceCategoryResolution = {
  slug: string | null;
  id: string | null;
  confidence: number;
  source: "llm_slug" | "elasticsearch" | "opensearch" | "keyword" | "none";
};

const MIN_CONFIDENCE = 0.35;

export async function resolveServiceCategory(input: {
  serviceText: string;
  qText: string;
  suggestedSlug?: string;
}): Promise<ServiceCategoryResolution> {
  const categories = await listServiceCategories();
  const combined = [input.serviceText, input.qText].filter(Boolean).join(" ").trim();

  if (input.suggestedSlug) {
    const bySlug = categories.find((c) => c.slug === input.suggestedSlug);
    if (bySlug) {
      return {
        slug: bySlug.slug,
        id: bySlug.id,
        confidence: 0.9,
        source: "llm_slug",
      };
    }
  }

  if (combined.length >= 2) {
    if (isElasticsearchCategorySearchConfigured()) {
      const esHit = await resolveServiceCategoryFromElasticsearch(combined);
      if (esHit) {
        const row = categories.find((c) => c.slug === esHit.slug);
        if (row) {
          return {
            slug: row.slug,
            id: row.id,
            confidence: esHit.confidence,
            source: "elasticsearch",
          };
        }
      }
    }

    if (isOpenSearchConfigured()) {
      const osHit = await resolveServiceCategoryFromOpenSearch(combined);
      if (osHit) {
        const row = categories.find((c) => c.slug === osHit.slug);
        if (row) {
          return {
            slug: row.slug,
            id: row.id,
            confidence: osHit.confidence,
            source: "opensearch",
          };
        }
      }
    }
  }

  const keywordHit = scoreCategories(categories, combined || input.serviceText || input.qText);
  if (keywordHit && keywordHit.score >= 3) {
    const confidence = Math.min(0.85, 0.4 + keywordHit.score * 0.08);
    if (confidence >= MIN_CONFIDENCE) {
      return {
        slug: keywordHit.row.slug,
        id: keywordHit.row.id,
        confidence,
        source: "keyword",
      };
    }
  }

  return { slug: null, id: null, confidence: 0, source: "none" };
}

function scoreCategories(categories: ServiceCategoryRow[], query: string) {
  if (!query.trim()) return null;

  let best: { row: ServiceCategoryRow; score: number } | null = null;
  for (const row of categories) {
    const score = scoreTextAgainstQuery(
      [row.name, row.slug.replace(/-/g, " "), ...row.keywords],
      query,
    );
    if (!best || score > best.score) {
      best = { row, score };
    }
  }
  return best;
}
