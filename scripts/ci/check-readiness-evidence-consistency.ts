#!/usr/bin/env tsx
/**
 * Fails when remediation readiness documents contradict themselves or claim
 * production readiness without evidence / owner-action status.
 *
 * Does not contact production systems. Missing evidence must stay NOT_RUN /
 * OWNER_ACTION_REQUIRED / BLOCKED — never a silent pass.
 */
import fs from "node:fs";
import path from "node:path";

import { assertNoProductionClaimsWithoutEvidence } from "../../lib/convergence-os/seed/public-claims";

const ROOT = process.cwd();
const errors: string[] = [];

const VALID_STATUSES = [
  "VERIFIED",
  "FAILED",
  "NOT_RUN",
  "OWNER_ACTION_REQUIRED",
  "BLOCKED",
  "NOT_APPLICABLE",
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel));
}

function push(msg: string): void {
  errors.push(msg);
}

function assertRequiredFiles(): void {
  for (const rel of [
    "docs/remediation/CURRENT_STATE.md",
    "docs/remediation/RISK_REGISTER.md",
    "docs/remediation/FEATURE_FREEZE.md",
    "docs/remediation/MIGRATE_FROM_ZERO_BLOCKER.md",
    "docs/remediation/MIGRATE_FROM_ZERO_REPAIR.md",
    "docs/remediation/PRODUCTION_READINESS_EVIDENCE_LEDGER.md",
    "docs/remediation/RESCAN_RECONCILIATION.md",
    "docs/remediation/PR_ACTION_LEDGER.md",
    "docs/remediation/CAPABILITY_INVENTORY.md",
  ]) {
    if (!exists(rel)) push(`Missing required readiness artefact: ${rel}`);
  }
}

/** Empty-DB migrate-from-zero must not be simultaneously green and the active blocker. */
function assertMigrateFromZeroConsistency(): void {
  const current = read("docs/remediation/CURRENT_STATE.md");
  const blocker = read("docs/remediation/MIGRATE_FROM_ZERO_BLOCKER.md");
  const repair = read("docs/remediation/MIGRATE_FROM_ZERO_REPAIR.md");
  const risk = read("docs/remediation/RISK_REGISTER.md");
  const delivery = exists("docs/programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md")
    ? read("docs/programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md")
    : "";

  const greenSignals = [
    /Empty-DB status:\s*\*\*`VERIFIED` green\*\*/i,
    /migrate-from-zero[^\n]{0,80}`VERIFIED` green/i,
    /\*\*`VERIFIED` green\*\* on `origin\/main` after PR \*\*#381\*\*/i,
    /Empty-database status:\s*\*\*`VERIFIED` green\*\*/i,
  ];
  const activeBlockerSignals = [
    /Hard-fail CI; P3018 at `20260525000000_mapable_access_phase_1`/i,
    /Migration-from-zero on disposable PostgreSQL\s*\|\s*\*\*Fail\*\*/i,
    /product waves blocked by migrate-from-zero/i,
    /\|\s*R24\s*\|[^\n]*Migrate-from-zero P3018[^\n]*\|\s*verified \(hard CI fail\)/i,
  ];

  const corpus = [current, blocker, repair, risk, delivery].join("\n");
  const hasGreen = greenSignals.some((re) => re.test(corpus));
  const hasActiveBlocker = activeBlockerSignals.some((re) => re.test(corpus));

  if (hasGreen && hasActiveBlocker) {
    push(
      "Migrate-from-zero marked green and still listed as active empty-DB / P3018 blocker across readiness docs",
    );
  }

  if (!/VERIFIED` green/i.test(blocker) && !/`VERIFIED` green/i.test(blocker)) {
    // Blocker file must acknowledge empty-DB green after #381
    if (!/Empty-database status:\s*\*\*`VERIFIED` green\*\*/i.test(blocker)) {
      push(
        "MIGRATE_FROM_ZERO_BLOCKER.md must record empty-database status as VERIFIED green after #381",
      );
    }
  }

  // R24 must not remain an active verified hard-fail empty-DB risk
  if (
    /\|\s*R24\s*\|[^\n]*Migrate-from-zero P3018[^\n]*\|\s*verified \(hard CI fail\)/i.test(
      risk,
    )
  ) {
    push(
      "RISK_REGISTER R24 still claims migrate-from-zero hard CI fail — repair landed via #381",
    );
  }
}

function assertEvidenceLedger(): void {
  const rel = "docs/remediation/PRODUCTION_READINESS_EVIDENCE_LEDGER.md";
  const text = read(rel);
  const lines = text.split("\n");
  let inTable = false;
  let rowCount = 0;

  for (const line of lines) {
    if (/^\|\s*Control\s*\|/i.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable && /^\|\s*:?-{3,}/.test(line)) continue;
    if (inTable && !line.startsWith("|")) {
      inTable = false;
      continue;
    }
    if (!inTable || !line.startsWith("|")) continue;

    const cols = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    // Control | Scope | Owner | Evidence location | Last verified | Environment | Status | …
    if (cols.length < 7) {
      push(`${rel}: malformed evidence row: ${line.slice(0, 120)}`);
      continue;
    }
    // Skip the scoring table (Slice | Score …)
    if (
      /^slice$/i.test(cols[0] ?? "") ||
      /^public informational/i.test(cols[0] ?? "")
    ) {
      inTable = false;
      continue;
    }
    rowCount += 1;
    const [control, , owner, evidence, , , status] = cols;
    const statusToken =
      VALID_STATUSES.find((s) => status.includes(`\`${s}\``) || status === s) ??
      null;

    if (!statusToken) {
      push(
        `${rel}: row "${control}" missing valid status among ${VALID_STATUSES.join("|")}`,
      );
    }
    if (!owner) {
      push(`${rel}: row "${control}" missing owner`);
    }
    if (!evidence) {
      push(`${rel}: row "${control}" missing evidence location`);
    }
    if (
      statusToken === "VERIFIED" &&
      (!evidence || evidence === "—" || evidence.toLowerCase() === "none")
    ) {
      push(
        `${rel}: row "${control}" is VERIFIED but lacks an evidence location`,
      );
    }
  }

  if (rowCount < 8) {
    push(`${rel}: expected at least 8 evidence rows, found ${rowCount}`);
  }
}

