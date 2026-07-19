import { afterEach, describe, expect, it } from "vitest";

import {
  CANONICAL_PRODUCTION_ORIGIN,
  getCanonicalPublicOrigin,
  validateProductionDatabaseUrls,
  validateProductionNextAuthSecret,
  validateProductionPublicUrls,
  validatePublicOriginUrl,
} from "@/lib/config/canonical-url";

describe("canonical URL resolver", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults to apex canonical origin in production when unset", () => {
    const origin = getCanonicalPublicOrigin({
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv);
    expect(origin).toBe(CANONICAL_PRODUCTION_ORIGIN);
    expect(origin).not.toMatch(/localhost|127\.0\.0\.1|www\.mapable/);
  });

  it("prefers NEXT_PUBLIC_APP_URL when valid", () => {
    const origin = getCanonicalPublicOrigin({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://mapable.com.au/",
    } as NodeJS.ProcessEnv);
    expect(origin).toBe("https://mapable.com.au");
  });

  it("rejects localhost public URLs in production validation", () => {
    expect(
      validatePublicOriginUrl("http://localhost:3000", "NEXTAUTH_URL"),
    ).toMatchObject({
      variable: "NEXTAUTH_URL",
    });
    expect(
      validatePublicOriginUrl("https://127.0.0.1", "NEXT_PUBLIC_APP_URL"),
    ).toMatchObject({
      variable: "NEXT_PUBLIC_APP_URL",
    });
    expect(
      validatePublicOriginUrl("http://mapable.com.au", "NEXTAUTH_URL"),
    ).toMatchObject({
      message: expect.stringMatching(/https/i),
    });
  });

  it("accepts apex https origins", () => {
    expect(
      validatePublicOriginUrl("https://mapable.com.au", "NEXTAUTH_URL"),
    ).toBeNull();
  });

  it("requires matching NEXTAUTH_URL and NEXT_PUBLIC_APP_URL in production", () => {
    const issues = validateProductionPublicUrls({
      NODE_ENV: "production",
      NEXTAUTH_URL: "https://mapable.com.au",
      NEXT_PUBLIC_APP_URL: "https://www.mapable.com.au",
    } as NodeJS.ProcessEnv);
    expect(issues.some((i) => i.variable === "NEXTAUTH_URL")).toBe(true);
  });

  it("requires DATABASE_URL and DIRECT_URL in production", () => {
    const issues = validateProductionDatabaseUrls({
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv);
    expect(issues.map((i) => i.variable).sort()).toEqual([
      "DATABASE_URL",
      "DIRECT_URL",
    ]);
  });

  it("rejects short NEXTAUTH_SECRET in production", () => {
    const issues = validateProductionNextAuthSecret({
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "short",
    } as NodeJS.ProcessEnv);
    expect(issues[0]?.message).toMatch(/16/);
  });

  it("never emits localhost for production canonical origin output", () => {
    const origin = getCanonicalPublicOrigin({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXTAUTH_URL: "http://127.0.0.1:3000",
    } as NodeJS.ProcessEnv);
    expect(origin).toBe(CANONICAL_PRODUCTION_ORIGIN);
    expect(origin).not.toContain("localhost");
  });
});
