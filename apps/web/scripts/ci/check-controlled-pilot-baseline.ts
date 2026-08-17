#!/usr/bin/env tsx
/**
 * Fail-closed controlled-pilot baseline consistency check.
 * Does not contact production. Does not invent owner names or human evidence.
 */
import fs from "node:fs";
import path from "node:path";

import {
  CONTROLLED_PILOT_CHARTER_PATH,
  EXCLUDED_CAPABILITIES,
  MANDATORY_ROLES,
  OPERATIONAL_TARGETS,
  PILOT_STRUCTURE,
  validateOwnerAssignments,
} from "../../lib/pilot/controlled-pilot-baseline";

const ROOT = process.cwd();
const errors: string[] = [];

function push(msg: string): void {
  errors.push(msg);
}

function main(): void {
  const charterPath = path.join(ROOT, CONTROLLED_PILOT_CHARTER_PATH);
  if (!fs.existsSync(charterPath)) {
    push(`Missing canonical charter: ${CONTROLLED_PILOT_CHARTER_PATH}`);
  } else {
    const text = fs.readFileSync(charterPath, "utf8");
    if (!/single source of truth/i.test(text)) {
      push("Charter must declare itself the single source of truth");
    }
    if (!/not an emergency service/i.test(text)) {
      push("Charter must include emergency disclaimer");
    }
    if (!new RegExp(String(PILOT_STRUCTURE.participantMin)).test(text)) {
      push("Charter must record participant minimum");
    }
    if (!/Australia\/Sydney/i.test(text)) {
      push("Charter must record Australia/Sydney operating hours");
    }
    for (const role of MANDATORY_ROLES) {
      const human = role.replace(/_/g, " ");
      if (!new RegExp(human, "i").test(text)) {
        push(`Charter missing mandatory role: ${role}`);
      }
    }
    for (const cap of [
      "NDIA claim",
      "Automated payments",
      "Production CSP",
      "Autonomous safeguarding",
    ]) {
      if (!new RegExp(cap, "i").test(text)) {
        push(`Charter missing excluded capability mention: ${cap}`);
      }
    }
    if (!/`OWNER_ACTION_REQUIRED`/.test(text)) {
      push("Charter must use OWNER_ACTION_REQUIRED placeholders for roles");
    }
    // Do not allow claiming RTO/RPO achieved in charter prose
    if (/RTO[^\n]{0,40}`VERIFIED`/i.test(text) && /achieved/i.test(text)) {
      push("Charter must not claim RTO achieved without exercise evidence");
    }
  }

  // Empty assignments → fail closed OWNER_ACTION_REQUIRED
  const ownerCheck = validateOwnerAssignments([]);
  if (ownerCheck.ok || ownerCheck.status !== "OWNER_ACTION_REQUIRED") {
    push("Owner assignment validator must fail closed when empty");
  }
  if (ownerCheck.missing.length < MANDATORY_ROLES.length) {
    push("Owner assignment validator must report missing roles");
  }

  if (
    OPERATIONAL_TARGETS.rtoHours !== 4 ||
    OPERATIONAL_TARGETS.rpoHours !== 1
  ) {
    push("Operational targets must keep RTO=4h and RPO=1h until owner revises");
  }
  if (EXCLUDED_CAPABILITIES.length < 8) {
    push("Excluded capabilities list unexpectedly short");
  }

  // Cross-link docs should point at charter when present
  for (const rel of [
    "docs/operations/CONTROLLED_PILOT_GOLDEN_JOURNEYS.md",
    "docs/operations/CONTROLLED_PILOT_RELEASE_SESSION.md",
    "docs/remediation/OWNER_ACTION_REQUIRED_OPS.md",
  ]) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      push(`Missing cross-link target doc: ${rel}`);
      continue;
    }
    const body = fs.readFileSync(full, "utf8");
    if (!/CONTROLLED_PILOT_CHARTER\.md/i.test(body)) {
      push(`${rel} must cross-link CONTROLLED_PILOT_CHARTER.md`);
    }
  }

  if (errors.length) {
    console.error("Controlled-pilot baseline check FAILED:");
    for (const e of errors) console.error(` - ${e}`);
    process.exit(1);
  }
  console.log("Controlled-pilot baseline check passed.");
}

main();
