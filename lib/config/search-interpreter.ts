/** Natural-language search interpreter (AI SDK + catalog resolution). */

export const searchInterpreterConfig = {
  enabled: process.env.SEARCH_INTERPRETER_ENABLED === "true",
  aiGatewayApiKey:
    process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_AI_GATEWAY_API_KEY ?? "",
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
  /** Gateway-style id (e.g. google/gemini-3.5-flash) or bare id for @ai-sdk/google. */
  modelId: process.env.SEARCH_INTERPRETER_MODEL ?? "google/gemini-3.5-flash",
  /** Optional HF text-classifier repo for slug hints (phase 3). */
  classifierHubId: process.env.SEARCH_INTERPRETER_CLASSIFIER_HUB_ID ?? "",
  huggingFaceToken:
    process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY ?? "",
  elasticsearchUrl: process.env.ES_URL ?? "",
  elasticsearchApiKey: process.env.ES_API_KEY ?? "",
  elasticsearchCategoryAlias:
    process.env.ES_SERVICE_CATEGORY_ALIAS ?? "mapable_service_categories_current",
  /** Dedicated LLM step when keyword needs resolution returns empty but access text is set. */
  needsInterpreterLlm:
    process.env.SEARCH_NEEDS_INTERPRETER_LLM === "true",
};

export function isSearchInterpreterConfigured(): boolean {
  return (
    searchInterpreterConfig.enabled &&
    (searchInterpreterConfig.aiGatewayApiKey.length > 0 ||
      searchInterpreterConfig.googleApiKey.length > 0)
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
