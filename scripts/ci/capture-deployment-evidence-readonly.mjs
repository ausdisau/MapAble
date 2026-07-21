#!/usr/bin/env node
/**
 * Read-only deployment evidence capture validator.
 *
 * Owner supplies a redacted JSON file (no secrets). This script never calls
 * Vercel/Neon APIs and never prints credential values.
 *
 * Usage:
 *   node scripts/ci/capture-deployment-evidence-readonly.mjs \
 *     --evidence ./artifacts/deploy-evidence.redacted.json
 *
 * Required fields: deploymentId, commitSha, buildResult, environment
 * Optional probes: liveStatus, readyStatus, authSessionStatus, authProvidersStatus,
 *   canonicalRedirectOk, rollbackReady
 */
import { readFileSync, existsSync } from "node:fs";

const SECRETISH =
  /password|secret|token|apikey|api_key|authorization|bearer\s+[a-z0-9]|postgres(?:ql)?:\/\/[^:]+:[^@]+@/i;

const REQUIRED = ["deploymentId", "commitSha", "buildResult", "environment"];

function main() {
  const idx = process.argv.indexOf("--evidence");
  const path = idx >= 0 ? process.argv[idx + 1] : undefined;

  if (!path) {
    console.log(
      JSON.stringify(
        {
          overall: "OWNER_ACTION_REQUIRED",
          reason: "missing --evidence path",
          secretsPrinted: false,
          mutatesExternalState: false,
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  if (!existsSync(path)) {
    console.log(
      JSON.stringify({
        overall: "FAILED",
        reason: "evidence_file_missing",
        secretsPrinted: false,
      }),
    );
    process.exit(1);
  }

  const raw = readFileSync(path, "utf8");
  if (SECRETISH.test(raw)) {
    console.log(
      JSON.stringify({
        overall: "FAILED",
        reason: "secret_like_content_detected_in_evidence_file",
        secretsPrinted: false,
      }),
    );
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.log(
      JSON.stringify({
        overall: "FAILED",
        reason: "invalid_json",
        secretsPrinted: false,
      }),
    );
    process.exit(1);
  }

  const missing = REQUIRED.filter(
    (k) => typeof data?.[k] !== "string" || !String(data[k]).trim(),
  );

  const probes = {
    liveStatus: data.liveStatus ?? null,
    readyStatus: data.readyStatus ?? null,
    authSessionStatus: data.authSessionStatus ?? null,
    authProvidersStatus: data.authProvidersStatus ?? null,
    canonicalRedirectOk: data.canonicalRedirectOk ?? null,
    rollbackReady: data.rollbackReady ?? null,
  };

  const probeMissing = Object.entries(probes)
    .filter(([, v]) => v == null || v === "")
    .map(([k]) => k);

  let overall = "VERIFIED";
  if (missing.length) overall = "FAILED";
  else if (probeMissing.length) overall = "OWNER_ACTION_REQUIRED";

  console.log(
    JSON.stringify(
      {
        mode: "read_only",
        secretsPrinted: false,
        mutatesExternalState: false,
        overall,
        missingRequired: missing,
        probeFieldsIncomplete: probeMissing,
        environment: data.environment,
        commitSha: data.commitSha,
        deploymentId: data.deploymentId,
        buildResult: data.buildResult,
        note: "Does not prove Vercel account state; validates owner-supplied redacted artefact only.",
      },
      null,
      2,
    ),
  );
  process.exit(overall === "FAILED" ? 1 : 0);
}

main();
