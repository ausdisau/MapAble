import { generateObject } from "ai";
import { z } from "zod";

import {
  captureLlmGeneration,
  getLlmAnalyticsProvider,
} from "@/lib/analytics/llm-analytics";
import {
  isNeedsInterpreterLlmEnabled,
  searchInterpreterConfig,
} from "@/lib/config/search-interpreter";
import { ACCESS_NEEDS } from "@/lib/provider/finder/filters";
import type { AccessNeedResolution } from "@/types/search";

import { getInterpreterEngineId, getInterpreterModel } from "./get-model";
import { filterValidAccessNeedIds } from "./resolve-access-needs";

const needIds = ACCESS_NEEDS.map((n) => n.id) as [string, ...string[]];

const needsSchema = z.object({
  accessNeedIds: z
    .array(z.enum(needIds))
    .max(5)
    .describe("Canonical ACCESS_NEEDS ids from the catalog"),
});

const NEEDS_SYSTEM = `You map Australian disability support access phrases to MapAble Provider Finder chip ids.

Return only ids from this catalog (use empty array if none apply):
${ACCESS_NEEDS.map((n) => `- ${n.id}: ${n.label} (keywords: ${n.keywords.join(", ")})`).join("\n")}

Prefer Australian English and NDIS terminology.`;

export async function resolveAccessNeedIdsWithLlm(
  accessText: string,
): Promise<AccessNeedResolution> {
  const text = accessText.trim();
  if (!text || !isNeedsInterpreterLlmEnabled()) {
    return { ids: [], confidence: 0, source: "none" };
  }

  const engineId = getInterpreterEngineId();
  const startedAt = Date.now();

  try {
    const { object, usage } = await generateObject({
      model: getInterpreterModel(),
      schema: needsSchema,
      system: NEEDS_SYSTEM,
      prompt: `Access-related phrase from user search: ${text}`,
      temperature: 0.1,
    });
    captureLlmGeneration({
      traceName: "provider_search_access_needs",
      model: searchInterpreterConfig.modelId,
      provider: getLlmAnalyticsProvider(engineId),
      latencyMs: Date.now() - startedAt,
      success: true,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
      metadata: {
        text_length: text.length,
        engine_id: engineId,
      },
    });

    const ids = filterValidAccessNeedIds(object.accessNeedIds);
    if (ids.length === 0) {
      return { ids: [], confidence: 0, source: "none", unmatchedText: text };
    }

    return {
      ids,
      confidence: 0.75,
      source: "llm_step",
    };
  } catch (err) {
    captureLlmGeneration({
      traceName: "provider_search_access_needs",
      model: searchInterpreterConfig.modelId,
      provider: getLlmAnalyticsProvider(engineId),
      latencyMs: Date.now() - startedAt,
      success: false,
      errorName: err instanceof Error ? err.name : "UnknownError",
      metadata: {
        text_length: text.length,
        engine_id: engineId,
      },
    });
    console.error("[search-interpreter] needs LLM step failed", err);
    return {
      ids: [],
      confidence: 0,
      source: "none",
      unmatchedText: text,
    };
  }
}
