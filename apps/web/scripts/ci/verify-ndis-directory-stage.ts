/**
 * Synthetic database integration test. Only ever run against local disposable
 * Postgres in GitHub Actions; cannot run against remote or production.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  getPublishedNdisDirectoryStatus, parseDirectoryBody, publishNdisDirectory,
  stageNdisDirectory,
} from "@/lib/ingestion/ndis-outlet-import-service";
import { searchPublishedNdisDirectory } from "@/lib/ndis/published-directory-read";
import { prisma } from "@/lib/prisma";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  if (process.env.NDIS_DIRECTORY_CI_SYNTHETIC_ONLY !== "true" ||
      process.env.CI !== "true" ||
      !/localhost:5432\/mapable_ndia_ci/.test(url)) {
    throw new Error("SYNTHETIC_EPHEMERAL_DB_REQUIRED");
  }
  const filePath = join(process.cwd(), "tests", "fixtures", "ndis-directory-versioned-small.json");
  const body = await readFile(filePath, "utf8");
  const preview = parseDirectoryBody({
    body, mode: "file", sourceUrl: "operator-local-file",
  }).preview;
  if (!preview.meetsQualityGate || preview.organisationCount !== 2 ||
      preview.outletCount !== 3) throw new Error("SYNTHETIC_PREVIEW_FAILED");

  const run = await stageNdisDirectory({
    source: { kind: "file", filePath },
    expectedHash: preview.sourceHash,
    operator: "ci-test-bot",
  });
  if (run.status !== "staged" || run.preview.sourceHash !== preview.sourceHash) {
    throw new Error("SYNTHETIC_STAGE_FAILED");
  }
  const before = await getPublishedNdisDirectoryStatus();
  if (before.runId !== null) throw new Error("PUBLISHED_BEFORE_APPROVAL");

  let wrongHashBlocked = false;
  try {
    await publishNdisDirectory({
      runId: run.runId,
      expectedHash: "0".repeat(64),
      expectedCurrentRunId: "none",
      operator: "ci-test-bot",
      acknowledgeUnknownSourceDate: false,
    });
  } catch { wrongHashBlocked = true; }
  if (!wrongHashBlocked) throw new Error("BAD_HASH_NOT_BLOCKED");

  const published = await publishNdisDirectory({
    runId: run.runId, expectedHash: preview.sourceHash,
    expectedCurrentRunId: "none", operator: "ci-test-bot",
    acknowledgeUnknownSourceDate: false,
  });
  if (!published.published) throw new Error("PUBLISH_FAILED");
  const after = await getPublishedNdisDirectoryStatus();
  if (after.runId !== run.runId || after.outletCount !== 3) {
    throw new Error("PUBLISHED_COUNTS_INCORRECT");
  }
  const rows = await prisma.ndisDirectoryOutlet.findMany({
    where: { runId: run.runId },
  });
  if (rows.length !== 3 ||
      rows.some(x=>x.raw === null || x.outletKey.length < 10)) {
    throw new Error("PERSISTED_DATA_INVALID");
  }
  const qaView = await searchPublishedNdisDirectory({ state: "NSW", limit: 15 });
  if (!qaView || qaView.totalReturned !== 2 ||
      qaView.registration !== "NOT_INDEPENDENTLY_VERIFIED" ||
      qaView.workerScreening !== "NOT_INDEPENDENTLY_VERIFIED" ||
      qaView.listings.some((x) => x.outletName.length === 0)) {
    throw new Error("PUBLISHED_READ_PROJECTION_FAILED");
  }
  let stalePointerBlocked = false;
  try {
    await publishNdisDirectory({
      runId: run.runId, expectedHash: preview.sourceHash,
      expectedCurrentRunId: "none", operator: "ci-test-bot",
      acknowledgeUnknownSourceDate: false,
    });
  } catch { stalePointerBlocked = true; }
  if (!stalePointerBlocked) throw new Error("STALE_PUBLICATION_NOT_BLOCKED");
  console.log(JSON.stringify({
    ok: true, publishedRunId: run.runId, organisations: 2, outlets: rows.length,
    assertions: ["source_hash","staging","no_early_publish","wrong_hash_block",
      "human_publish","versioned_rows","stale_pointer_block"],
  }));
}
main().catch((e:unknown) => {
  console.error(e instanceof Error ? e.message : "SYNTHETIC_TEST_FAILURE");
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
