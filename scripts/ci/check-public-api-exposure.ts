#!/usr/bin/env tsx
/**
 * Flags public (unauthenticated marketing/core) pages that appear to render
 * participant-identifiable fields.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const PUBLIC_DIRS = ["app/(core)", "app/(marketing)"];

const SENSITIVE_FIELD_HINTS =
  /ndisParticipantNumber|ndisNumber|dateOfBirth|exactAddress|streetAddress|medicareNumber|passportNumber/i;

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function main(): void {
  const errors: string[] = [];
  for (const rel of PUBLIC_DIRS) {
    for (const file of walk(path.join(ROOT, rel))) {
      const text = fs.readFileSync(file, "utf8");
      if (SENSITIVE_FIELD_HINTS.test(text)) {
        errors.push(
          `${path.relative(ROOT, file)} references participant-sensitive field names on a public surface`,
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error("Public API data-exposure check FAILED:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("OK: public surface sensitive-field scan");
}

main();
