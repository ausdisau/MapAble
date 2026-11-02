/**
 * Deployable staged importer for NDIA directory organisations + outlets.
 *
 * - Preview is the only HTTP mode; staging and publication run from an
 *   explicitly controlled CLI with database credentials.
 * - Immutable snapshot rows are written before publication pointer changes.
 * - Partial/failed imports never become visible as a published snapshot.
 * - No changes to existing ndis_providers or provider_outlets.
 */
import { readFile, stat } from "node:fs/promises";

import type { Prisma } from "@prisma/client";

import {
  normaliseNdisDirectory, sha256Hex, type NdisDirectoryBatch,
} from "@/lib/ingestion/ndis-outlet-import-core";
import { NDIS_LIST_PROVIDERS_URL_WWW, resolveNdisListProvidersPath } from "@/lib/ndis/list-providers-source";
import { prisma } from "@/lib/prisma";

export const NDIS_DIRECTORY_SOURCE_MAX_BYTES = 80 * 1024 * 1024;
const ORG_BATCH_SIZE = 150;
const OUTLET_BATCH_SIZE = 100;
export const PUBLICATION_CODE = "ndia-provider-finder-outlets";
export type DirectorySource =
  | { readonly kind: "bundled" }
  | { readonly kind: "official" }
  | { readonly kind: "file"; readonly filePath: string };

export interface DirectoryImportPreview {
  readonly mode: DirectorySource["kind"];
  readonly sourceUrl: string;
  readonly sourceHash: string;
  readonly sourceBytes: number;
  readonly sourceDate: string | null;
  readonly inputRowCount: number;
  readonly recognisedRowCount: number;
  readonly organisationCount: number;
  readonly outletCount: number;
  readonly rejectedRows: number;
  readonly warningCount: number;
  readonly warningCodes: Readonly<Record<string, number>>;
  readonly meetsQualityGate: boolean;
  readonly isPublished: false;
  readonly registrationStatus: "NOT_VERIFIED";
  readonly workerScreeningStatus: "NOT_VERIFIED";
}

