#!/usr/bin/env npx tsx
/**
 * Bulk-sync service_categories from Prisma into OpenSearch.
 * Requires OPENSEARCH_ENABLED=true, OPENSEARCH_URL, OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD.
 * See docs/search/opensearch-service-categories.md
 */
import { PrismaClient } from "@prisma/client";

import {
  SERVICE_CATEGORY_INDEX_BODY,
  SERVICE_CATEGORY_INDEX_V1,
} from "@/lib/search/service-category-index";
import { openSearchFetch } from "@/lib/search/opensearch-client";

const INDEX =
  process.env.OPENSEARCH_SERVICE_CATEGORY_INDEX ?? SERVICE_CATEGORY_INDEX_V1;
const ALIAS =
  process.env.OPENSEARCH_SERVICE_CATEGORY_ALIAS ??
  "mapable_service_categories_current";

async function ensureIndex(): Promise<void> {
  const head = await openSearchFetch(`/${INDEX}`, { method: "HEAD" });
  if (head.status === 200) {
    console.log(`Index ${INDEX} already exists.`);
    return;
  }

  const create = await openSearchFetch(`/${INDEX}`, {
    method: "PUT",
    body: JSON.stringify(SERVICE_CATEGORY_INDEX_BODY),
  });

  if (!create.ok) {
    const text = await create.text();
    throw new Error(`Failed to create index ${INDEX}: ${create.status} ${text}`);
  }
  console.log(`Created index ${INDEX}.`);
}

async function bulkIndex(
  docs: Array<{ id: string; slug: string; name: string; keywords: string[] }>,
): Promise<void> {
  if (docs.length === 0) {
    console.warn("No service categories in database — nothing to index.");
    return;
  }

  const lines: string[] = [];
  for (const doc of docs) {
    lines.push(JSON.stringify({ index: { _index: INDEX, _id: doc.id } }));
    lines.push(
      JSON.stringify({
        slug: doc.slug,
        name: doc.name,
        keywords: doc.keywords,
      }),
    );
  }

  const bulk = await openSearchFetch("/_bulk", {
    method: "POST",
    headers: { "Content-Type": "application/x-ndjson" },
    body: `${lines.join("\n")}\n`,
  });

  if (!bulk.ok) {
    const text = await bulk.text();
    throw new Error(`Bulk index failed: ${bulk.status} ${text}`);
  }

  const result = (await bulk.json()) as { errors?: boolean };
  if (result.errors) {
    throw new Error("Bulk index reported errors — check cluster logs.");
  }

  console.log(`Indexed ${docs.length} categories into ${INDEX}.`);
}

async function ensureAlias(): Promise<void> {
  const actions = {
    actions: [
      { remove: { index: "*", alias: ALIAS, ignore_unavailable: true } },
      { add: { index: INDEX, alias: ALIAS } },
    ],
  };

  const res = await openSearchFetch("/_aliases", {
    method: "POST",
    body: JSON.stringify(actions),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update alias ${ALIAS}: ${res.status} ${text}`);
  }

  console.log(`Alias ${ALIAS} → ${INDEX}.`);
}

async function main(): Promise<void> {
  if (process.env.OPENSEARCH_ENABLED !== "true") {
    console.error("Set OPENSEARCH_ENABLED=true before running this script.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const rows = await prisma.serviceCategory.findMany({ orderBy: { name: "asc" } });
    const docs = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      keywords: r.keywords ?? [],
    }));

    await ensureIndex();
    await bulkIndex(docs);
    await ensureAlias();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
