import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { gateway, type LanguageModel } from "ai";

import {
  canonicalizeInterpreterModelId,
  gptOssApiModelId,
  isGptOssModelId,
  isGptOssSelfHostedConfigured,
  isSearchInterpreterConfigured,
  searchInterpreterConfig,
} from "@/lib/config/search-interpreter";

export function getInterpreterEngineId(): string {
  if (isGptOssSelfHostedConfigured()) {
    return `ai-sdk/openai-compatible/${gptOssApiModelId(searchInterpreterConfig.modelId)}`;
  }
  if (
    isGptOssModelId(searchInterpreterConfig.modelId) &&
    searchInterpreterConfig.aiGatewayApiKey
  ) {
    return `ai-sdk/gateway/${canonicalizeInterpreterModelId(searchInterpreterConfig.modelId)}`;
  }
  if (searchInterpreterConfig.aiGatewayApiKey) {
    return `ai-sdk/gateway/${searchInterpreterConfig.modelId}`;
  }
  return `ai-sdk/google/${stripGooglePrefix(searchInterpreterConfig.modelId)}`;
}

/**
 * Returns a model usable by AI SDK `streamText` / `generateObject` / `ToolLoopAgent`.
 *
 * `@ai-sdk/openai-compatible` currently exposes LanguageModelV4; AI SDK 6's
 * `LanguageModel` union is still V2/V3, so the self-hosted path is cast.
 */
export function getInterpreterModel(): LanguageModel {
  if (!isSearchInterpreterConfigured()) {
    throw new Error("Search interpreter is not configured");
  }

  const modelId = searchInterpreterConfig.modelId;

  // Prefer explicit self-hosted endpoint when set; otherwise AI Gateway
  // (production path for https://mapable.com.au).
  if (isGptOssSelfHostedConfigured()) {
    const provider = createOpenAICompatible({
      name: "gpt-oss",
      baseURL: searchInterpreterConfig.gptOssBaseUrl,
      apiKey: searchInterpreterConfig.gptOssApiKey || undefined,
    });
    return provider(
      gptOssApiModelId(modelId),
    ) as unknown as LanguageModel;
  }

  if (searchInterpreterConfig.aiGatewayApiKey) {
    const gatewayModelId = isGptOssModelId(modelId)
      ? canonicalizeInterpreterModelId(modelId)
      : modelId;
    return gateway(gatewayModelId);
  }

  return google(stripGooglePrefix(modelId));
}

function stripGooglePrefix(id: string): string {
  return id.startsWith("google/") ? id.slice("google/".length) : id;
}
