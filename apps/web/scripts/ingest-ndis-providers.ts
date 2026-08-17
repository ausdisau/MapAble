#!/usr/bin/env npx tsx
/**
 * Ingest NDIS provider finder JSON into ndis_providers.
 * See README-ingestion.md
 */
import { config } from "dotenv";

config();

import { runNdisProviderIngestion } from "@/lib/ingestion/ndis-providers";

async function main(): Promise<void> {
  const result = await runNdisProviderIngestion();

  if (result.dryRun) {
    console.log("DRY_RUN — no database writes");
    console.log("raw record count:", result.rawRecordCount ?? result.providerCount);
    console.log("normalised provider count:", result.providerCount);
    if (result.rawFieldKeys?.length) {
      console.log("raw field keys:", result.rawFieldKeys.join(", "));
    }
    if (result.sample) {
      console.log("sample normalised provider:", JSON.stringify(result.sample, null, 2));
    }
    process.exit(result.ok ? 0 : 1);
  }

  if (!result.ok) {
    console.error(result.error ?? "Ingestion failed");
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        providerCount: result.providerCount,
        runId: result.runId,
        sourceUrl: result.sourceUrl,
        durationMs: result.durationMs,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
