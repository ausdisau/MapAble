import { generateObject } from "ai";

import {
  captureLlmGeneration,
  getLlmAnalyticsProvider,
} from "@/lib/analytics/llm-analytics";
import {
  isSearchInterpreterConfigured,
  searchInterpreterConfig,
} from "@/lib/config/search-interpreter";
import { ACCESS_NEEDS } from "@/lib/provider/finder/filters";
import type { NaturalLanguageSearchFilters } from "@/types/search";

import { getInterpreterEngineId, getInterpreterModel } from "./get-model";
import { listServiceCategories } from "./load-categories";
import {
  looksLikeNaturalLanguage,
  naturalLanguageFiltersSchema,
  normalizeNlFilters,
  passthroughFilters,
  type ParsedNlFilters,
} from "./validation";

const parseResultSchema = naturalLanguageFiltersSchema;

const SYSTEM_PROMPT_BASE = `You parse natural-language search queries for MapAble, an Australian NDIS disability support provider directory.

Extract structured search filters from the user's query. Return JSON only with these fields:
- q: main search keywords (support type, general terms) — omit location, access needs, and provider names already captured in other fields
- location: Australian suburb, city, or postcode if mentioned
- access: accessibility or access needs (e.g. wheelchair access, Auslan, low sensory, hoist)
- service: specific service type if distinct from q (e.g. physiotherapy, occupational therapy)
- provider: specific provider or organisation name if mentioned
- serviceCategorySlug: optional canonical slug from the catalog below when confident; otherwise omit or empty string
- accessNeedIds: optional array of canonical access need ids from the access catalog below when confident; otherwise omit

Use empty strings for fields not mentioned. Prefer Australian English and NDIS terminology.`;

export type ParseQueryResult = {
  filters: ParsedNlFilters;
  parsed: boolean;
  engineId: string;
};

export async function buildInterpreterSystemPrompt(): Promise<string> {
  const categories = await listServiceCategories();
  const slugList = categories.map((c) => `${c.slug} (${c.name})`).join(", ");
  const needList = ACCESS_NEEDS.map(
    (n) => `${n.id} (${n.label}; e.g. ${n.keywords.slice(0, 3).join(", ")})`,
  ).join(", ");
  return `${SYSTEM_PROMPT_BASE}

Canonical service category slugs: ${slugList || "personal-care, accessible-transport, occupational-therapy, physiotherapy, support-coordination"}

Canonical access need ids: ${needList}

Examples:
- "Support worker near St Ives" → q=support worker, location=St Ives
- "Wheelchair accessible transport tomorrow" → q=transport, access=wheelchair access, service=transport, serviceCategorySlug=accessible-transport, accessNeedIds=["wheelchair"]
- "Support worker in Newcastle who knows Auslan" → q=support worker, location=Newcastle, access=Auslan interpreter, accessNeedIds=["auslan"]
- "Quiet sensory-friendly activities" → q=community access, access=low sensory quiet environment, accessNeedIds=["low-sensory"]
- "OT assessment with NDIS registration in Parramatta" → q=OT assessment, location=Parramatta, service=occupational therapy, serviceCategorySlug=occupational-therapy`;
}

export async function parseQueryWithLlm(
  query: string,
): Promise<ParseQueryResult> {
  const trimmed = query.trim();
  const engineId = getInterpreterEngineId();

  if (!isSearchInterpreterConfigured()) {
    return {
      filters: passthroughFilters(trimmed),
      parsed: false,
      engineId: "rules/passthrough",
    };
  }

  if (!looksLikeNaturalLanguage(trimmed)) {
    return {
      filters: passthroughFilters(trimmed),
      parsed: false,
      engineId: "rules/heuristic_skip",
    };
  }

  const system = await buildInterpreterSystemPrompt();
  const startedAt = Date.now();

  try {
    const { object, usage } = await generateObject({
      model: getInterpreterModel(),
      schema: parseResultSchema,
      system,
      prompt: `Query: ${trimmed}`,
      temperature: 0.1,
    });

    captureLlmGeneration({
      traceName: "provider_search_parse",
      model: searchInterpreterConfig.modelId,
      provider: getLlmAnalyticsProvider(engineId),
      latencyMs: Date.now() - startedAt,
      success: true,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
      metadata: {
        query_length: trimmed.length,
        engine_id: engineId,
      },
    });

    const normalized = normalizeNlFilters(object);

    if (!normalized.q && !normalized.location && !normalized.service) {
      normalized.q = trimmed;
    }

    return {
      filters: normalized,
      parsed: true,
      engineId,
    };
  } catch (error) {
    captureLlmGeneration({
      traceName: "provider_search_parse",
      model: searchInterpreterConfig.modelId,
      provider: getLlmAnalyticsProvider(engineId),
      latencyMs: Date.now() - startedAt,
      success: false,
      errorName: error instanceof Error ? error.name : "UnknownError",
      metadata: {
        query_length: trimmed.length,
        engine_id: engineId,
      },
    });
    throw error;
  }
}

export async function parseQueryWithLlmSafe(
  query: string,
): Promise<ParseQueryResult> {
  try {
    return await parseQueryWithLlm(query);
  } catch (err) {
    console.error("[search-interpreter] LLM parse failed", err);
    return {
      filters: passthroughFilters(query.trim()),
      parsed: false,
      engineId: searchInterpreterConfig.aiGatewayApiKey
        ? "ai-sdk/gateway/fallback"
        : "ai-sdk/google/fallback",
    };
  }
}

export function toNaturalLanguageFilters(
  parsed: ParsedNlFilters,
): NaturalLanguageSearchFilters {
  return {
    q: parsed.q,
    location: parsed.location,
    access: parsed.access,
    service: parsed.service,
    provider: parsed.provider,
  };
}
