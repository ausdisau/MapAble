#!/usr/bin/env node
/**
 * Fail-closed validator for human release-session / golden-journey evidence JSON.
 * Does not invent pass results. Missing mandatory fields => OWNER_ACTION_REQUIRED.
 *
 * Usage:
 *   node scripts/ci/validate-human-release-evidence-readonly.mjs \
 *     --evidence ./artifacts/human-release-session.redacted.json
 */
import { readFileSync, existsSync } from "node:fs";

const VALID = new Set([
  "VERIFIED",
  "FAILED",
  "NOT_RUN",
  "BLOCKED",
  "OWNER_ACTION_REQUIRED",
  "NOT_APPLICABLE",
  "PASS",
  "FAIL",
  "STOP",
]);

function main() {
  const idx = process.argv.indexOf("--evidence");
  const path = idx >= 0 ? process.argv[idx + 1] : undefined;
  if (!path) {
    console.log(
      JSON.stringify({
        overall: "OWNER_ACTION_REQUIRED",
        reason: "missing --evidence",
        secretsPrinted: false,
      }),
    );
    process.exit(2);
  }
  if (!existsSync(path)) {
    console.log(
      JSON.stringify({
        overall: "FAILED",
        reason: "file_missing",
        secretsPrinted: false,
      }),
    );
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(path, "utf8"));
  const missing = [];
  for (const field of ["tester", "date", "commitSha", "url", "overallStatus"]) {
    if (!data?.[field] || !String(data[field]).trim()) missing.push(field);
  }
  if (data?.overallStatus && !VALID.has(String(data.overallStatus))) {
    missing.push("overallStatus_invalid_vocabulary");
  }
  if (!Array.isArray(data?.journeys) || data.journeys.length === 0) {
    missing.push("journeys");
  } else {
    for (const [i, j] of data.journeys.entries()) {
      if (!j?.id) missing.push(`journeys[${i}].id`);
      if (!j?.status || !VALID.has(String(j.status))) {
        missing.push(`journeys[${i}].status`);
      }
      if (j?.status === "VERIFIED" || j?.status === "PASS") {
        if (!j.evidenceRef) missing.push(`journeys[${i}].evidenceRef`);
      }
    }
  }

  const inventedPass =
    Array.isArray(data?.journeys) &&
    data.journeys.some(
      (j) =>
        (j?.status === "VERIFIED" || j?.status === "PASS") && !j?.evidenceRef,
    );

  const overall = inventedPass
    ? "FAILED"
    : missing.length
      ? "OWNER_ACTION_REQUIRED"
      : data.overallStatus === "NOT_RUN"
        ? "NOT_RUN"
        : "VERIFIED";

  console.log(
    JSON.stringify(
      {
        mode: "read_only",
        secretsPrinted: false,
        mutatesExternalState: false,
        overall,
        missing,
        note: "Validator only; does not execute human tests.",
      },
      null,
      2,
    ),
  );
  process.exit(overall === "FAILED" ? 1 : 0);
}

main();
