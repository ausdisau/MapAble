#!/usr/bin/env tsx
/**
 * Changed-domain ownership heuristic.
 * Flags PRs that *introduce* foreign domain aggregate writes in non-owner packages.
 * Pre-existing write sites (e.g. only touched by import-order lint) are not failed.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const OWNERSHIP: Array<{
  ownerPrefixes: string[];
  foreignWriteHints: RegExp[];
  domain: string;
}> = [
  {
    domain: "billing",
    ownerPrefixes: [
      "lib/billing/",
      "lib/billing/core/",
      "lib/invoices/",
      "app/api/billing/",
      "app/api/invoices/",
      "prisma/",
    ],
    foreignWriteHints: [
      /BillingInvoice|prisma\.billingInvoice|prisma\.invoice\./i,
    ],
  },
  {
    domain: "transport",
    ownerPrefixes: [
      "lib/transport/",
      "lib/transport/routing/",
      "app/api/transport/",
      "app/api/driver/",
      "prisma/",
    ],
    foreignWriteHints: [
      /TransportTrip|prisma\.transportTrip|TransportBooking/i,
    ],
  },
  {
    domain: "consent",
    ownerPrefixes: [
      "lib/consent/",
      "app/api/consent/",
      "app/api/consents/",
      "prisma/",
    ],
    foreignWriteHints: [/ConsentRecord|prisma\.consentRecord/i],
  },
  {
    domain: "care",
    ownerPrefixes: ["lib/care/", "app/api/care/", "prisma/"],
    foreignWriteHints: [
      /CareBooking|CareRequest|prisma\.careBooking|prisma\.careRequest/i,
    ],
  },
];

/** Known cross-domain orchestration / adapter packages (documented, not new SoTs). */
const CROSS_DOMAIN_ALLOWLIST = [
  "lib/orchestration/",
  "lib/matching/",
  "lib/ai/matching/",
  "lib/ai/platform/",
  "lib/platform/mission-portfolio/",
  "lib/ai/mission-copilot/",
  "lib/ai/case-copilot/",
  "lib/programmes/",
  "lib/payouts/",
  "lib/research/national-insights/",
  "lib/ndis/",
  "lib/support/coordinator/",
  "lib/bookings/graph/",
  "lib/bookings/",
];

function isOwner(file: string, ownerPrefixes: string[]): boolean {
  return ownerPrefixes.some(
    (p) => file === p || file.startsWith(p) || file.startsWith("./" + p),
  );
}

function isAllowlisted(file: string): boolean {
  return CROSS_DOMAIN_ALLOWLIST.some((p) => file.startsWith(p));
}

function changedFiles(base: string): string[] {
  try {
    return execSync(`git diff --name-only ${base}...HEAD`, { encoding: "utf8" })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function addedDiffLines(base: string, file: string): string {
  try {
    const patch = execSync(`git diff ${base}...HEAD -- ${file}`, {
      encoding: "utf8",
    });
    return patch
      .split("\n")
      .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
      .map((l) => l.slice(1))
      .join("\n");
  } catch {
    return "";
  }
}

function main(): void {
  const ownershipDoc = path.join(
    ROOT,
    "docs",
    "remediation",
    "DOMAIN_OWNERSHIP.md",
  );
  if (!fs.existsSync(ownershipDoc)) {
    console.error("FAIL: docs/remediation/DOMAIN_OWNERSHIP.md missing");
    process.exit(1);
  }

  const base =
    process.env.BASE_SHA ||
    process.env.GITHUB_BASE_SHA ||
    process.env.GITHUB_EVENT_BEFORE;

  if (!base || base === "0000000000000000000000000000000000000000") {
    console.log(
      "OK: DOMAIN_OWNERSHIP.md present (skip changed-file scan: no BASE_SHA)",
    );
    process.exit(0);
  }

  const files = changedFiles(base).filter(
    (f) =>
      (f.startsWith("lib/") || f.startsWith("app/api/")) &&
      (f.endsWith(".ts") || f.endsWith(".tsx")),
  );

  const errors: string[] = [];

  for (const file of files) {
    if (isAllowlisted(file)) continue;

    const added = addedDiffLines(base, file);
    if (!added.trim()) continue;

    const writes =
      /\.create\(|\.update\(|\.upsert\(|\.delete\(|\.createMany\(|\.updateMany\(/;
    if (!writes.test(added)) continue;

    for (const rule of OWNERSHIP) {
      if (isOwner(file, rule.ownerPrefixes)) continue;
      if (rule.foreignWriteHints.some((re) => re.test(added))) {
        errors.push(
          `${file} introduces ${rule.domain} aggregate writes outside owner packages (${rule.ownerPrefixes.join(", ")})`,
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error("Domain ownership check FAILED:");
    for (const e of errors) console.error(`  - ${e}`);
    console.error(
      "See docs/remediation/DOMAIN_OWNERSHIP.md — mutate via declared service boundaries only.",
    );
    process.exit(1);
  }

  console.log(
    `OK: domain ownership (${files.length} changed lib/api files; only new write hunks checked)`,
  );
}

main();
