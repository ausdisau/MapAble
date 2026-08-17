# Elasticsearch service category index (phase 2)

Optional search replica for **keyword + fuzzy** resolution of `service_categories`. Neon/Prisma stays authoritative; sync is one-way from the database.

## Index and alias

| Name | Role |
| ---- | ---- |
| `mapable_service_categories_v1` | Versioned index |
| `mapable_service_categories_current` | Alias → active index (env: `ES_SERVICE_CATEGORY_ALIAS`) |

## Mapping (v1)

```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "category_text": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "slug": { "type": "keyword" },
      "name": {
        "type": "text",
        "analyzer": "category_text",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "keywords": {
        "type": "text",
        "analyzer": "category_text"
      }
    }
  }
}
```

`dense_vector` for embeddings is reserved for a later iteration.

## Sync

```bash
export ES_URL="https://<cluster>.elastic.cloud:443"
export ES_API_KEY="<base64 api key>"

npx tsx scripts/sync-service-categories-to-es.ts
```

The script:

1. Creates `mapable_service_categories_v1` if missing (with mapping above).
2. Bulk-indexes all rows from `prisma.serviceCategory`.
3. Points alias `mapable_service_categories_current` at the index.

Re-run after seed or catalog edits.

## Runtime

When `ES_URL` and `ES_API_KEY` are set, `resolve-service-category.ts` calls `resolve-service-category-es.ts` (`multi_match` on `name^3`, `keywords^2`, `slug`) before Prisma keyword fallback.

Failures are logged and ignored — interpretation still completes.

## Operations

- **Elastic Cloud Serverless** or an existing cluster; store credentials in Vercel env for production.
- For local development, optional Elastic MCP in `.cursor/mcp.json` can inspect indices.
- Do not delete the Prisma catalog when rebuilding ES; rebuild the index and flip the alias instead.

## Alternative: OpenSearch

The same index mapping and alias pattern is available for OpenSearch clusters. See [opensearch-service-categories.md](./opensearch-service-categories.md). When both Elasticsearch and OpenSearch are configured, Elasticsearch is tried first.

## Related

- [OpenSearch service categories](./opensearch-service-categories.md)
- [Natural-language interpreter](./nl-interpreter.md)
