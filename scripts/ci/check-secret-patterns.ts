#!/usr/bin/env tsx
/**
 * Lightweight secret pattern scan for tracked source (not a replacement for gitleaks).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "public",
  "tmp",
  "data",
]);

const PATTERNS: Array<{ re: RegExp; label: string }> = [
  {
    re: /-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/,
    label: "private key block",
  },
  { re: /AKIA[0-9A-Z]{16}/, label: "AWS access key id" },
  { re: /ghp_[A-Za-z0-9]{36}/, label: "GitHub PAT" },
  { re: /xox[baprs]-[A-Za-z0-9-]{10,}/, label: "Slack token" },
  {
    re: /sk_live_[A-Za-z0-9]{20,}/,
    label: "Stripe live secret",
  },
];

const ALLOW_PATH_SNIPPETS = [
  ".env.example",
  "docs/",
  "tests/",
  "scripts/ci/check-secret-patterns.ts",
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|json|yml|yaml|md|env)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function main(): void {
  const errors: string[] = [];
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file);
    if (ALLOW_PATH_SNIPPETS.some((s) => rel.includes(s))) continue;
    let text = "";
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (text.length > 1_500_000) continue;
    for (const { re, label } of PATTERNS) {
      if (re.test(text)) {
        errors.push(`${rel} — possible ${label}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("Secret pattern scan FAILED:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("OK: secret pattern scan");
}

main();