type SourceLoaded = {
  body: string;
  sourceUrl: string;
  mode: DirectorySource["kind"];
};
function assertSize(size: number): void {
  if (!Number.isFinite(size) || size <= 0 || size > NDIS_DIRECTORY_SOURCE_MAX_BYTES) {
    throw new Error("NDIA_FILE_SIZE_INVALID");
  }
}
async function readSourceFile(path: string): Promise<string> {
  const meta = await stat(path);
  if (!meta.isFile()) throw new Error("NDIA_SOURCE_NOT_FILE");
  assertSize(meta.size);
  const body = await readFile(path, "utf8");
  assertSize(Buffer.byteLength(body, "utf8"));
  return body;
}
async function readOfficialSource(): Promise<string> {
  const res = await fetch(NDIS_LIST_PROVIDERS_URL_WWW, {
    method: "GET", redirect: "manual", signal: AbortSignal.timeout(45_000),
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok || res.redirected || res.status !== 200) {
    throw new Error("NDIA_OFFICIAL_SOURCE_UNAVAILABLE");
  }
  const length = Number(res.headers.get("content-length") ?? "0");
  if (length) assertSize(length);
  if (!res.body) throw new Error("NDIA_SOURCE_STREAM_MISSING");
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      assertSize(bytes);
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}
export async function loadDirectorySource(source: DirectorySource): Promise<SourceLoaded> {
  if (source.kind === "official") {
    return { body: await readOfficialSource(),
      sourceUrl: NDIS_LIST_PROVIDERS_URL_WWW, mode: "official" };
  }
  const filePath = source.kind === "file"
    ? source.filePath : resolveNdisListProvidersPath();
  const body = await readSourceFile(filePath);
  return {
    body,
    sourceUrl: source.kind === "file" ? "operator-local-file" : "bundled-mapable-snapshot",
    mode: source.kind,
  };
}
export function parseDirectoryBody(
  loaded: SourceLoaded,
): { preview: DirectoryImportPreview; batch: NdisDirectoryBatch } {
  assertSize(Buffer.byteLength(loaded.body, "utf8"));
  let parsed: unknown;
  try { parsed = JSON.parse(loaded.body) as unknown; }
  catch { throw new Error("NDIA_JSON_INVALID"); }
  const batch = normaliseNdisDirectory(parsed);
  const warningCodes: Record<string, number> = {};
  for (const w of batch.warnings) warningCodes[w.code] = (warningCodes[w.code] ?? 0) + 1;
  const preview: DirectoryImportPreview = {
    mode: loaded.mode,
    sourceUrl: loaded.sourceUrl,
    sourceHash: sha256Hex(loaded.body),
    sourceBytes: Buffer.byteLength(loaded.body, "utf8"),
    sourceDate: batch.sourceDate,
    inputRowCount: batch.inputRowCount,
    recognisedRowCount: batch.recognisedRowCount,
    organisationCount: batch.organisations.length,
    outletCount: batch.outlets.length,
    rejectedRows: batch.rejectedRows,
    warningCount: batch.warnings.length,
    warningCodes, meetsQualityGate: batch.meetsQualityGate,
    isPublished: false,
    registrationStatus: "NOT_VERIFIED",
    workerScreeningStatus: "NOT_VERIFIED",
  };
  return { preview, batch };
}
export async function previewNdisDirectory(source: DirectorySource): Promise<DirectoryImportPreview> {
  return parseDirectoryBody(await loadDirectorySource(source)).preview;
}
export function requireDirectoryWritesEnabled(
  env: Record<string, string | undefined> = process.env,
): void {
  if (env.NDIS_DIRECTORY_IMPORT_WRITES_ENABLED !== "true") {
    throw new Error("NDIA_IMPORT_WRITE_GATE_DISABLED");
  }
}
function assertOperator(operator: string): void {
  if (!/^[a-zA-Z0-9_.@-]{3,120}$/.test(operator)) throw new Error("OPERATOR_INVALID");
}
function chunks<T>(array: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i=0;i<array.length;i+=size) out.push(array.slice(i,i+size));
  return out;
}
export async function stageNdisDirectory(options: {
  source: DirectorySource;
  expectedHash: string;
  operator: string;
}): Promise<{ runId: string; preview: DirectoryImportPreview; status: "staged" }> {
  requireDirectoryWritesEnabled();
  assertOperator(options.operator);
  if (!/^[0-9a-f]{64}$/.test(options.expectedHash)) throw new Error("EXPECTED_HASH_INVALID");
  const { preview, batch } = parseDirectoryBody(await loadDirectorySource(options.source));
  if (preview.sourceHash !== options.expectedHash) throw new Error("SOURCE_HASH_CHANGED");
  if (!preview.meetsQualityGate) throw new Error("NDIA_QUALITY_GATE_FAILED");

  const run = await prisma.ndisDirectoryImportRun.create({
    data: {
      sourceMode: preview.mode, sourceUrl: preview.sourceUrl,
      sourceSha256: preview.sourceHash, sourceDate: preview.sourceDate,
      sourceBytes: preview.sourceBytes, inputRowCount: preview.inputRowCount,
      recognisedRows: preview.recognisedRowCount, rejectedRows: preview.rejectedRows,
      organisationCount: preview.organisationCount, outletCount: preview.outletCount,
      warnings: batch.warnings as unknown as Prisma.InputJsonValue,
      status: "staging", operator: options.operator,
    },
  });
  try {
    // No deletion/updating of other snapshots. Each run is immutable.
    for (const group of chunks(batch.organisations, ORG_BATCH_SIZE)) {
      await prisma.ndisDirectoryOrganisation.createMany({
        data: group.map((o) => ({
          runId: run.id, organisationKey: o.organisationKey,
          name: o.name, abn: o.abn, identityBasis: o.identityBasis,
          registrationGroups: o.registrationGroups,
        })),
        skipDuplicates: true,
      });
    }
    for (const group of chunks(batch.outlets, OUTLET_BATCH_SIZE)) {
      await prisma.ndisDirectoryOutlet.createMany({
        data: group.map((o) => ({
          runId: run.id, outletKey: o.outletKey,
          organisationKey: o.organisationKey,
          outletName: o.outletName, address: o.address,
          headOffice: o.headOffice, suburb: o.suburb, state: o.state,
          postcode: o.postcode, latitude: o.latitude, longitude: o.longitude,
          phone: o.phone, email: o.email, website: o.website, flag: o.flag,
          sourceActiveFlag: o.sourceActiveFlag,
          registrationGroups: o.registrationGroups, professions: o.professions,
          openingHours: o.openingHours, recordHash: o.recordHash,
          raw: o.raw as Prisma.InputJsonValue,
        })),
        skipDuplicates: true,
      });
    }
    const [organisationCount, outletCount] = await Promise.all([
      prisma.ndisDirectoryOrganisation.count({ where: { runId: run.id } }),
      prisma.ndisDirectoryOutlet.count({ where: { runId: run.id } }),
    ]);
    if (organisationCount !== preview.organisationCount || outletCount !== preview.outletCount) {
      throw new Error("NDIA_STAGED_COUNTS_MISMATCH");
    }
    await prisma.ndisDirectoryImportRun.update({
      where: { id: run.id },
      data: { status: "staged", finishedAt: new Date() },
    });
    return { runId: run.id, preview, status: "staged" };
  } catch {
    // Some staging batches can remain; no publication pointer is changed.
    await prisma.ndisDirectoryImportRun.update({
      where: { id: run.id },
      data: { status: "failed", errorCode: "NDIA_STAGE_FAILED", finishedAt: new Date() },
    });
    throw new Error("NDIA_STAGE_FAILED");
  }
}
/**
 * Explicit accountable publication after reviewing complete stage + evidence.
 * Atomic pointer update; can rollback by publishing a previous staged run.
 */
