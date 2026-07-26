import { searchProvidersForAppliedTurn } from "@/lib/provider/finder/ndis-search-from-applied";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

import { TOOL_SEARCH_NDIS_PROVIDERS } from "./index";

export async function toolSearchNdisProviders(
  applied: AppliedSearchFields,
  interpretation: SearchInterpretation,
  limit?: number,
) {
  const results = await searchProvidersForAppliedTurn(applied, interpretation, {
    limit,
  });
  return {
    tool: TOOL_SEARCH_NDIS_PROVIDERS,
    count: results.length,
    results,
  };
}
