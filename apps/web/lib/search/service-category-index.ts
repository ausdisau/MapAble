/** Shared index mapping for service category replicas (Elasticsearch / OpenSearch). */

export const SERVICE_CATEGORY_INDEX_V1 = "mapable_service_categories_v1";

export const SERVICE_CATEGORY_INDEX_BODY = {
  settings: {
    analysis: {
      analyzer: {
        category_text: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding"],
        },
      },
    },
  },
  mappings: {
    properties: {
      slug: { type: "keyword" },
      name: {
        type: "text",
        analyzer: "category_text",
        fields: { keyword: { type: "keyword" } },
      },
      keywords: { type: "text", analyzer: "category_text" },
    },
  },
} as const;

export const SERVICE_CATEGORY_SEARCH_FIELDS = ["name^3", "keywords^2", "slug"];
