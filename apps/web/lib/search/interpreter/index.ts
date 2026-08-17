import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import type { SearchInterpretation } from "@/types/search";

import { classifyCategorySlugFromHub } from "./classifier-hint";
import {
  parseQueryWithLlmSafe,
  toNaturalLanguageFilters,
} from "./parse-query";
import { resolveAccessNeeds } from "./resolve-access-needs";
import { resolveServiceCategory } from "./resolve-service-category";

const MAX_UI_CONFIDENCE = 0.85;

export async function interpretSearchQuery(
  query: string,
): Promise<SearchInterpretation> {
  const sourceQuery = query.trim();
  const configured = isSearchInterpreterConfigured();

  if (!sourceQuery) {
    return emptyInterpretation(sourceQuery, configured);
  }

  const hubSlug = await classifyCategorySlugFromHub(sourceQuery);
  const parseResult = await parseQueryWithLlmSafe(sourceQuery);

  const filters = toNaturalLanguageFilters(parseResult.filters);
  const category = await resolveServiceCategory({
    serviceText: filters.service,
    qText: filters.q,
    suggestedSlug: hubSlug ?? parseResult.filters.serviceCategorySlug,
  });

  const accessNeeds = await resolveAccessNeeds({
    accessText: filters.access,
    qText: filters.q,
    suggestedIds: parseResult.filters.accessNeedIds,
  });

  let confidence = parseResult.parsed ? 0.72 : 0.35;
  if (category.confidence > confidence) confidence = category.confidence;
  if (parseResult.parsed && category.slug) confidence = Math.min(0.88, confidence + 0.1);
  if (accessNeeds.confidence >= 0.5 && accessNeeds.ids.length > 0) {
    confidence = Math.min(MAX_UI_CONFIDENCE, confidence + 0.05);
  }
  confidence = Math.min(MAX_UI_CONFIDENCE, confidence);

  return {
    sourceQuery,
    parsed: parseResult.parsed,
    configured,
    filters,
    serviceCategorySlug: category.slug,
    serviceCategoryId: category.id,
    accessNeedIds: accessNeeds.ids,
    accessNeeds,
    confidence,
    engineId: parseResult.engineId,
  };
}

function emptyInterpretation(
  sourceQuery: string,
  configured: boolean,
): SearchInterpretation {
  return {
    sourceQuery,
    parsed: false,
    configured,
    filters: {
      q: "",
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
    engineId: "rules/empty",
  };
}
