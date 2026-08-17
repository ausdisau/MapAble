import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveNextAuthSecret", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  it("returns NEXTAUTH_SECRET when long enough", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      VERCEL_ENV: undefined,
      NEXTAUTH_SECRET: "a".repeat(32),
    };
    const { resolveNextAuthSecret } =
      await import("@/lib/auth/nextauth-env");
    expect(resolveNextAuthSecret()).toBe("a".repeat(32));
  });

  it("falls back to SESSION_SECRET", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      VERCEL_ENV: undefined,
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "b".repeat(32),
    };
    const { resolveNextAuthSecret } =
      await import("@/lib/auth/nextauth-env");
    expect(resolveNextAuthSecret()).toBe("b".repeat(32));
  });

  it("uses MAPABLE_PREVIEW_AUTH_SECRET on Vercel preview", async () => {
    process.env = {
      ...env,
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      NEXTAUTH_SECRET: "",
      MAPABLE_PREVIEW_AUTH_SECRET: "c".repeat(32),
    };
    const { resolveNextAuthSecret } =
      await import("@/lib/auth/nextauth-env");
    expect(resolveNextAuthSecret()).toBe("c".repeat(32));
  });

  it("returns undefined on Vercel production when unset", async () => {
    process.env = {
      ...env,
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "",
      AUTH_SECRET: "",
      MAPABLE_PREVIEW_AUTH_SECRET: "",
    };
    const { resolveNextAuthSecret } =
      await import("@/lib/auth/nextauth-env");
    expect(resolveNextAuthSecret()).toBeUndefined();
  });

  it("returns undefined on Vercel preview when no platform secret is set", async () => {
    process.env = {
      ...env,
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      NEXTAUTH_SECRET: "",
      MAPABLE_PREVIEW_AUTH_SECRET: "",
    };
    const { resolveNextAuthSecret } =
      await import("@/lib/auth/nextauth-env");
    expect(resolveNextAuthSecret()).toBeUndefined();
  });

  it("uses dev-only fallback locally when unset", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      VERCEL_ENV: undefined,
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "",
      AUTH_SECRET: "",
    };
    const { resolveNextAuthSecret } =
      await import("@/lib/auth/nextauth-env");
    expect(resolveNextAuthSecret()).toMatch(/^mapable-dev-only-nextauth-secret/);
  });
});
