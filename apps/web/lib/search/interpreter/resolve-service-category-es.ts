import { searchInterpreterConfig } from "@/lib/config/search-interpreter";

export type EsCategoryHit = {
  slug: string;
  confidence: number;
};

/**
 * Elasticsearch multi_match on service category index (phase 2).
 * Returns null when ES is not configured or the request fails.
 */
export async function resolveServiceCategoryFromElasticsearch(
  query: string,
): Promise<EsCategoryHit | null> {
  const url = searchInterpreterConfig.elasticsearchUrl.replace(/\/$/, "");
  const apiKey = searchInterpreterConfig.elasticsearchApiKey;
  const alias = searchInterpreterConfig.elasticsearchCategoryAlias;

  if (!url || !apiKey || !query.trim()) return null;

  try {
    const res = await fetch(`${url}/${alias}/_search`, {
      method: "POST",
      headers: {
        Authorization: `ApiKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        size: 1,
        query: {
          multi_match: {
            query,
            fields: ["name^3", "keywords^2", "slug"],
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
    console.error("[search-interpreter] Elasticsearch category search failed", err);
    return null;
  }
}
