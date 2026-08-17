#!/usr/bin/env npx tsx
/**
 * Seed provider_outlets from NDIS list-providers.json (local Prisma).
 *
 * File resolution: --file path → data/ndis/list-providers.json → public/data/provider-outlets.json
 *
 *   pnpm prisma migrate deploy
 *   pnpm seed:ndis-provider-outlets
 *   pnpm seed:ndis-provider-outlets -- --limit 500
 */
import { PrismaClient } from "@prisma/client";

import { loadNdisListProviders } from "@/lib/ndis/list-providers-source";
import { mapProviderOutletToPrisma } from "@/lib/ndis/map-provider-outlet-prisma";

const prisma = new PrismaClient();
const DEFAULT_BATCH = 500;

function parseArgs(argv: string[]): {
  limit: number | null;
  file: string | undefined;
  batch: number;
} {
  let limit: number | null = null;
  let file: string | undefined;
  let batch = DEFAULT_BATCH;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit" && argv[i + 1]) limit = Number.parseInt(argv[++i], 10);
    else if (a === "--file" && argv[i + 1]) file = argv[++i];
    else if (a === "--batch" && argv[i + 1]) {
      batch = Math.min(Math.max(Number.parseInt(argv[++i], 10), 1), 1000);
    }
  }

  return { limit, file, batch };
}

async function main(): Promise<void> {
  const { limit, file, batch } = parseArgs(process.argv.slice(2));
  const { date, data } = await loadNdisListProviders(file);
  const slice = limit != null && limit > 0 ? data.slice(0, limit) : data;

  console.log(
    `NDIS registry: ${data.length} records in file; seeding ${slice.length}${date ? ` (export date: ${date})` : ""}.`,
  );

  let upserted = 0;

  for (let offset = 0; offset < slice.length; offset += batch) {
    const chunk = slice.slice(offset, offset + batch);
    await prisma.$transaction(
      chunk.map((outlet, i) => {
        const row = mapProviderOutletToPrisma(outlet, offset + i);
        return prisma.providerOutletRegistry.upsert({
          where: { id: row.id },
          create: { ...row, sourceDate: date ?? null },
          update: {
            ...row,
            sourceDate: date ?? null,
          },
        });
      }),
    );
    upserted += chunk.length;
    if (upserted % 5000 === 0 || upserted === slice.length) {
      console.log(`Upserted ${upserted}/${slice.length}`);
    }
  }

  const total = await prisma.providerOutletRegistry.count();
  const active = await prisma.providerOutletRegistry.count({ where: { active: true } });
  console.log(`Done. table total=${total} active=${active}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
