#!/usr/bin/env tsx
/**
 * Changed-domain ownership heuristic.
 * Flags PRs that mutate foreign domain aggregates from non-owner packages.
 * When no BASE_SHA is available, validates the ownership map file exists.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** Owner package prefix → aggregate keywords that only the owner should write. */
const OWNERSHIP: Array<{
  ownerPrefixes: string[];
  foreignWriteHints: RegExp[];
  domain: string;
}> = [
  {
    domain: "billing",
    ownerPrefixes: [
      "lib/billing/",
      "lib/billing-core/",
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
      "lib/transport-routing/",
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

function isOwner(file: string, ownerPrefixes: string[]): boolean {
  return ownerPrefixes.some(
    (p) => file === p || file.startsWith(p) || file.startsWith("./" + p),
  );
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

  if (!base) {
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
    let content = "";
    try {
      content = fs.readFileSync(path.join(ROOT, file), "utf8");
    } catch {
      continue;
    }

    // Only flag write-like Prisma calls in non-owner packages
    const writes =
      /\.create\(|\.update\(|\.upsert\(|\.delete\(|\.createMany\(|\.updateMany\(/;
    if (!writes.test(content)) continue;

    for (const rule of OWNERSHIP) {
      if (isOwner(file, rule.ownerPrefixes)) continue;
      if (rule.foreignWriteHints.some((re) => re.test(content))) {
        errors.push(
          `${file} appears to mutate ${rule.domain} aggregates outside owner packages (${rule.ownerPrefixes.join(", ")})`,
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
    `OK: domain ownership (${files.length} changed lib/api files scanned)`,
  );
}

main();