export async function publishNdisDirectory(options: {
  runId: string;
  expectedHash: string;
  expectedCurrentRunId: string; // literal "none" if never published
  operator: string;
  acknowledgeUnknownSourceDate: boolean;
}): Promise<{ runId: string; published: true; previousRunId: string | null }> {
  requireDirectoryWritesEnabled();
  assertOperator(options.operator);
  if (!/^[0-9a-f]{64}$/.test(options.expectedHash) ||
      !/^[0-9a-f-]{36}$/.test(options.runId)) throw new Error("PUBLISH_IDENTIFIERS_INVALID");
  return prisma.$transaction(async (tx) => {
    const run = await tx.ndisDirectoryImportRun.findUnique({ where: { id: options.runId } });
    if (!run || run.status !== "staged" || run.sourceSha256 !== options.expectedHash) {
      throw new Error("NDIA_RUN_NOT_STAGED_OR_HASH_MISMATCH");
    }
    if (!run.sourceDate && !options.acknowledgeUnknownSourceDate) {
      throw new Error("NDIA_SOURCE_DATE_UNKNOWN_ACK_REQUIRED");
    }
    if (run.rejectedRows > Math.floor((run.recognisedRows + run.rejectedRows) * 0.05)) {
      throw new Error("NDIA_QUALITY_GATE_FAILED");
    }
    const old = await tx.ndisDirectoryPublication.findUnique({
      where: { code: PUBLICATION_CODE },
    });
    if ((old?.runId ?? "none") !== options.expectedCurrentRunId) {
      throw new Error("NDIA_PUBLICATION_POINTER_CHANGED");
    }
    await tx.ndisDirectoryPublication.upsert({
      where: { code: PUBLICATION_CODE },
      create: {
        code: PUBLICATION_CODE, runId: run.id,
        publishedBy: options.operator, publishedAt: new Date(),
      },
      update: {
        runId: run.id, publishedBy: options.operator, publishedAt: new Date(),
      },
    });
    return { runId: run.id, published: true as const, previousRunId: old?.runId ?? null };
  }, { isolationLevel: "Serializable", timeout: 30_000 });
}

export async function getPublishedNdisDirectoryStatus(): Promise<{
  runId: string | null; sourceHash: string | null; sourceDate: string | null;
  publishedAt: string | null; outletCount: number | null;
}> {
  const pointer = await prisma.ndisDirectoryPublication.findUnique({
    where: { code: PUBLICATION_CODE }, include: { run: true },
  });
  return {
    runId: pointer?.runId ?? null,
    sourceHash: pointer?.run.sourceSha256 ?? null,
    sourceDate: pointer?.run.sourceDate ?? null,
    publishedAt: pointer?.publishedAt.toISOString() ?? null,
    outletCount: pointer?.run.outletCount ?? null,
  };
}
