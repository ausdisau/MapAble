import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertDeployedProductionEnv,
  collectDeployedProductionEnvIssues,
  shouldEnforceDeployedProductionEnv,
} from "@/lib/env/assert-deployed-production-env";

function env(partial: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return partial as unknown as NodeJS.ProcessEnv;
}

describe("deployed production env enforcement", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not enforce for local/test builds", () => {
    expect(
      shouldEnforceDeployedProductionEnv(env({ NODE_ENV: "production" })),
    ).toBe(false);
    expect(
      collectDeployedProductionEnvIssues(
        env({
          NODE_ENV: "production",
          DATABASE_URL: "postgresql://localhost/db",
        }),
      ),
    ).toEqual([]);
  });

  it("enforces on Vercel production", () => {
    expect(
      shouldEnforceDeployedProductionEnv(
        env({ VERCEL: "1", VERCEL_ENV: "production" }),
      ),
    ).toBe(true);
  });

  it("enforces when MAPABLE_ENFORCE_PRODUCTION_ENV=true", () => {
    expect(
      shouldEnforceDeployedProductionEnv(
        env({ MAPABLE_ENFORCE_PRODUCTION_ENV: "true" }),
      ),
    ).toBe(true);
  });

  it("rejects invalid production configuration", () => {
    const issues = collectDeployedProductionEnvIssues(
      env({
        VERCEL: "1",
        VERCEL_ENV: "production",
        NODE_ENV: "production",
        NEXTAUTH_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
        NEXTAUTH_SECRET: "short",
      }),
    );

    expect(issues.some((i) => i.variable === "DATABASE_URL")).toBe(true);
    expect(issues.some((i) => i.variable === "DIRECT_URL")).toBe(true);
    expect(issues.some((i) => i.variable === "NEXTAUTH_URL")).toBe(true);
    expect(issues.some((i) => i.variable === "NEXTAUTH_SECRET")).toBe(true);
  });

  it("accepts valid production configuration", () => {
    const issues = collectDeployedProductionEnvIssues(
      env({
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
      }),
    );
    expect(issues).toEqual([]);
  });

  it("allows preview secret intentionally on preview (not Vercel production enforce)", () => {
    expect(
      shouldEnforceDeployedProductionEnv(
        env({ VERCEL: "1", VERCEL_ENV: "preview" }),
      ),
    ).toBe(false);
  });

  it("throws from assertDeployedProductionEnv without printing secrets", () => {
    const secret = "super-secret-value-never-print";
    expect(() =>
      assertDeployedProductionEnv(
        env({
          MAPABLE_ENFORCE_PRODUCTION_ENV: "true",
          NEXTAUTH_SECRET: secret,
          NEXTAUTH_URL: "http://localhost:3000",
        }),
      ),
    ).toThrow(/production environment validation failed/i);

    try {
      assertDeployedProductionEnv(
        env({
          MAPABLE_ENFORCE_PRODUCTION_ENV: "true",
          NEXTAUTH_SECRET: secret,
          NEXTAUTH_URL: "http://localhost:3000",
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain(secret);
    }
  });

  it("deployment entry points import the assertion helper", async () => {
    const fs = await import("node:fs");
    const nextConfig = fs.readFileSync("next.config.ts", "utf8");
    const instrumentation = fs.readFileSync("instrumentation.ts", "utf8");
    expect(nextConfig).toMatch(/assertDeployedProductionEnv/);
    expect(instrumentation).toMatch(/assertDeployedProductionEnv/);
  });
});
