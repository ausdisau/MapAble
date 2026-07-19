#!/usr/bin/env tsx
/**
 * Fail CI on unresolved high/critical production dependency advisories
 * unless they appear in security/advisory-allowlist.json with an unexpired expiry.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type AllowlistException = {
  advisoryId: string;
  package: string;
  path: string;
  rationale: string;
  owner: string;
  compensatingControl: string;
  expiry: string;
};

type AllowlistFile = {
  exceptions: AllowlistException[];
};

type AuditAdvisory = {
  id?: string | number;
  github_advisory_id?: string;
  module_name?: string;
  severity?: string;
  findings?: Array<{ paths?: string[] }>;
  url?: string;
};

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadAllowlist(): AllowlistFile {
  const allowlistPath = path.join(
    process.cwd(),
    "security",
    "advisory-allowlist.json",
  );
  const raw = fs.readFileSync(allowlistPath, "utf8");
  const parsed = JSON.parse(raw) as AllowlistFile;
  if (!Array.isArray(parsed.exceptions)) {
    throw new Error("advisory-allowlist.json must contain an exceptions array");
  }
  for (const entry of parsed.exceptions) {
    for (const key of [
      "advisoryId",
      "package",
      "path",
      "rationale",
      "owner",
      "compensatingControl",
      "expiry",
    ] as const) {
      if (!entry[key]?.trim()) {
        throw new Error(
          `advisory-allowlist exception missing required field: ${key}`,
        );
      }
    }
  }
  return parsed;
}

function advisoryIds(adv: AuditAdvisory): string[] {
  const ids: string[] = [];
  if (adv.github_advisory_id) ids.push(String(adv.github_advisory_id));
  if (adv.id != null) ids.push(String(adv.id));
  if (adv.url) {
    const match = adv.url.match(/GHSA-[a-z0-9-]+/i);
    if (match) ids.push(match[0].toUpperCase());
  }
  return [...new Set(ids.map((id) => id.toUpperCase()))];
}

function main(): void {
  const allowlist = loadAllowlist();
  const today = todayUtcDate();

  let stdout = "";
  try {
    stdout = execSync("pnpm audit --prod --json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    stdout = err.stdout ?? "";
    if (!stdout.trim()) {
      console.error("pnpm audit --prod --json failed without JSON output");
      if (err.stderr) console.error(err.stderr);
      process.exit(1);
    }
  }

  let parsed: { advisories?: Record<string, AuditAdvisory> };
  try {
    parsed = JSON.parse(stdout) as {
      advisories?: Record<string, AuditAdvisory>;
    };
  } catch {
    console.error("Unable to parse pnpm audit JSON");
    process.exit(1);
  }

  const advisories = Object.values(parsed.advisories ?? {});
  const high = advisories.filter((a) =>
    ["high", "critical"].includes(String(a.severity ?? "").toLowerCase()),
  );

  const activeExceptions = allowlist.exceptions.filter((e) => e.expiry >= today);
  const expired = allowlist.exceptions.filter((e) => e.expiry < today);
  if (expired.length > 0) {
    console.error("Expired advisory allowlist entries (must renew or remove):");
    for (const e of expired) {
      console.error(`  - ${e.advisoryId} (${e.package}) expired ${e.expiry}`);
    }
    process.exit(1);
  }

  const unresolved: string[] = [];
  for (const adv of high) {
    const ids = advisoryIds(adv);
    const pkg = adv.module_name ?? "unknown";
    const paths =
      adv.findings?.flatMap((f) => f.paths ?? []) ??
      ([] as string[]);
    const matched = activeExceptions.some((ex) => {
      const exId = ex.advisoryId.toUpperCase();
      if (!ids.includes(exId) && !ids.includes(String(adv.id ?? ""))) {
        return false;
      }
      if (ex.package !== pkg) return false;
      if (paths.length === 0) return true;
      return paths.some(
        (p) => p === ex.path || p.startsWith(`${ex.path}>`) || p.includes(ex.path),
      );
    });
    if (!matched) {
      unresolved.push(
        `${adv.severity} ${pkg} ${ids.join("|") || "no-id"} paths=${paths.join(" ; ") || "(none)"}`,
      );
    }
  }

  if (unresolved.length > 0) {
    console.error(
      `Unresolved high/critical production advisories (${unresolved.length}):`,
    );
    for (const line of unresolved) console.error(`  - ${line}`);
    console.error(
      "Remediate via upgrades/overrides, or add a reviewed allowlist entry in security/advisory-allowlist.json",
    );
    process.exit(1);
  }

  console.log(
    `Production audit gate passed: ${high.length} high/critical finding(s), ${activeExceptions.length} active allowlist exception(s).`,
  );
}

main();
