import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const loader = path.join(root, "tests/config/fixtures/load-next-config.mjs");

function loadNextConfig(env: Record<string, string | undefined>): {
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const merged: NodeJS.ProcessEnv = {
    ...process.env,
    ...env,
    // Prevent accidental inheritance of host secrets into assertions.
    FORCE_COLOR: "0",
  };
  // Explicitly clear keys when undefined so child does not inherit them.
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete merged[key];
    }
  }

  const result = spawnSync(process.execPath, ["--import", "tsx", loader], {
    cwd: root,
    env: merged,
    encoding: "utf8",
    timeout: 60_000,
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: `${result.stderr ?? ""}${result.stdout ?? ""}`,
  };
}

const validProduction = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  NODE_ENV: "production",
  DATABASE_URL:
    "postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require",
  DIRECT_URL:
    "postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require",
  NEXTAUTH_URL: "https://mapable.com.au",
  NEXT_PUBLIC_APP_URL: "https://mapable.com.au",
  NEXTAUTH_SECRET: "production-secret-at-least-16",
} as const;

describe("next.config production env behavioural gate", () => {
  it("fails Vercel production config load when required variables are absent", () => {
    const result = loadNextConfig({
      VERCEL: "1",
      VERCEL_ENV: "production",
      NODE_ENV: "production",
      DATABASE_URL: undefined,
      DIRECT_URL: undefined,
      NEXTAUTH_URL: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
      NEXTAUTH_SECRET: undefined,
      MAPABLE_ENFORCE_PRODUCTION_ENV: undefined,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/production environment validation failed/i);
  });

  it("fails for insecure, local or non-canonical public URLs", () => {
    const result = loadNextConfig({
      ...validProduction,
      NEXTAUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "https://www.mapable.com.au",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/NEXTAUTH_URL|NEXT_PUBLIC_APP_URL/);
  });

  it("fails for invalid database URLs", () => {
    const result = loadNextConfig({
      ...validProduction,
      DATABASE_URL: "mysql://example.com/db",
      DIRECT_URL: "not-a-url",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/DATABASE_URL|DIRECT_URL/);
  });

  it("fails for missing or weak authentication secrets", () => {
    const result = loadNextConfig({
      ...validProduction,
      NEXTAUTH_SECRET: "short",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/NEXTAUTH_SECRET/);
  });

  it("never prints secret values in errors", () => {
    const secret = "super-secret-value-never-print-xyz";
    const result = loadNextConfig({
      ...validProduction,
      NEXTAUTH_SECRET: secret,
      NEXTAUTH_URL: "http://localhost:3000",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).not.toContain(secret);
    expect(result.stdout).not.toContain(secret);
  });

  it("loads successfully with a valid production environment", () => {
    const result = loadNextConfig({ ...validProduction });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/NEXT_CONFIG_OK/);
  });

  it("keeps local/test environments usable without enforce flag", () => {
    const result = loadNextConfig({
      VERCEL: undefined,
      VERCEL_ENV: undefined,
      MAPABLE_ENFORCE_PRODUCTION_ENV: undefined,
      NODE_ENV: "test",
      DATABASE_URL: undefined,
      DIRECT_URL: undefined,
      NEXTAUTH_URL: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
      NEXTAUTH_SECRET: undefined,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/NEXT_CONFIG_OK/);
  });

  it("keeps Vercel preview usable without production enforce", () => {
    const result = loadNextConfig({
      VERCEL: "1",
      VERCEL_ENV: "preview",
      NODE_ENV: "production",
      DATABASE_URL: undefined,
      DIRECT_URL: undefined,
      NEXTAUTH_URL: "https://preview.example.vercel.app",
      NEXT_PUBLIC_APP_URL: "https://preview.example.vercel.app",
      NEXTAUTH_SECRET: undefined,
      MAPABLE_ENFORCE_PRODUCTION_ENV: undefined,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/NEXT_CONFIG_OK/);
  });

  it("activates validation outside Vercel when MAPABLE_ENFORCE_PRODUCTION_ENV=true", () => {
    const result = loadNextConfig({
      MAPABLE_ENFORCE_PRODUCTION_ENV: "true",
      NODE_ENV: "production",
      DATABASE_URL: undefined,
      DIRECT_URL: undefined,
      NEXTAUTH_URL: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
      NEXTAUTH_SECRET: undefined,
      VERCEL: undefined,
      VERCEL_ENV: undefined,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/production environment validation failed/i);
  });

  it("documents that instrumentation invokes the same validator", async () => {
    const fs = await import("node:fs");
    const instrumentation = fs.readFileSync("instrumentation.ts", "utf8");
    const nextConfig = fs.readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toMatch(/assertDeployedProductionEnv/);
    expect(instrumentation).toMatch(/assertDeployedProductionEnv/);
  });
});
