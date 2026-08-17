import { afterEach, describe, expect, it, vi } from "vitest";

describe("getConfiguredOAuthProviders", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  it("returns false when OAuth env is unset", async () => {
    process.env = {
      ...env,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      AZURE_AD_CLIENT_ID: "",
      AZURE_AD_CLIENT_SECRET: "",
    };
    const { getConfiguredOAuthProviders } =
      await import("@/lib/auth/oauth-providers");
    expect(getConfiguredOAuthProviders()).toEqual({
      auth0: false,
      google: false,
      microsoft: false,
      facebook: false,
      apple: false,
    });
  });

  it("detects Google when credentials are present", async () => {
    process.env = {
      ...env,
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
      AZURE_AD_CLIENT_ID: "",
      AZURE_AD_CLIENT_SECRET: "",
      FACEBOOK_APP_ID: "",
      FACEBOOK_APP_SECRET: "",
    };
    const { getConfiguredOAuthProviders } =
      await import("@/lib/auth/oauth-providers");
    expect(getConfiguredOAuthProviders().google).toBe(true);
    expect(getConfiguredOAuthProviders().auth0).toBe(false);
    expect(getConfiguredOAuthProviders().microsoft).toBe(false);
    expect(getConfiguredOAuthProviders().facebook).toBe(false);
    expect(getConfiguredOAuthProviders().apple).toBe(false);
  });

  it("detects Apple when Services ID and client secret JWT are present", async () => {
    process.env = {
      ...env,
      APPLE_ID: "com.mapable.signin",
      APPLE_SECRET: "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.test",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    };
    const { getConfiguredOAuthProviders, buildOAuthProviders } =
      await import("@/lib/auth/oauth-providers");
    expect(getConfiguredOAuthProviders().apple).toBe(true);
    expect(buildOAuthProviders().some((p) => p.id === "apple")).toBe(true);
  });

  it("detects Auth0 when credentials and issuer are present", async () => {
    process.env = {
      ...env,
      AUTH0_CLIENT_ID: "auth0-id",
      AUTH0_CLIENT_SECRET: "auth0-secret",
      AUTH0_ISSUER_BASE_URL: "https://example.us.auth0.com",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      AZURE_AD_CLIENT_ID: "",
      AZURE_AD_CLIENT_SECRET: "",
      FACEBOOK_APP_ID: "",
      FACEBOOK_APP_SECRET: "",
    };
    const { getConfiguredOAuthProviders, buildOAuthProviders } =
      await import("@/lib/auth/oauth-providers");
    expect(getConfiguredOAuthProviders().auth0).toBe(true);
    expect(buildOAuthProviders().some((p) => p.id === "auth0")).toBe(true);
  });

  it("detects Auth0 when legacy issuer env is present", async () => {
    process.env = {
      ...env,
      AUTH0_CLIENT_ID: "auth0-id",
      AUTH0_CLIENT_SECRET: "auth0-secret",
      AUTH0_ISSUER: "https://example.us.auth0.com/",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      AZURE_AD_CLIENT_ID: "",
      AZURE_AD_CLIENT_SECRET: "",
      FACEBOOK_APP_ID: "",
      FACEBOOK_APP_SECRET: "",
    };
    const { getConfiguredOAuthProviders, buildOAuthProviders } =
      await import("@/lib/auth/oauth-providers");
    expect(getConfiguredOAuthProviders().auth0).toBe(true);
    expect(buildOAuthProviders().some((p) => p.id === "auth0")).toBe(true);
  });

  it("detects Google when alias credentials are present", async () => {
    process.env = {
      ...env,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      GOOGLE_ID: "google-id",
      GOOGLE_SECRET: "google-secret",
      AZURE_AD_CLIENT_ID: "",
      AZURE_AD_CLIENT_SECRET: "",
      FACEBOOK_APP_ID: "",
      FACEBOOK_APP_SECRET: "",
    };
    const { getConfiguredOAuthProviders, buildOAuthProviders } =
      await import("@/lib/auth/oauth-providers");
    expect(getConfiguredOAuthProviders().google).toBe(true);
    expect(buildOAuthProviders().some((p) => p.id === "google")).toBe(true);
  });

  it("detects Google when Auth.js credentials are present", async () => {
    process.env = {
      ...env,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      GOOGLE_ID: "",
      GOOGLE_SECRET: "",
      AUTH_GOOGLE_ID: "google-id",
      AUTH_GOOGLE_SECRET: "google-secret",
      AZURE_AD_CLIENT_ID: "",
      AZURE_AD_CLIENT_SECRET: "",
      FACEBOOK_APP_ID: "",
      FACEBOOK_APP_SECRET: "",
    };
    const { getConfiguredOAuthProviders, buildOAuthProviders } =
      await import("@/lib/auth/oauth-providers");
    expect(getConfiguredOAuthProviders().google).toBe(true);
    expect(buildOAuthProviders().some((p) => p.id === "google")).toBe(true);
  });

  it("detects Facebook when app id and secret are present", async () => {
    process.env = {
      ...env,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      FACEBOOK_APP_ID: "1798843646962949",
      FACEBOOK_APP_SECRET: "fb-secret",
    };
    const { getConfiguredOAuthProviders, buildOAuthProviders } =
      await import("@/lib/auth/oauth-providers");
    expect(getConfiguredOAuthProviders().facebook).toBe(true);
    expect(buildOAuthProviders().some((p) => p.id === "facebook")).toBe(true);
  });
});
