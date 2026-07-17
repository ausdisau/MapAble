#!/usr/bin/env tsx
/**
 * Migration integrity:
 * - reject duplicate timestamps
 * - reject db push references in production runbooks
 * - when BASE_SHA is set, reject edits to historical migration.sql bodies
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "prisma", "migrations");

const PRODUCTION_RUNBOOK_GLOBS = [
  "docs/operations",
  "docs/PRODUCTION_CLAIMS.md",
  "docs/RELEASE_PROCESS.md",
  "README.md",
];

function listMigrationDirs(): string[] {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function checkDuplicateTimestamps(dirs: string[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, string>();
  for (const name of dirs) {
    const ts = name.slice(0, 14);
    if (!/^\d{14}$/.test(ts)) {
      errors.push(`Folder missing 14-digit timestamp: ${name}`);
      continue;
    }
    if (seen.has(ts)) {
      errors.push(`Duplicate timestamp ${ts}: ${seen.get(ts)} and ${name}`);
    } else {
      seen.set(ts, name);
    }
  }
  return errors;
}

function walkMarkdown(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, files);
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function checkDbPushInProductionRunbooks(): string[] {
  const errors: string[] = [];
  const files: string[] = [];
  for (const rel of PRODUCTION_RUNBOOK_GLOBS) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      walkMarkdown(abs, files);
    } else if (fs.existsSync(abs)) {
      files.push(abs);
    }
  }

  // High-risk: instructions that tell operators to db push against production
  const dangerous = /prisma\s+db\s+push|npx\s+prisma\s+db\s+push/i;
  const productionContext =
    /production|prod\b|live\b|migrate deploy|go-live|preflight/i;

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (!dangerous.test(text)) continue;
    // Allow explicit "do not use db push in production" warnings
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!dangerous.test(line)) continue;
      const window = lines.slice(Math.max(0, i - 2), i + 3).join(" ");
      if (
        /do not|never|avoid|not\s+rely|warn/i.test(window) &&
        /db\s+push/i.test(window)
      ) {
        continue;
      }
      if (productionContext.test(window) || productionContext.test(file)) {
        errors.push(
          `${path.relative(ROOT, file)}:${i + 1} references db push in a production-adjacent runbook`,
        );
      }
    }
  }
  return errors;
}

function loadAllowedRepairs(): Set<string> {
  const allowPath = path.join(
    ROOT,
    "scripts",
    "ci",
    "allowed-migration-repairs.json",
  );
  if (!fs.existsSync(allowPath)) return new Set();
  try {
    const raw = JSON.parse(fs.readFileSync(allowPath, "utf8")) as {
      repairs?: Array<{ path: string }>;
    };
    return new Set((raw.repairs ?? []).map((r) => r.path.replace(/\\/g, "/")));
  } catch {
    return new Set();
  }
}

function checkHistoricalMigrationEdits(): string[] {
  const base = process.env.BASE_SHA || process.env.GITHUB_BASE_SHA;
  if (!base) {
    console.log(
      "SKIP historical edit check: BASE_SHA / GITHUB_BASE_SHA not set",
    );
    return [];
  }

  const allowed = loadAllowedRepairs();
  const errors: string[] = [];
  try {
    const diff = execSync(
      `git diff --name-only ${base}...HEAD -- prisma/migrations`,
      { encoding: "utf8" },
    )
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const file of diff) {
      if (!file.endsWith("migration.sql")) continue;
      const normalized = file.replace(/\\/g, "/");
      if (allowed.has(normalized)) {
        console.log(`ALLOW listed historical repair: ${normalized}`);
        continue;
      }
      // Renames of folders are OK if SQL content unchanged; detect content edits
      try {
        const contentDiff = execSync(`git diff ${base}...HEAD -- ${file}`, {
          encoding: "utf8",
        });
        // If file is new under a renamed path, compare is empty against old — allow rename-only
        if (!contentDiff.trim()) continue;
        // Allow brand-new migrations (Added files under new timestamp)
        const status = execSync(
          `git diff --name-status ${base}...HEAD -- ${file}`,
          {
            encoding: "utf8",
          },
        ).trim();
        if (status.startsWith("A")) continue;
        if (status.startsWith("R")) {
          // rename: ensure patch has no line changes beyond rename
          const patch = execSync(`git diff -M ${base}...HEAD -- ${file}`, {
            encoding: "utf8",
          });
          if (
            /^\+[^+]|^-[^-]/m.test(
              patch.replace(/^diff.*\n|^index.*\n|^---.*\n|^\+\+\+.*\n/gm, ""),
            )
          ) {
            // If only rename, git often shows rename with similarity; reject body edits
            if (patch.includes("\n+") || patch.includes("\n-")) {
              const bodyLines = patch
                .split("\n")
                .filter(
                  (l) =>
                    (l.startsWith("+") || l.startsWith("-")) &&
                    !l.startsWith("+++") &&
                    !l.startsWith("---"),
                );
              if (bodyLines.length > 0) {
                errors.push(`Historical migration SQL edited: ${file}`);
              }
            }
          }
          continue;
        }
        if (status.startsWith("M")) {
          errors.push(`Historical migration SQL modified: ${file}`);
        }
      } catch {
        // file may be rename target; ignore
      }
    }
  } catch (err) {
    console.warn(
      "WARN: could not compute migration diff against BASE_SHA:",
      err instanceof Error ? err.message : err,
    );
  }
  return errors;
}

function main(): void {
  const dirs = listMigrationDirs();
  const errors = [
    ...checkDuplicateTimestamps(dirs),
    ...checkDbPushInProductionRunbooks(),
    ...checkHistoricalMigrationEdits(),
  ];

  if (errors.length > 0) {
    console.error("Migration integrity check FAILED:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `OK: migration integrity (${dirs.length} dirs, no duplicate timestamps)`,
  );
}

main();
