/** OpenSearch cluster for optional search replicas (Elasticsearch-compatible API). */

export const openSearchConfig = {
  enabled: process.env.OPENSEARCH_ENABLED === "true",
  url: (process.env.OPENSEARCH_URL ?? "").replace(/\/$/, ""),
  username: process.env.OPENSEARCH_USERNAME ?? "",
  password: process.env.OPENSEARCH_PASSWORD ?? "",
  serviceCategoryAlias:
    process.env.OPENSEARCH_SERVICE_CATEGORY_ALIAS ??
    "mapable_service_categories_current",
  serviceCategoryIndex:
    process.env.OPENSEARCH_SERVICE_CATEGORY_INDEX ??
    "mapable_service_categories_v1",
};

export function isOpenSearchConfigured(): boolean {
  return (
    process.env.OPENSEARCH_ENABLED === "true" &&
    (process.env.OPENSEARCH_URL ?? "").replace(/\/$/, "").length > 0 &&
    (process.env.OPENSEARCH_USERNAME ?? "").length > 0 &&
    (process.env.OPENSEARCH_PASSWORD ?? "").length > 0
  );
}
