/**
 * Commission register CLI: explicit CSV mapping, dry-run by default.
 * Runs only with human supplied CSV, verified source date and mapping file.
 * NO automatic network fetch; NO automatic activation.
 *
 * pnpm exec tsx scripts/import-commission-register.ts --file /secure/download.csv
 *   --map /secure/mapping.json --as-of 2026-10-30 --source-url <official-url>
 *
 * Write only after --stage flag AND MAPABLE_COMMISSION_CSV_STAGING_ENABLED=true.
 */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  parseCommissionCsv, validateCommissionColumnMap, normaliseCommissionCsv,
} from "@/lib/commission-register/csv";

function argument(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv[i + 1];
}
const official = "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider/download-csv";
const allowedUrl = new URL(official);

async function main() {
  const file = argument("--file");
  const mappingFile = argument("--map");
  const asOf = argument("--as-of");
  const source = argument("--source-url");
  const stage = process.argv.includes("--stage");
  if (!file || !mappingFile || !asOf || !source) {
    throw new Error("Required: --file --map --as-of (YYYY-MM-DD) --source-url (official Commission CSV URL)");
  }
  const u = new URL(source);
  if (u.origin !== allowedUrl.origin || u.pathname !== allowedUrl.pathname ||
      u.search || u.hash || u.protocol !== "https:") {
    throw new Error("Source URL must match the official Commission CSV endpoint exactly");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || new Date(asOf).toISOString().slice(0, 10) !== asOf) {
    throw new Error("Invalid source --as-of date");
  }
  if (new Date(asOf).getTime() > Date.now()) throw new Error("Future source date is not allowed");
  const content = await readFile(file);
  if (content.byteLength > 32 * 1024 * 1024) throw new Error("CSV exceeds 32 MiB staging cap");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(content);
  const rows = parseCommissionCsv(text);
  const mapping = validateCommissionColumnMap(rows[0]!, JSON.parse(await readFile(mappingFile, "utf8")) as unknown);
  const records = normaliseCommissionCsv(rows, mapping);
  const hash = createHash("sha256").update(content).digest("hex");
  console.log(JSON.stringify({
    mode: stage ? "staging_request" : "DRY_RUN_NO_WRITES",
    source, asOf, sha256: hash, columns: rows[0],
    records: records.length, statuses: records.reduce<Record<string,number>>((out,r) => {
      out[r.registrationStatus] = (out[r.registrationStatus] || 0) + 1; return out;
    }, {}),
  }, null, 2));
  if (!stage) return;
  if (process.env.MAPABLE_COMMISSION_CSV_STAGING_ENABLED !== "true") {
    throw new Error("Staging disabled: set MAPABLE_COMMISSION_CSV_STAGING_ENABLED=true after review");
  }
  const exists = await prisma.ndisCommissionRelease.findUnique({ where: { sourceHash: hash } });
  if (exists) throw new Error(`Release already exists (${exists.status}); no duplicate imports`);
  // A fully validated snapshot is inserted transactionally. Not activated or public.
  const releaseId = randomUUID();
  await prisma.ndisCommissionRelease.create({
    data: {
      id: releaseId, sourceUrl: source, sourceHash: hash, sourceAsOf: new Date(asOf),
      headerNames: rows[0]!, columnMap: mapping, rowCount: records.length, status: "staging",
    },
  });
  let stored = 0;
  try {
    for (let i = 0; i < records.length; i += 200) {
      const chunk = records.slice(i, i + 200);
      await prisma.ndisCommissionEntry.createMany({
        data: chunk.map(r => ({
          releaseId,
          rowNumber: r.rowNumber,
          abn: r.abn,
          registrationNumber: r.registrationNumber,
          legalName: r.legalName,
          businessName: r.businessName,
          registrationStatus: r.registrationStatus,
          state: r.state,
          raw: r.raw,
        })),
      });
      stored += chunk.length;
    }
    if (stored !== records.length) throw new Error("Incomplete staging count");
    await prisma.ndisCommissionRelease.update({
      where: { id: releaseId }, data: { status: "validated", validatedAt: new Date() },
    });
    console.log(JSON.stringify({ result: "VALIDATED_NOT_ACTIVE", releaseId, stored }));
  } catch (error) {
    // Preserve a quarantined, incomplete release for forensic review. No public activation.
    console.error(`Staging failed for ${releaseId}; partial rows remain inaccessible`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
