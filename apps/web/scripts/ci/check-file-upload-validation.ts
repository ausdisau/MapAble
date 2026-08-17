#!/usr/bin/env tsx
/**
 * Flags upload routes that accept multipart/form-data or buffers without
 * an obvious content-type / size / malware-scan guard.
 *
 * Heuristic requires an actual upload API call (formData / multipart parse /
 * arrayBuffer / createWriteStream). Mere presence of the word "upload" in a
 * message or config field (e.g. maxUploadMb, "Upload NDIA CSV manually") is
 * not treated as an upload handler.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** Documented non-upload routes that previously false-positive'd on the word "upload". */
const DOCUMENTED_NON_UPLOAD_EXCLUSIONS = new Set([
  // Mentions manual NDIA portal upload in a response message only.
  "app/api/ndis/claim-batches/[id]/export/route.ts",
  // Returns maxUploadMb config in a health JSON payload; no request body upload.
  "app/api/system/storage-health/route.ts",
]);

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

function looksLikeUploadHandler(text: string): boolean {
  // Require real upload APIs — not the substring "upload" alone.
  return (
    /\.formData\s*\(/.test(text) ||
    /multipart\/form-data/i.test(text) ||
    /\.arrayBuffer\s*\(/.test(text) ||
    /createWriteStream\s*\(/.test(text) ||
    /formidable|busboy|multer/i.test(text)
  );
}

function main(): void {
  const routes = walk(path.join(ROOT, "app/api"));
  const warnings: string[] = [];

  for (const route of routes) {
    const rel = path.relative(ROOT, route);
    if (DOCUMENTED_NON_UPLOAD_EXCLUSIONS.has(rel)) continue;

    const text = fs.readFileSync(route, "utf8");
    if (!looksLikeUploadHandler(text)) continue;

    const hasValidation =
      /contentType|mime|file\.type|MAX_.*SIZE|maxBytes|fileSize|magic|malware|scanUpload|allowedTypes|ALLOWED_/i.test(
        text,
      );

    if (!hasValidation) {
      warnings.push(
        `${rel} — upload-like handler without obvious validation markers`,
      );
    }
  }

  if (warnings.length > 0) {
    const strict = process.env.STRICT_UPLOAD_CHECKS === "1";
    const label = strict ? "FAILED" : "WARN";
    console.error(`File upload validation check ${label}:`);
    for (const e of warnings.slice(0, 30)) console.error(`  - ${e}`);
    if (warnings.length > 30) {
      console.error(`  … and ${warnings.length - 30} more`);
    }
    if (strict) {
      process.exit(1);
    }
    console.warn(
      `WARN: ${warnings.length} upload routes need hardening (advisory/non-strict mode)`,
    );
    process.exit(0);
  }

  console.log("OK: file upload validation markers present where applicable");
}

main();
