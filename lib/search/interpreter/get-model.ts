import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { gateway } from "ai";

import {
  gptOssApiModelId,
  isGptOssConfigured,
  isSearchInterpreterConfigured,
  searchInterpreterConfig,
} from "@/lib/config/search-interpreter";

export function getInterpreterEngineId(): string {
  if (isGptOssConfigured()) {
    return `ai-sdk/openai-compatible/${gptOssApiModelId(searchInterpreterConfig.modelId)}`;
  }
  if (searchInterpreterConfig.aiGatewayApiKey) {
    return `ai-sdk/gateway/${searchInterpreterConfig.modelId}`;
  }
  return `ai-sdk/google/${stripGooglePrefix(searchInterpreterConfig.modelId)}`;
}

export function getInterpreterModel() {
  if (!isSearchInterpreterConfigured()) {
    throw new Error("Search interpreter is not configured");
  }

  const modelId = searchInterpreterConfig.modelId;

  if (isGptOssConfigured()) {
    const provider = createOpenAICompatible({
      name: "gpt-oss",
      baseURL: searchInterpreterConfig.gptOssBaseUrl,
      apiKey: searchInterpreterConfig.gptOssApiKey || undefined,
    });
    return provider(gptOssApiModelId(modelId));
  }

  if (searchInterpreterConfig.aiGatewayApiKey) {
    return gateway(modelId);
  }

  return google(stripGooglePrefix(modelId));
}

function stripGooglePrefix(id: string): string {
  return id.startsWith("google/") ? id.slice("google/".length) : id;
}
