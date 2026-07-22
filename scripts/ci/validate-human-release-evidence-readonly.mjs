#!/usr/bin/env node
/**
 * Fail-closed validator for human release-session / golden-journey evidence JSON.
 * Read-only: never rewrites evidence files. Never invents PASS/VERIFIED.
 *
 * Exit codes (release-gate semantics):
 *   0 — overall is genuinely PASS or VERIFIED
 *   1 — FAILED / FAIL / INVALID (malformed, contradictory, invented pass)
 *   2 — incomplete / blocked / owner-action / not-run / absent evidence path
 *
 * Usage:
 *   node scripts/ci/validate-human-release-evidence-readonly.mjs \
 *     --evidence ./artifacts/human-release-session.redacted.json
 */
import { readFileSync, existsSync, statSync } from "node:fs";

const PASSING = new Set(["VERIFIED", "PASS"]);
const FAILING = new Set(["FAILED", "FAIL"]);
const INCOMPLETE = new Set(["NOT_RUN", "INCOMPLETE"]);
const BLOCKED = new Set(["BLOCKED", "STOP", "OWNER_ACTION_REQUIRED"]);
const ALLOWED = new Set([
  ...PASSING,
  ...FAILING,
  ...INCOMPLETE,
  ...BLOCKED,
  "NOT_APPLICABLE",
]);

/** Conservative cap — human evidence artefacts are small structured JSON. */
const MAX_EVIDENCE_BYTES = 256 * 1024;
const MAX_JOURNEYS = 50;
const MAX_DEPTH = 6;

function exitForOverall(overall) {
  if (PASSING.has(overall)) return 0;
  if (FAILING.has(overall) || overall === "INVALID") return 1;
  return 2;
}

function emit(result) {
  console.log(
    JSON.stringify(
      {
        mode: "read_only",
        secretsPrinted: false,
        mutatesExternalState: false,
        note: "Validator only; does not execute human tests or rewrite evidence.",
        ...result,
      },
      null,
      2,
    ),
  );
  process.exit(exitForOverall(result.overall));
}

function maxDepth(value, depth = 0) {
  if (depth > MAX_DEPTH) return depth;
  if (!value || typeof value !== "object") return depth;
  let deepest = depth;
  for (const child of Object.values(value)) {
    deepest = Math.max(deepest, maxDepth(child, depth + 1));
    if (deepest > MAX_DEPTH) return deepest;
  }
  return deepest;
}

function classifyStatus(status) {
  if (PASSING.has(status)) return "passing";
  if (FAILING.has(status)) return "failing";
  if (INCOMPLETE.has(status)) return "incomplete";
  if (BLOCKED.has(status)) return "blocked";
  if (status === "NOT_APPLICABLE") return "not_applicable";
  return "unknown";
}

