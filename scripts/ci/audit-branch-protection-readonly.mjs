#!/usr/bin/env node
/**
 * Read-only GitHub branch-protection / ruleset audit helper.
 *
 * - Never changes repository settings.
 * - Never enables or disables protection.
 * - Prints checklist + API visibility only.
 *
 * Usage:
 *   node scripts/ci/audit-branch-protection-readonly.mjs
 *   GH_REPO=ausdisau/mapableau-new node scripts/ci/audit-branch-protection-readonly.mjs
 */
import { execFileSync } from "node:child_process";

const REPO = process.env.GH_REPO || "ausdisau/mapableau-new";

const REQUIRED_CHECKS = [
  "CI",
  "Migrations",
  "Migrate from zero",
  "Security",
  "Accessibility",
  "Production claims",
  "Vercel",
];

const OWNER_CHECKLIST = [
  "Require a pull request before merging",
  "Require at least one independent approving review",
  "Dismiss stale pull request approvals when new commits are pushed",
  "Require status checks to pass (names must match workflow jobs)",
  "Require branches to be up to date before merging (where practical)",
  "Do not allow silent administrator bypass without break-glass audit",
  "Record break-glass use in PR + follow-up issue within 24h",
  "Do not enable auto-merge for remediation / production-impacting PRs",
];

function ghJson(args) {
  try {
    const out = execFileSync("gh", ["api", ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, data: JSON.parse(out) };
  } catch (error) {
    const stderr =
      error && typeof error === "object" && "stderr" in error
        ? String(error.stderr)
        : "";
    return {
      ok: false,
      error: stderr.includes("403")
        ? "403_resource_not_accessible"
        : stderr.includes("404")
          ? "404_not_found"
          : "gh_api_failed",
    };
  }
}

function main() {
  const rulesets = ghJson([
    `-H`,
    `Accept: application/vnd.github+json`,
    `/repos/${REPO}/rulesets`,
  ]);
  const protection = ghJson([
    `-H`,
    `Accept: application/vnd.github+json`,
    `/repos/${REPO}/branches/main/protection`,
  ]);

  const report = {
    mode: "read_only",
    mutatesExternalState: false,
    repository: REPO,
    branch: "main",
    api: {
      rulesets: rulesets.ok
        ? {
            status: "readable",
            count: Array.isArray(rulesets.data) ? rulesets.data.length : null,
          }
        : { status: rulesets.error },
      classicProtection: protection.ok
        ? { status: "readable" }
        : { status: protection.error },
    },
    requiredChecksExpected: REQUIRED_CHECKS,
    ownerChecklist: OWNER_CHECKLIST.map((item) => ({
      item,
      status: "OWNER_ACTION_REQUIRED",
    })),
    overall:
      rulesets.ok || protection.ok
        ? "PARTIAL_API_VISIBLE_OWNER_MUST_CONFIRM_UI"
        : "OWNER_ACTION_REQUIRED",
    docs: "docs/operations/branch-protection.md",
    note: "Automation cannot claim branch protection is configured when API returns 403/empty. Owner must screenshot GitHub Settings → Rules/Branches.",
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

main();
