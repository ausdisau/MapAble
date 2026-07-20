import { afterEach, describe, expect, it } from "vitest";

import {
  CANONICAL_PRODUCTION_ORIGIN,
  getCanonicalPublicOrigin,
  validateProductionDatabaseUrls,
  validateProductionNextAuthSecret,
  validateProductionPublicUrls,
  validatePublicOriginUrl,
} from "@/lib/config/canonical-url";

function env(partial: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return partial as unknown as NodeJS.ProcessEnv;
}

describe("canonical URL resolver", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults to apex canonical origin in production when unset", () => {
    const origin = getCanonicalPublicOrigin(env({ NODE_ENV: "production" }));
    expect(origin).toBe(CANONICAL_PRODUCTION_ORIGIN);
    expect(origin).not.toMatch(/localhost|127\.0\.0\.1|www\.mapable/);
  });

  it("prefers NEXT_PUBLIC_APP_URL when valid and strips trailing slash", () => {
    const origin = getCanonicalPublicOrigin(
      env({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://mapable.com.au/",
      }),
    );
    expect(origin).toBe("https://mapable.com.au");
  });

  it.each([
    ["http://localhost:3000", /https|localhost/i],
    ["https://127.0.0.1", /localhost|loopback/i],
    ["http://mapable.com.au", /https/i],
    ["https://www.mapable.com.au", /www|apex|canonical/i],
    ["https://mapable.com.au:8443", /port/i],
    ["https://mapable.com.au/app", /path/i],
    ["https://mapable.com.au/?x=1", /query|fragment|origin-only/i],
    ["https://mapable.com.au/#frag", /query|fragment|origin-only/i],
    ["https://user:pass@mapable.com.au", /credential/i],
    ["https://staging.mapable.com.au", /exactly|canonical/i],
  ])("rejects production public URL %s", (value, messageRe) => {
    const issue = validatePublicOriginUrl(value, "NEXTAUTH_URL");
    expect(issue).not.toBeNull();
    expect(issue!.message).toMatch(messageRe);
  });

  it.each(["https://mapable.com.au", "https://mapable.com.au/"])(
    "accepts canonical apex %s",
    (value) => {
      expect(validatePublicOriginUrl(value, "NEXTAUTH_URL")).toBeNull();
    },
  );

  it("requires matching NEXTAUTH_URL and NEXT_PUBLIC_APP_URL in production", () => {
    const issues = validateProductionPublicUrls(
      env({
        NODE_ENV: "production",
        NEXTAUTH_URL: "https://mapable.com.au",
        NEXT_PUBLIC_APP_URL: "https://www.mapable.com.au",
      }),
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  it("allows matching apex URLs when one has a trailing slash", () => {
    const issues = validateProductionPublicUrls(
      env({
        NODE_ENV: "production",
        NEXTAUTH_URL: "https://mapable.com.au/",
        NEXT_PUBLIC_APP_URL: "https://mapable.com.au",
      }),
    );
    expect(issues).toEqual([]);
  });

  it("requires DATABASE_URL and DIRECT_URL in production", () => {
    const issues = validateProductionDatabaseUrls(
      env({ NODE_ENV: "production" }),
    );
    expect(issues.map((i) => i.variable).sort()).toEqual([
      "DATABASE_URL",
      "DIRECT_URL",
    ]);
  });

  it("rejects short NEXTAUTH_SECRET in production", () => {
    const issues = validateProductionNextAuthSecret(
      env({
        NODE_ENV: "production",
        NEXTAUTH_SECRET: "short",
      }),
    );
    expect(issues[0]?.message).toMatch(/16/);
  });

  it("never emits localhost for production canonical origin output", () => {
    const origin = getCanonicalPublicOrigin(
      env({
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NEXTAUTH_URL: "http://127.0.0.1:3000",
      }),
    );
    expect(origin).toBe(CANONICAL_PRODUCTION_ORIGIN);
    expect(origin).not.toContain("localhost");
  });
});
