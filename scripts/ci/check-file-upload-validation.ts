#!/usr/bin/env tsx
/**
 * Flags upload routes that accept multipart/form-data or buffers without
 * an obvious content-type / size / malware-scan guard.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === "route.ts" || entry.name === "route.tsx") {
      out.push(full);
    }
  }
  return out;
}

function main(): void {
  const routes = walk(path.join(ROOT, "app/api"));
  const errors: string[] = [];

  for (const route of routes) {
    const text = fs.readFileSync(route, "utf8");
    const looksUpload =
      /formData\(|multipart|arrayBuffer\(\)|upload|createWriteStream/i.test(
        text,
      );
    if (!looksUpload) continue;

    const hasValidation =
      /contentType|mime|file\.type|MAX_.*SIZE|maxBytes|fileSize|magic|malware|scanUpload|allowedTypes|ALLOWED_/i.test(
        text,
      );

    if (!hasValidation) {
      errors.push(
        `${path.relative(ROOT, route)} — upload-like handler without obvious validation markers`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("File upload validation check FAILED:");
    for (const e of errors.slice(0, 30)) console.error(`  - ${e}`);
    if (errors.length > 30) {
      console.error(`  … and ${errors.length - 30} more`);
    }
    // PR 1: report but do not fail the whole security suite on legacy debt.
    // Set STRICT_UPLOAD_CHECKS=1 to fail closed (later PRs).
    if (process.env.STRICT_UPLOAD_CHECKS === "1") {
      process.exit(1);
    }
    console.warn(
      `WARN: ${errors.length} upload routes need hardening (non-strict mode)`,
    );
    process.exit(0);
  }

  console.log("OK: file upload validation markers present where applicable");
}

main();