function assertNoProductionReadyWithoutEvidence(): void {
  const inventory = read("docs/remediation/CAPABILITY_INVENTORY.md");
  const lines = inventory.split("\n");
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    if (/production_ready/i.test(line) && !/not production/i.test(line)) {
      // Allow discussing the state name in prose headers; flag table rows claiming the state
      const cols = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (cols.length >= 5) {
        const state = cols[3] ?? "";
        const claim = cols[4] ?? "";
        if (/^production_ready$/i.test(state)) {
          push(
            `CAPABILITY_INVENTORY marks "${cols[0]}" as production_ready — forbidden without ledger evidence programme approval`,
          );
        }
        if (/^true$/i.test(claim) && /production_ready/i.test(state)) {
          push(
            `CAPABILITY_INVENTORY allows public claim for production_ready capability "${cols[0]}"`,
          );
        }
      }
    }
  }

  try {
    assertNoProductionClaimsWithoutEvidence();
  } catch (e) {
    push(String(e instanceof Error ? e.message : e));
  }
}

function assertStackDepthDocumented(): void {
  const ledger = read("docs/remediation/PR_ACTION_LEDGER.md");
  if (!/depth\s*\*\*4\*\*|depth \*\*4\*\*|depth \*\*4|depth 4/i.test(ledger)) {
    push(
      "PR_ACTION_LEDGER.md must document Geoscape stack depth 4 policy breach while #386 remains stacked",
    );
  }
  if (!/#379/i.test(ledger) || !/pbs-operations/i.test(ledger)) {
    push(
      "PR_ACTION_LEDGER.md must designate #379 relative to canonical lib/pbs-operations/**",
    );
  }
}

function assertPbsCanonicalPath(): void {
  const ownership = read("docs/remediation/DOMAIN_OWNERSHIP.md");
  if (!/lib\/pbs-operations\/\*\*/.test(ownership)) {
    push("DOMAIN_OWNERSHIP.md must keep lib/pbs-operations/** as PBS owner");
  }
  if (!/positive-behaviour-support/i.test(ownership)) {
    push(
      "DOMAIN_OWNERSHIP.md must record #379 lib/positive-behaviour-support/** as non-canonical/blocked",
    );
  }
}

function main(): void {
  assertRequiredFiles();
  if (errors.length) {
    // Still attempt remaining checks when files exist
  }
  if (exists("docs/remediation/CURRENT_STATE.md")) {
    assertMigrateFromZeroConsistency();
  }
  if (exists("docs/remediation/PRODUCTION_READINESS_EVIDENCE_LEDGER.md")) {
    assertEvidenceLedger();
  }
  if (exists("docs/remediation/CAPABILITY_INVENTORY.md")) {
    assertNoProductionReadyWithoutEvidence();
  }
  if (exists("docs/remediation/PR_ACTION_LEDGER.md")) {
    assertStackDepthDocumented();
  }
  if (exists("docs/remediation/DOMAIN_OWNERSHIP.md")) {
    assertPbsCanonicalPath();
  }

  if (errors.length) {
    console.error("Readiness evidence consistency check FAILED:");
    for (const e of errors) console.error(` - ${e}`);
    process.exit(1);
  }
  console.log("Readiness evidence consistency check passed.");
}

main();
