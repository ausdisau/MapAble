#!/usr/bin/env npx tsx
/**
 * Import NDIS provider outlets from public/data/provider-outlets.json into Supabase.
 *
 * Prerequisites:
 * 1. Apply migration: supabase db push  OR  psql $DATABASE_URL -f supabase/migrations/20260604120000_provider_outlets.sql
 * 2. SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   pnpm import:provider-outlets-supabase
 *   pnpm import:provider-outlets-supabase -- --limit 100 --dry-run
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { mapProviderOutletToDbRow } from "@/lib/supabase/map-provider-outlet-row";

const DEFAULT_BATCH = 200;
const JSON_PATH = join(process.cwd(), "public", "data", "provider-outlets.json");

type OutletFile = { date?: string; data: ProviderOutlet[] };

function parseArgs(argv: string[]): { limit: number | null; dryRun: boolean; batch: number } {
  let limit: number | null = null;
  let dryRun = false;
  let batch = DEFAULT_BATCH;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    else if (a === "--limit" && argv[i + 1]) {
      limit = Number.parseInt(argv[++i], 10);
    } else if (a === "--batch" && argv[i + 1]) {
      batch = Number.parseInt(argv[++i], 10);
    }
  }

  return { limit, dryRun, batch: Math.min(Math.max(batch, 1), 500) };
}

async function loadOutlets(): Promise<ProviderOutlet[]> {
  const raw = await readFile(JSON_PATH, "utf8");
  const parsed = JSON.parse(raw) as OutletFile;
  if (!Array.isArray(parsed.data)) {
    throw new Error("provider-outlets.json: expected { data: ProviderOutlet[] }");
  }
  return parsed.data;
}

async function main(): Promise<void> {
  const { limit, dryRun, batch } = parseArgs(process.argv.slice(2));

  const outlets = await loadOutlets();
  const slice = limit != null && limit > 0 ? outlets.slice(0, limit) : outlets;

  console.log(
    `Loaded ${outlets.length} outlets; importing ${slice.length}${dryRun ? " (dry-run)" : ""}.`,
  );

  if (dryRun) {
    const sample = mapProviderOutletToDbRow(slice[0]!, 0);
    console.log("Sample row:", JSON.stringify(sample, null, 2).slice(0, 800));
    return;
  }

  const supabase = getSupabaseAdmin();
  let imported = 0;
  let errors = 0;

  for (let offset = 0; offset < slice.length; offset += batch) {
    const chunk = slice.slice(offset, offset + batch);
    const rows = chunk.map((o, i) => mapProviderOutletToDbRow(o, offset + i));

    const { error } = await supabase.from("provider_outlets").upsert(rows, {
      onConflict: "id",
    });

    if (error) {
      console.error(`Batch ${offset}-${offset + chunk.length} failed:`, error.message);
      errors += chunk.length;
      continue;
    }

    imported += chunk.length;
    if (imported % 2000 === 0 || imported === slice.length) {
      console.log(`Upserted ${imported}/${slice.length}`);
    }
  }

  const { count, error: countError } = await supabase
    .from("provider_outlets")
    .select("id", { count: "exact", head: true });

  if (countError) {
    console.warn("Count check failed:", countError.message);
  } else {
    console.log(`Table row count (head): ${count ?? "unknown"}`);
  }

  console.log(`Done. imported=${imported} errors=${errors}`);
  if (errors > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
