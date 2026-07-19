#!/usr/bin/env tsx
/**
 * Fail CI on unresolved high/critical production dependency advisories
 * unless they appear in security/advisory-allowlist.json with an unexpired expiry.
 *
 * Fail closed on registry/tool/transport failures, empty/malformed output,
 * unrecognised schema, and malformed/expired allowlist entries.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  evaluateProductionAudit,
  parseAllowlistJson,
  parseAuditJson,
} from "./prod-audit-lib";

function runPnpmAuditJson():
  | { ok: true; stdout: string }
  | { ok: false; error: string } {
  try {
    const stdout = execFileSync("pnpm", ["audit", "--prod", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 20 * 1024 * 1024,
    });
    return { ok: true, stdout };
  } catch (error) {
    const err = error as {
      stdout?: string;
      stderr?: string;
      status?: number | null;
      message?: string;
    };
    const stdout = err.stdout ?? "";
    // pnpm audit exits non-zero when advisories exist — stdout may still be valid JSON.
    if (stdout.trim()) {
      return { ok: true, stdout };
    }
    const detail = (err.stderr || err.message || "unknown error").trim();
    return {
      ok: false,
      error: `pnpm audit --prod --json failed without JSON output (registry/tool/transport): ${detail}`,
    };
  }
}

function main(): void {
  const allowlistPath = path.join(
    process.cwd(),
    "security",
    "advisory-allowlist.json",
  );
  let allowlistRaw: string;
  try {
    allowlistRaw = fs.readFileSync(allowlistPath, "utf8");
  } catch {
    console.error("Missing security/advisory-allowlist.json");
    process.exit(1);
  }

  const allowlistParsed = parseAllowlistJson(allowlistRaw);
  if (!allowlistParsed.ok) {
    console.error(allowlistParsed.error);
    process.exit(1);
  }

  const auditRun = runPnpmAuditJson();
  if (!auditRun.ok) {
    console.error(auditRun.error);
    process.exit(1);
  }

  const auditParsed = parseAuditJson(auditRun.stdout);
  if (!auditParsed.ok) {
    console.error(auditParsed.error);
    process.exit(1);
  }

  const result = evaluateProductionAudit({
    advisories: auditParsed.advisories,
    allowlist: allowlistParsed.allowlist,
  });

  if (!result.ok) {
    console.error(result.error);
    if (result.expired) {
      for (const line of result.expired) console.error(`  - ${line}`);
    }
    if (result.unresolved) {
      for (const line of result.unresolved) console.error(`  - ${line}`);
      console.error(
        "Remediate via upgrades/overrides, or add a reviewed allowlist entry in security/advisory-allowlist.json",
      );
    }
    process.exit(1);
  }

  console.log(
    `Production audit gate passed: ${result.highCount} high/critical finding(s), ${result.activeExceptionCount} active allowlist exception(s).`,
  );
}

main();
