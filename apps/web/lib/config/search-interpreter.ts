/** Natural-language search interpreter (AI SDK + catalog resolution). */

export const GPT_OSS_MODEL_IDS = [
  "openai/gpt-oss-120b",
  "gpt-oss-120b",
] as const;

export type GptOssModelId = (typeof GPT_OSS_MODEL_IDS)[number];

/** Canonical gateway / allowlist id for production (mapable.com.au). */
export const GPT_OSS_GATEWAY_MODEL_ID = "openai/gpt-oss-120b";

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
  /** Gateway-style id (e.g. google/gemini-3.5-flash or openai/gpt-oss-120b). */
  get modelId() {
    return env("SEARCH_INTERPRETER_MODEL") || "google/gemini-3.5-flash";
  },
  /**
   * Optional self-hosted OpenAI-compatible base URL for gpt-oss
   * (e.g. http://localhost:8000/v1). Production on mapable.com.au should
   * prefer Vercel AI Gateway instead of this.
   */
  get gptOssBaseUrl() {
    return env("GPT_OSS_BASE_URL");
  },
  /** Optional bearer token for a self-hosted gpt-oss endpoint. */
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
  if (modelId === "gpt-oss-120b") return GPT_OSS_GATEWAY_MODEL_ID;
  return modelId;
}

/** Model name sent to a self-hosted OpenAI-compatible chat completions API. */
export function gptOssApiModelId(modelId: string): string {
  return modelId.startsWith("openai/")
    ? modelId.slice("openai/".length)
    : modelId;
}

/** Self-hosted gpt-oss via GPT_OSS_BASE_URL (optional; not the mapable.com.au default). */
export function isGptOssSelfHostedConfigured(): boolean {
  return (
    searchInterpreterConfig.enabled &&
    isGptOssModelId(searchInterpreterConfig.modelId) &&
    searchInterpreterConfig.gptOssBaseUrl.length > 0
  );
}

/**
 * gpt-oss is configured when the model id is selected and either:
 * - Vercel AI Gateway key is present (production / mapable.com.au), or
 * - GPT_OSS_BASE_URL is set (self-hosted OpenAI-compatible server).
 */
export function isGptOssConfigured(): boolean {
  if (
    !searchInterpreterConfig.enabled ||
    !isGptOssModelId(searchInterpreterConfig.modelId)
  ) {
    return false;
  }
  return (
    searchInterpreterConfig.aiGatewayApiKey.length > 0 ||
    searchInterpreterConfig.gptOssBaseUrl.length > 0
  );
}

export function isSearchInterpreterConfigured(): boolean {
  if (!searchInterpreterConfig.enabled) return false;

  if (isGptOssModelId(searchInterpreterConfig.modelId)) {
    return isGptOssConfigured();
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
    return isGptOssConfigured() ? "gpt-oss-120b" : "unavailable";
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
