#!/usr/bin/env tsx
/**
 * Wave 0 CI: merge-train / ledger integrity.
 * Detects: superseded close targets, stack-depth violations, migration
 * timestamp collisions, production claims without evidence, missing registry files.
 */
import fs from "node:fs";
import path from "node:path";

import {
  PR_ACTION_LEDGER,
  SUPERSEDED_CLOSE_TARGETS,
  MAX_UNMERGED_STACK_DEPTH,
  PRODUCTISATION_TRAIN_HEADS,
  assertSupersededCloseTargetsInLedger,
  assertStackDepthPolicy,
  assertProductisationTrainDepth,
} from "../../lib/convergence-os/seed/pr-action-ledger";
import { assertNoProductionClaimsWithoutEvidence } from "../../lib/convergence-os/seed/public-claims";

const ROOT = process.cwd();
const errors: string[] = [];

function main(): void {
  try {
    assertSupersededCloseTargetsInLedger();
  } catch (e) {
    errors.push(String(e instanceof Error ? e.message : e));
  }

  try {
    assertStackDepthPolicy();
  } catch (e) {
    errors.push(String(e instanceof Error ? e.message : e));
  }

  try {
    assertProductisationTrainDepth();
  } catch (e) {
    errors.push(String(e instanceof Error ? e.message : e));
  }

  try {
    assertNoProductionClaimsWithoutEvidence();
  } catch (e) {
    errors.push(String(e instanceof Error ? e.message : e));
  }

  // Migration timestamp uniqueness
  const migrationsDir = path.join(ROOT, "prisma/migrations");
  if (fs.existsSync(migrationsDir)) {
    const stamps = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^\d{14}/.test(d.name))
      .map((d) => d.name.slice(0, 14));
    const seen = new Set<string>();
    for (const stamp of stamps) {
      if (seen.has(stamp)) {
        errors.push(`Duplicate migration timestamp: ${stamp}`);
      }
      seen.add(stamp);
    }
  } else {
    errors.push("prisma/migrations missing");
  }

  // Required registry artefacts
  for (const rel of [
    "lib/convergence-os/seed/pr-action-ledger.ts",
    "lib/convergence-os/seed/public-claims.ts",
    "lib/convergence-os/trains/productisation-merge-train.ts",
    "docs/remediation/PR_ACTION_LEDGER.md",
    "docs/convergence-os/PRODUCTISATION_MERGE_TRAIN.md",
  ]) {
    if (!fs.existsSync(path.join(ROOT, rel))) {
      errors.push(`Missing registry artefact: ${rel}`);
    }
  }

  // AccessCast must be recorded as merged when code is on main
  const accessCastOnMain = fs.existsSync(
    path.join(ROOT, "lib/accesscast/index.ts"),
  );
  if (accessCastOnMain) {
    const entry324 = PR_ACTION_LEDGER.find((e) => e.number === 324);
    if (!entry324 || entry324.state !== "MERGED") {
      errors.push(
        "lib/accesscast present but ledger #324 is not MERGED — refresh PR action ledger",
      );
    }
    for (const n of [320, 321, 322, 325]) {
      const dup = PR_ACTION_LEDGER.find((e) => e.number === n);
      if (!dup || dup.action !== "close") {
        errors.push(
          `AccessCast duplicate #${n} must be action=close after #324 on main`,
        );
      }
    }
  }

  // RC1 must never be a merge action
  const rc1 = PR_ACTION_LEDGER.find((e) => e.number === 323);
  if (rc1 && rc1.action === "merge") {
    errors.push("PR #323 RC1 must not have action=merge");
  }

  // Train heads must exist and first must be mergeable Wave 0
  for (const n of PRODUCTISATION_TRAIN_HEADS) {
    if (!PR_ACTION_LEDGER.some((e) => e.number === n)) {
      errors.push(`Productisation train head #${n} missing from ledger`);
    }
  }

  // Deep stacks must not claim merge
  const deepMerges = PR_ACTION_LEDGER.filter(
    (e) =>
      e.stackDepth !== undefined &&
      e.stackDepth > MAX_UNMERGED_STACK_DEPTH &&
      e.action === "merge",
  );
  if (deepMerges.length > 0) {
    errors.push(
      `Deep-stack merge forbidden: ${deepMerges.map((e) => e.number).join(", ")}`,
    );
  }

  if (errors.length > 0) {
    console.error("Merge-train integrity check failed:");
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log(
    `Merge-train integrity OK (${PR_ACTION_LEDGER.length} ledger entries, ${SUPERSEDED_CLOSE_TARGETS.length} close targets, max stack ${MAX_UNMERGED_STACK_DEPTH})`,
  );
}

main();
