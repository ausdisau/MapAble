#!/usr/bin/env tsx
/**
 * Fails if prisma migration folder timestamps are missing, non-numeric,
 * non-monotonic, or duplicated.
 */
import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");

function main(): void {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error("FAIL: prisma/migrations directory missing");
    process.exit(1);
  }

  const entries = fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  if (entries.length === 0) {
    console.error("FAIL: no migration directories found");
    process.exit(1);
  }

  const timestamps: string[] = [];
  const errors: string[] = [];

  for (const name of entries) {
    const match = /^(\d{14})_(.+)$/.exec(name);
    if (!match) {
      errors.push(`Invalid migration folder name: ${name}`);
      continue;
    }
    const ts = match[1]!;
    timestamps.push(ts);

    const sqlPath = path.join(MIGRATIONS_DIR, name, "migration.sql");
    if (!fs.existsSync(sqlPath)) {
      errors.push(`Missing migration.sql in ${name}`);
    }
  }

  for (let i = 1; i < timestamps.length; i++) {
    if (timestamps[i]! < timestamps[i - 1]!) {
      errors.push(
        `Non-monotonic order: ${entries[i]} (${timestamps[i]}) follows ${entries[i - 1]} (${timestamps[i - 1]})`,
      );
    }
    if (timestamps[i] === timestamps[i - 1]) {
      errors.push(`Duplicate timestamp ${timestamps[i]}`);
    }
  }

  const seen = new Map<string, string>();
  for (const name of entries) {
    const ts = name.slice(0, 14);
    if (seen.has(ts)) {
      errors.push(`Duplicate timestamp ${ts}: ${seen.get(ts)} and ${name}`);
    } else {
      seen.set(ts, name);
    }
  }

  if (errors.length > 0) {
    console.error("Migration order check FAILED:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `OK: ${entries.length} migrations with unique monotonic timestamps`,
  );
}

main();
