#!/usr/bin/env npx tsx
/**
 * Operator-only, staged NDIS Provider Finder organisation/outlet importer.
 * Preview is default. The write gate and exact SHA confirmation are required
 * to stage; a separate explicit confirmation is needed to publish.
 *
 * This runs in a controlled Node job, NOT an unauthenticated Next.js route.
 */
import { config } from "dotenv";

config();

import {
  getPublishedNdisDirectoryStatus,
  previewNdisDirectory,
  publishNdisDirectory,
  stageNdisDirectory,
  type DirectorySource,
} from "@/lib/ingestion/ndis-outlet-import-service";

function argument(key: string): string | null {
  const args = process.argv.slice(2);
  const i = args.indexOf("--" + key);
  return i >= 0 ? (args[i + 1] ?? "") : null;
}
function present(key: string): boolean {
  return process.argv.includes("--" + key);
}
function required(key: string): string {
  const value = argument(key);
  if (!value?.trim() || value.startsWith("--")) {
    throw new Error("REQUIRED_ARGUMENT_MISSING:" + key);
  }
  return value.trim();
}
function readSource(): DirectorySource {
  const mode = argument("source") ?? "bundled";
  if (mode === "bundled") return { kind: "bundled" };
  if (mode === "official") return { kind: "official" };
  if (mode === "file") return { kind: "file", filePath: required("file") };
  throw new Error("INVALID_SOURCE; choose bundled, official or file");
}
function operator(): string {
  return argument("operator") ??
    process.env.NDIS_DIRECTORY_IMPORT_OPERATOR ??
    "unspecified";
}
async function main(): Promise<void> {
  const mode = argument("mode") ?? "preview";
  if (mode === "preview") {
    const preview = await previewNdisDirectory(readSource());
    console.log(JSON.stringify({ mode, ...preview }, null, 2));
    if (!preview.meetsQualityGate) process.exitCode = 2;
    return;
  }
  if (mode === "stage") {
    const result = await stageNdisDirectory({
      source: readSource(), expectedHash: required("expected-hash"),
      operator: operator(),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (mode === "status") {
    const result = await getPublishedNdisDirectoryStatus();
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (mode === "publish") {
    if (!present("confirm-publish")) {
      throw new Error("PUBLISH_REQUIRES_EXPLICIT_CONFIRMATION");
    }
    const result = await publishNdisDirectory({
      runId: required("run-id"), expectedHash: required("expected-hash"),
      expectedCurrentRunId: required("expected-current-run-id"),
      operator: operator(),
      acknowledgeUnknownSourceDate: present("acknowledge-unknown-date"),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  throw new Error("INVALID_MODE; choose preview, stage, status or publish");
}
main().catch((error: unknown) => {
  // Preserve a stable code, never print raw provider records or DB credentials.
  console.error(error instanceof Error ? error.message : "NDIA_IMPORT_UNKNOWN_ERROR");
  process.exitCode = 1;
});
