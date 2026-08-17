# OpenSearch service category index (phase 2)

Optional search replica for **keyword + fuzzy** resolution of `service_categories`. Neon/Prisma stays authoritative; sync is one-way from the database. Uses the same mapping as the [Elasticsearch index](./elasticsearch-service-categories.md).

## Index and alias

| Name | Role |
| ---- | ---- |
| `mapable_service_categories_v1` | Versioned index (env: `OPENSEARCH_SERVICE_CATEGORY_INDEX`) |
| `mapable_service_categories_current` | Alias → active index (env: `OPENSEARCH_SERVICE_CATEGORY_ALIAS`) |

## Sync

```bash
export OPENSEARCH_ENABLED=true
export OPENSEARCH_URL="https://<cluster>.example.com:9200"
export OPENSEARCH_USERNAME="admin"
export OPENSEARCH_PASSWORD="<password>"

npx tsx scripts/sync-service-categories-to-opensearch.ts
```

The script:

1. Creates `mapable_service_categories_v1` if missing (shared mapping in `lib/search/service-category-index.ts`).
2. Bulk-indexes all rows from `prisma.serviceCategory`.
3. Points alias `mapable_service_categories_current` at the index.

Re-run after seed or catalog edits.

## Runtime

When `OPENSEARCH_ENABLED=true` and credentials are set, `resolve-service-category.ts` calls `resolve-service-category-opensearch.ts` (`multi_match` on `name^3`, `keywords^2`, `slug`) after Elasticsearch (if configured) and before Prisma keyword fallback.

Failures are logged and ignored — interpretation still completes.

## Operations

- **Amazon OpenSearch Service**, self-hosted OpenSearch, or any Elasticsearch-compatible cluster with Basic auth.
- Store credentials in Vercel env for production.
- Elasticsearch (`ES_URL` + `ES_API_KEY`) takes precedence when both search backends are configured.

## Related

- [Elasticsearch service categories](./elasticsearch-service-categories.md)
- [Natural-language interpreter](./nl-interpreter.md)