function main() {
  const idx = process.argv.indexOf("--evidence");
  const path = idx >= 0 ? process.argv[idx + 1] : undefined;
  if (!path) {
    emit({
      overall: "OWNER_ACTION_REQUIRED",
      sourceStatus: null,
      reason: "missing --evidence",
    });
  }
  if (!existsSync(path)) {
    emit({
      overall: "INVALID",
      sourceStatus: null,
      reason: "file_missing",
    });
  }

  let size;
  try {
    size = statSync(path).size;
  } catch {
    emit({
      overall: "INVALID",
      sourceStatus: null,
      reason: "stat_failed",
    });
  }
  if (size === 0) {
    emit({
      overall: "INVALID",
      sourceStatus: null,
      reason: "empty_file",
    });
  }
  if (size > MAX_EVIDENCE_BYTES) {
    emit({
      overall: "INVALID",
      sourceStatus: null,
      reason: "evidence_too_large",
      maxBytes: MAX_EVIDENCE_BYTES,
    });
  }

  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    emit({
      overall: "INVALID",
      sourceStatus: null,
      reason: "read_failed",
    });
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    emit({
      overall: "INVALID",
      sourceStatus: null,
      reason: "json_parse_error",
    });
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    emit({
      overall: "INVALID",
      sourceStatus: null,
      reason: "wrong_schema_root",
    });
  }

  if (maxDepth(data) > MAX_DEPTH) {
    emit({
      overall: "INVALID",
      sourceStatus: null,
      reason: "json_too_deep",
      maxDepth: MAX_DEPTH,
    });
  }

  const missing = [];
  for (const field of ["tester", "date", "commitSha", "url", "overallStatus"]) {
    if (!data[field] || !String(data[field]).trim()) missing.push(field);
  }

  const sourceStatus =
    data.overallStatus != null ? String(data.overallStatus) : null;

  if (sourceStatus && !ALLOWED.has(sourceStatus)) {
    emit({
      overall: "INVALID",
      sourceStatus,
      reason: "unknown_status",
      missing: ["overallStatus_invalid_vocabulary"],
    });
  }

  if (!Array.isArray(data.journeys) || data.journeys.length === 0) {
    missing.push("journeys");
  } else if (data.journeys.length > MAX_JOURNEYS) {
    emit({
      overall: "INVALID",
      sourceStatus,
      reason: "too_many_journeys",
      maxJourneys: MAX_JOURNEYS,
    });
  }

  const journeyStatuses = [];
  if (Array.isArray(data.journeys)) {
    for (const [i, j] of data.journeys.entries()) {
      if (!j || typeof j !== "object" || Array.isArray(j)) {
        missing.push(`journeys[${i}].shape`);
        continue;
      }
      if (!j.id) missing.push(`journeys[${i}].id`);
      const js = j.status != null ? String(j.status) : "";
      if (!js || !ALLOWED.has(js)) {
        missing.push(`journeys[${i}].status`);
      } else {
        journeyStatuses.push(js);
      }
      if (PASSING.has(js) && !j.evidenceRef) {
        missing.push(`journeys[${i}].evidenceRef`);
      }
    }
  }

  if (missing.length) {
    const overall = sourceStatus && INCOMPLETE.has(sourceStatus)
      ? sourceStatus
      : sourceStatus && BLOCKED.has(sourceStatus)
        ? sourceStatus
        : "OWNER_ACTION_REQUIRED";
    emit({
      overall,
      sourceStatus,
      reason: "incomplete_schema",
      missing,
      decision:
        "Required fields absent — cannot VERIFIED. Preserves incomplete/blocked source when present.",
    });
  }

  const inventedPass = data.journeys.some(
    (j) => PASSING.has(String(j?.status)) && !j?.evidenceRef,
  );
  if (inventedPass) {
    emit({
      overall: "INVALID",
      sourceStatus,
      reason: "invented_pass_without_evidence",
      decision: "PASS/VERIFIED journeys require evidenceRef.",
    });
  }

  const overallClass = classifyStatus(sourceStatus);
  const journeyClasses = journeyStatuses.map(classifyStatus);

  if (
    overallClass === "passing" &&
    journeyClasses.some((c) => c === "failing" || c === "blocked" || c === "incomplete")
  ) {
    emit({
      overall: "INVALID",
      sourceStatus,
      reason: "contradictory_status",
      journeyStatuses,
      decision:
        "overallStatus is passing but one or more journeys are non-passing.",
    });
  }

  if (
    overallClass === "failing" &&
    journeyClasses.length > 0 &&
    journeyClasses.every((c) => c === "passing")
  ) {
    emit({
      overall: "INVALID",
      sourceStatus,
      reason: "contradictory_status",
      journeyStatuses,
      decision:
        "overallStatus is failing but every journey claims a passing outcome.",
    });
  }

  if (overallClass === "failing") {
    emit({
      overall: sourceStatus,
      sourceStatus,
      reason: "source_failed",
      journeyStatuses,
      decision: "Preserved failing source status; never upgraded to VERIFIED.",
    });
  }

  if (overallClass === "blocked") {
    emit({
      overall: sourceStatus,
      sourceStatus,
      reason: "source_blocked",
      journeyStatuses,
      decision: "Preserved blocked/owner source status; never upgraded to VERIFIED.",
    });
  }

  if (overallClass === "incomplete") {
    emit({
      overall: sourceStatus,
      sourceStatus,
      reason: "source_incomplete",
      journeyStatuses,
      decision: "Preserved incomplete/not-run source status; never upgraded to VERIFIED.",
    });
  }

  if (overallClass === "passing") {
    const allJourneysPassing = journeyStatuses.every((s) => PASSING.has(s));
    if (!allJourneysPassing) {
      emit({
        overall: "INVALID",
        sourceStatus,
        reason: "contradictory_status",
        journeyStatuses,
        decision: "Passing overall requires every journey to be PASS/VERIFIED.",
      });
    }
    emit({
      overall: sourceStatus === "PASS" ? "PASS" : "VERIFIED",
      sourceStatus,
      reason: "source_passing",
      journeyStatuses,
      decision:
        "Evidence schema complete; source records an explicit passing outcome.",
    });
  }

  emit({
    overall: "OWNER_ACTION_REQUIRED",
    sourceStatus,
    reason: "unhandled_status",
    journeyStatuses,
  });
}

main();
