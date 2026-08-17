#!/usr/bin/env tsx
/**
 * Read-only migration inventory / compare helper for owner staging rehearsal.
 *
 * - Never connects to a database.
 * - Never runs SQL writes.
 * - Never accepts production credentials.
 * - Compares repository migration folders against an owner-exported JSON file
 *   of `_prisma_migrations` rows (name + checksum only).
 *
 * Usage:
 *   pnpm exec tsx scripts/ci/compare-prisma-migrations-readonly.ts \
 *     --exported path/to/staging-prisma-migrations.json
 *
 * Export shape (owner-produced, redacted):
 *   [{ "migration_name": "2026...", "checksum": "..." }, ...]
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

type ExportedRow = {
  migration_name: string;
  checksum?: string | null;
};

function repoMigrations(root: string): { name: string; checksum: string }[] {
  const dir = path.join(root, "prisma", "migrations");
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{14}_/.test(d.name))
    .map((d) => d.name)
    .sort();
  return entries.map((name) => {
    const sqlPath = path.join(dir, name, "migration.sql");
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath) : Buffer.from("");
    const checksum = createHash("sha256").update(sql).digest("hex");
    return { name, checksum };
  });
}

function loadExport(filePath: string): ExportedRow[] {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Exported file must be a JSON array");
  }
  return raw.map((row) => {
    const r = row as ExportedRow;
    if (!r?.migration_name || typeof r.migration_name !== "string") {
      throw new Error("Each row requires migration_name");
    }
    return {
      migration_name: r.migration_name,
      checksum: r.checksum ?? null,
    };
  });
}

function main() {
  const args = process.argv.slice(2);
  const exportedIdx = args.indexOf("--exported");
  const exportedPath = exportedIdx >= 0 ? args[exportedIdx + 1] : undefined;

  const root = process.cwd();
  const repo = repoMigrations(root);

  console.log(
    JSON.stringify(
      {
        mode: "read_only",
        databaseConnection: "none",
        repoMigrationCount: repo.length,
        repoMigrations: repo.map((m) => m.name),
      },
      null,
      2,
    ),
  );

  if (!exportedPath) {
    console.error(
      "\nNo --exported file provided. Inventory-only mode complete (NOT a reconciliation).",
    );
    console.error(
      "Owner: export staging `_prisma_migrations` (name+checksum), redact connection strings, then re-run with --exported.",
    );
    process.exit(0);
  }

  const exported = loadExport(exportedPath);
  const repoByName = new Map(repo.map((m) => [m.name, m.checksum]));
  const exportByName = new Map(
    exported.map((m) => [m.migration_name, m.checksum ?? null]),
  );

  const onlyInRepo = repo
    .filter((m) => !exportByName.has(m.name))
    .map((m) => m.name);
  const onlyInExport = exported
    .filter((m) => !repoByName.has(m.migration_name))
    .map((m) => m.migration_name);
  const checksumMismatches = repo
    .filter((m) => {
      const exp = exportByName.get(m.name);
      return exp != null && exp !== m.checksum;
    })
    .map((m) => m.name);

  const report = {
    onlyInRepo,
    onlyInExport,
    checksumMismatches,
    aligned:
      onlyInRepo.length === 0 &&
      onlyInExport.length === 0 &&
      checksumMismatches.length === 0,
  };

  console.log(JSON.stringify({ comparison: report }, null, 2));
  process.exit(report.aligned ? 0 : 1);
}

main();
