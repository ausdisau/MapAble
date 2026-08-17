import type { SearchInterpretation } from "@/types/search";

export async function interpretSearchQueryClient(
  query: string,
  context?: "homepage" | "provider_finder",
): Promise<SearchInterpretation> {
  const res = await fetch("/api/search/interpret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, context }),
  });

  if (!res.ok) {
    const fallback: SearchInterpretation = {
      sourceQuery: query.trim(),
      parsed: false,
      configured: false,
      filters: {
        q: query.trim(),
        location: "",
        access: "",
        service: "",
        provider: "",
      },
      serviceCategorySlug: null,
      serviceCategoryId: null,
      accessNeedIds: [],
      accessNeeds: { ids: [], confidence: 0, source: "none" },
      confidence: 0,
      engineId: "client/fallback",
    };
    return fallback;
  }

  return (await res.json()) as SearchInterpretation;
}
