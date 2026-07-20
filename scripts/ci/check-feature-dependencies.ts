#!/usr/bin/env tsx
/**
 * Static checks for unsafe feature / env dependency combinations documented
 * in remediation. Runtime fail-closed lands in PR 2; this catches repo defaults.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const errors: string[] = [];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main(): void {
  // 1) NDIS encryption must not keep insecure fallbacks after PR 2.
  // During PR 1 we only detect and report — fail if the static fallback string
  // is present WITHOUT a remediation TODO marker? Plan says PR 2 fixes crypto.
  // For PR 1: warn by failing only if someone removes the known file (sanity).
  const ndisPath = "lib/crypto/ndis.ts";
  if (!fs.existsSync(path.join(ROOT, ndisPath))) {
    errors.push(`${ndisPath} missing`);
  } else {
    const ndis = read(ndisPath);
    if (
      ndis.includes("mapable-dev-only-key-change-in-production") ||
      ndis.includes("NEXTAUTH_SECRET")
    ) {
      console.warn(
        "WARN: NDIS encryption still has insecure fallbacks (expected until PR 2)",
      );
    }
  }

  // 2) next.config must not ignore ESLint during builds after PR 1
  const nextConfig = read("next.config.ts");
  if (/ignoreDuringBuilds\s*:\s*true/.test(nextConfig)) {
    errors.push(
      "next.config.ts still sets eslint.ignoreDuringBuilds: true — build must fail on lint",
    );
  }

  // 3) Capability / freeze docs must exist
  for (const rel of [
    "docs/remediation/FEATURE_FREEZE.md",
    "docs/remediation/CAPABILITY_INVENTORY.md",
    "docs/remediation/DOMAIN_OWNERSHIP.md",
    "docs/programmes/NDIS_EXPANSION_MASTER_PLAN.md",
    "docs/programmes/NDIS_EXPANSION_DOMAIN_MAP.md",
    "docs/programmes/NDIS_EXPANSION_PR_RECONCILIATION.md",
    "docs/programmes/NDIS_REGULATORY_GATE_MATRIX.md",
    "docs/programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md",
  ]) {
    if (!fs.existsSync(path.join(ROOT, rel))) {
      errors.push(`${rel} missing`);
    }
  }

  // 4) .env.example should not enable NDIA live submit by default
  const envExample = read(".env.example");
  if (/NDIA_.*SUBMIT.*=\s*true/i.test(envExample)) {
    errors.push(".env.example enables NDIA submit by default");
  }
  if (/BILLING_CLAIMS_GATEWAY\s*=\s*live/i.test(envExample)) {
    errors.push(".env.example sets BILLING_CLAIMS_GATEWAY=live");
  }

  // 5) NDIS Expansion hard-off flags must default false (or be absent = off)
  for (const flag of [
    "MAPABLE_NDIA_CLAIM_SUBMISSION_ENABLED",
    "MAPABLE_AUTOMATED_PAYMENT_APPROVAL_ENABLED",
    "MAPABLE_AT_CONTINUITY_ENABLED",
    "MAPABLE_PBS_OPERATIONS_ENABLED",
    "MAPABLE_PBS_AI_DRAFTING_ENABLED",
    "MAPABLE_RESTRICTIVE_PRACTICE_REGISTER_ENABLED",
  ]) {
    const enabled = new RegExp(`${flag}\\s*=\\s*true`, "i").test(envExample);
    if (enabled) {
      errors.push(`.env.example enables ${flag}=true (must default false)`);
    }
  }

  if (errors.length > 0) {
    console.error("Feature dependency check FAILED:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("OK: feature dependency static checks");
}

main();
