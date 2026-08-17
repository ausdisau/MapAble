import {
  isOpenSearchConfigured,
  openSearchConfig,
} from "@/lib/config/opensearch";
import { openSearchFetch } from "@/lib/search/opensearch-client";
import { SERVICE_CATEGORY_SEARCH_FIELDS } from "@/lib/search/service-category-index";

export type OpenSearchCategoryHit = {
  slug: string;
  confidence: number;
};

/**
 * OpenSearch multi_match on service category index (phase 2 alternative to Elasticsearch).
 * Returns null when OpenSearch is not configured or the request fails.
 */
export async function resolveServiceCategoryFromOpenSearch(
  query: string,
): Promise<OpenSearchCategoryHit | null> {
  if (!isOpenSearchConfigured() || !query.trim()) return null;

  const alias = openSearchConfig.serviceCategoryAlias;

  try {
    const res = await openSearchFetch(`/${alias}/_search`, {
      method: "POST",
      body: JSON.stringify({
        size: 1,
        query: {
          multi_match: {
            query,
            fields: SERVICE_CATEGORY_SEARCH_FIELDS,
            type: "best_fields",
            fuzziness: "AUTO",
          },
        },
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      hits?: { hits?: Array<{ _score?: number; _source?: { slug?: string } }> };
    };

    const hit = data.hits?.hits?.[0];
    const slug = hit?._source?.slug;
    if (!slug) return null;

    const score = hit._score ?? 0;
    const confidence = Math.min(0.88, 0.45 + score * 0.05);

    return { slug, confidence };
  } catch (err) {
    console.error("[search-interpreter] OpenSearch category search failed", err);
    return null;
  }
}
