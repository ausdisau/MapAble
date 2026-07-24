/** Natural-language search interpreter (AI SDK + catalog resolution). */

export const GPT_OSS_MODEL_IDS = [
  "openai/gpt-oss-120b",
  "gpt-oss-120b",
] as const;

export type GptOssModelId = (typeof GPT_OSS_MODEL_IDS)[number];

function env(name: string): string {
  return process.env[name] ?? "";
}

/** Lazy env reads so tests and runtime config changes are visible. */
export const searchInterpreterConfig = {
  get enabled() {
    return process.env.SEARCH_INTERPRETER_ENABLED === "true";
  },
  get aiGatewayApiKey() {
    return env("AI_GATEWAY_API_KEY") || env("VERCEL_AI_GATEWAY_API_KEY");
  },
  get googleApiKey() {
    return env("GOOGLE_GENERATIVE_AI_API_KEY");
  },
  /** Gateway-style id (e.g. google/gemini-3.5-flash) or bare id for @ai-sdk/google. */
  get modelId() {
    return env("SEARCH_INTERPRETER_MODEL") || "google/gemini-3.5-flash";
  },
  /** OpenAI-compatible base URL for gpt-oss (e.g. http://localhost:8000/v1). */
  get gptOssBaseUrl() {
    return env("GPT_OSS_BASE_URL");
  },
  /** Optional bearer token for the gpt-oss endpoint. */
  get gptOssApiKey() {
    return env("GPT_OSS_API_KEY");
  },
  /** Optional HF text-classifier repo for slug hints (phase 3). */
  get classifierHubId() {
    return env("SEARCH_INTERPRETER_CLASSIFIER_HUB_ID");
  },
  get huggingFaceToken() {
    return env("HF_TOKEN") || env("HUGGINGFACE_API_KEY");
  },
  get elasticsearchUrl() {
    return env("ES_URL");
  },
  get elasticsearchApiKey() {
    return env("ES_API_KEY");
  },
  get elasticsearchCategoryAlias() {
    return env("ES_SERVICE_CATEGORY_ALIAS") || "mapable_service_categories_current";
  },
  /** Dedicated LLM step when keyword needs resolution returns empty but access text is set. */
  get needsInterpreterLlm() {
    return process.env.SEARCH_NEEDS_INTERPRETER_LLM === "true";
  },
};

export function isGptOssModelId(modelId: string): boolean {
  return (GPT_OSS_MODEL_IDS as readonly string[]).includes(modelId);
}

/** Canonical allowlist / registry id for gpt-oss. */
export function canonicalizeInterpreterModelId(modelId: string): string {
  if (modelId === "gpt-oss-120b") return "openai/gpt-oss-120b";
  return modelId;
}

/** Model name sent to the OpenAI-compatible chat completions API. */
export function gptOssApiModelId(modelId: string): string {
  return modelId.startsWith("openai/")
    ? modelId.slice("openai/".length)
    : modelId;
}

export function isGptOssConfigured(): boolean {
  return (
    searchInterpreterConfig.enabled &&
    isGptOssModelId(searchInterpreterConfig.modelId) &&
    searchInterpreterConfig.gptOssBaseUrl.length > 0
  );
}

export function isSearchInterpreterConfigured(): boolean {
  if (!searchInterpreterConfig.enabled) return false;

  if (isGptOssModelId(searchInterpreterConfig.modelId)) {
    return searchInterpreterConfig.gptOssBaseUrl.length > 0;
  }

  return (
    searchInterpreterConfig.aiGatewayApiKey.length > 0 ||
    searchInterpreterConfig.googleApiKey.length > 0
  );
}

export function isElasticsearchCategorySearchConfigured(): boolean {
  return (
    searchInterpreterConfig.elasticsearchUrl.length > 0 &&
    searchInterpreterConfig.elasticsearchApiKey.length > 0
  );
}

export function isNeedsInterpreterLlmEnabled(): boolean {
  return (
    isSearchInterpreterConfigured() && searchInterpreterConfig.needsInterpreterLlm
  );
}

/**
 * Safe display name for UI labels (no secrets / URLs).
 * Returns "unavailable" when the interpreter is not configured.
 */
export function getInterpreterDisplayName(): string {
  if (!searchInterpreterConfig.enabled) return "unavailable";

  if (isGptOssModelId(searchInterpreterConfig.modelId)) {
    return searchInterpreterConfig.gptOssBaseUrl.length > 0
      ? "gpt-oss-120b"
      : "unavailable";
  }

  if (
    searchInterpreterConfig.aiGatewayApiKey.length === 0 &&
    searchInterpreterConfig.googleApiKey.length === 0
  ) {
    return "unavailable";
  }

  const id = searchInterpreterConfig.modelId;
  if (id.includes("gemini-3.5-flash") || id.endsWith("gemini-3.5-flash")) {
    return "Gemini 3.5 Flash";
  }
  if (id.startsWith("google/")) return id.slice("google/".length);
  return id;
}

export function isGptOssDisplayActive(): boolean {
  return getInterpreterDisplayName() === "gpt-oss-120b";
}
