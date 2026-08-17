#!/usr/bin/env node
/**
 * Push critical env vars from .env to Vercel production (non-interactive).
 * Usage: pnpm exec tsx scripts/sync-vercel-production-env.ts
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "NDIS_ENCRYPTION_KEY",
  "NDIS_SERVICE_DELIVERY_MECHANISM_ENABLED",
  "NDIS_SERVICE_DELIVERY_REQUIRE_AUTH_FOR_CLAIMS",
  "NDIS_SERVICE_DELIVERY_REQUIRE_ON_SERVICE_LOGS",
] as const;

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function main() {
  const root = process.cwd();
  const merged = {
    ...parseEnvFile(path.join(root, ".env")),
    ...parseEnvFile(path.join(root, ".env.local")),
  };

  if (!merged.NEXTAUTH_URL && merged.NEXT_PUBLIC_APP_URL) {
    merged.NEXTAUTH_URL = merged.NEXT_PUBLIC_APP_URL;
  }

  let synced = 0;
  for (const key of KEYS) {
    const value = merged[key]?.trim();
    if (!value) {
      console.warn(`skip ${key} (not in .env / .env.local)`);
      continue;
    }
    execSync(`pnpm dlx vercel@latest env add ${key} production --force`, {
      input: value,
      stdio: ["pipe", "inherit", "inherit"],
      env: process.env,
    });
    synced += 1;
    console.log(`synced ${key}`);
  }

  console.log(`Done. Synced ${synced} variable(s) to Vercel production.`);
}

main();
