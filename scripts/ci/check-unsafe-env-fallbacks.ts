#!/usr/bin/env tsx
/**
 * Detects known-unsafe secret fallback patterns.
 * After productisation security hardening: NDIS encryption must not fall back
 * to NEXTAUTH_SECRET or a hardcoded production-looking default.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const FORBIDDEN_IN_NDIS_CRYPTO = [
  {
    file: "lib/crypto/ndis.ts",
    needles: [
      "mapable-dev-only-key-change-in-production",
      "process.env.NEXTAUTH_SECRET",
      "process.env.SESSION_SECRET",
    ],
  },
];

function walkTs(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walkTs(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function main(): void {
  const errors: string[] = [];

  for (const tracked of FORBIDDEN_IN_NDIS_CRYPTO) {
    const abs = path.join(ROOT, tracked.file);
    if (!fs.existsSync(abs)) continue;
    const text = fs.readFileSync(abs, "utf8");
    for (const needle of tracked.needles) {
      if (text.includes(needle)) {
        errors.push(
          `${tracked.file} contains insecure fallback marker: ${needle}`,
        );
      }
    }
  }

  const encryptionKeys = path.join(ROOT, "lib/security/encryption-keys.ts");
  if (fs.existsSync(encryptionKeys)) {
    const text = fs.readFileSync(encryptionKeys, "utf8");
    for (const needle of [
      "process.env.NEXTAUTH_SECRET",
      "process.env.SESSION_SECRET",
    ]) {
      if (text.includes(needle)) {
        errors.push(
          `lib/security/encryption-keys.ts must not use ${needle} for field encryption`,
        );
      }
    }
  }

  // Fail on empty-string secret coalescing in auth/crypto/env
  const scanRoots = ["lib/auth", "lib/crypto", "lib/security", "lib/env.ts", "lib/config"];
  const files: string[] = [];
  for (const rel of scanRoots) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory())
      walkTs(abs, files);
    else if (fs.existsSync(abs)) files.push(abs);
  }

  const emptySecret =
    /process\.env\.[A-Z0-9_]*(SECRET|KEY|TOKEN)[A-Z0-9_]*\s*\|\|\s*["']["']/;
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (emptySecret.test(text)) {
      errors.push(
        `${path.relative(ROOT, file)} coalesces secret env to empty string`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("Unsafe env fallback check FAILED:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("OK: unsafe env fallback check");
}

main();
