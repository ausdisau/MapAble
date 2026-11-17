#!/usr/bin/env node
/**
 * LEIL read-only pull request evidence checker.
 *
 * Example:
 * node --experimental-strip-types scripts/ci/lived-experience-gate.mjs \
 *    --paths /tmp/changed-files-null-separated \
 *    --manifest docs/co-design/reviews/pr-123.json \
 *    --expected-code-digest <sha256> --expected-change-id pr-123
 *
 * The expected code digest + change ID MUST be supplied by the trusted caller,
 * never extracted from the untrusted manifest. Missing values block.
 * Trusted public-key registry + revocations MUST be supplied by an independent
 * authorised control (e.g. GitHub protected environment secret) and never by
 * a pull-request file or AI-generated content. No keys = HOLD.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import {
  assessCoDesign,
  prepareLivedExperienceBrief,
  requiresLivedExperienceGate,
} from "../../lib/governance/lived-experience-loop/agent.ts";

function option(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : (process.argv[index + 1] ?? null);
}
function readJsonWithinLimit(path, maxBytes) {
  if (!path || !existsSync(path)) return null;
  if (statSync(path).size > maxBytes) throw new Error("INPUT_TOO_LARGE");
  return JSON.parse(readFileSync(path, "utf8"));
}
function run() {
  let changedPaths = [];
  try {
    const pathsFile = option("--paths");
    if (!pathsFile || !existsSync(pathsFile)) throw new Error("MISSING_PATHS");
    const raw = readFileSync(pathsFile);
    if (raw.length > 512 * 1024) throw new Error("PATHS_TOO_LARGE");
    changedPaths = raw.toString("utf8").split("\0").filter(Boolean);
  } catch {
    console.log(JSON.stringify({ mode: "read_only", verdict: "HOLD_FOR_CO_DESIGN", reasons: ["invalid_changed_paths_file"] }));
    process.exit(2);
  }
  if (!requiresLivedExperienceGate(changedPaths)) {
    console.log(JSON.stringify({ mode: "read_only", verdict: "NOT_APPLICABLE", productionAuthorised: false }));
    process.exit(0);
  }
  let manifest = null;
  let trustedRegistry = undefined;
  try {
    manifest = readJsonWithinLimit(option("--manifest"), 128 * 1024);
  } catch {
    console.log(JSON.stringify({ mode: "read_only", verdict: "HOLD_FOR_CO_DESIGN", reasons: ["invalid_manifest_json"] }));
    process.exit(2);
  }
  try {
    // This contains *public* verification keys and revocations, never a signing
    // private key. Do not print the contents or read from the PR workspace.
    const raw = process.env.LEIL_TRUST_REGISTRY_JSON ?? "";
    if (raw && raw.length <= 128 * 1024) {
      const candidate = JSON.parse(raw);
      if (
        candidate && Array.isArray(candidate.keys) &&
        Array.isArray(candidate.revokedReceiptIds)
      ) trustedRegistry = candidate;
    }
  } catch {
    // No validated human-controlled registry: always hold.
  }
  const assessment = assessCoDesign({
    manifest,
    trustedRegistry,
    changedPaths,
    expectedCodeDigest: option("--expected-code-digest") ?? "__MISSING_TRUSTED_DIGEST__",
    expectedChangeId: option("--expected-change-id") ?? "__MISSING_TRUSTED_CHANGE_ID__",
  });
  // Do not print review narratives, names, private documents or registry keys.
  const result = {
    mode: assessment.mode,
    verdict: assessment.verdict,
    productionAuthorised: false,
    requiredStages: assessment.requiredStages,
    verifiedOrganisationsByStage: assessment.verifiedOrganisationsByStage,
    reasons: assessment.reasons,
    nextHumanActions: assessment.nextHumanActions,
  };
  console.log(JSON.stringify(result, null, 2));
  if (assessment.verdict !== "HOLD_FOR_CO_DESIGN" && manifest?.change) {
    const brief = prepareLivedExperienceBrief(manifest.change);
    console.log(JSON.stringify({ reviewBriefMode: brief.mode, questionCount: brief.questions.length }));
  }
  process.exit(assessment.verdict === "HOLD_FOR_CO_DESIGN" ? 2 : 0);
}

run();
