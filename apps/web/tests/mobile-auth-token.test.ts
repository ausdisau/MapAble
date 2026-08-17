import { createHash } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createMobileAccessToken,
  createMobileAuthorizationCode,
  exchangeMobileAuthorizationCode,
  verifyMobileAccessToken,
} from "../lib/auth/mobile-token";

const originalSecret = process.env.MOBILE_AUTH_SECRET;

function challengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

describe("mobile authentication tokens", () => {
  beforeEach(() => {
    process.env.MOBILE_AUTH_SECRET = "test-mobile-auth-secret-at-least-32-characters";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.MOBILE_AUTH_SECRET;
    } else {
      process.env.MOBILE_AUTH_SECRET = originalSecret;
    }
  });

  it("exchanges an authorization code only with the matching PKCE verifier and redirect URI", () => {
    const verifier = "a".repeat(64);
    const redirectUri = "mapable://auth/callback";
    const code = createMobileAuthorizationCode({
      userId: "user-123",
      codeChallenge: challengeFor(verifier),
      redirectUri,
    });

    expect(
      exchangeMobileAuthorizationCode({ code, codeVerifier: verifier, redirectUri }),
    ).toEqual({ userId: "user-123" });

    expect(
      exchangeMobileAuthorizationCode({
        code,
        codeVerifier: "b".repeat(64),
        redirectUri,
      }),
    ).toBeNull();

    expect(
      exchangeMobileAuthorizationCode({
        code,
        codeVerifier: verifier,
        redirectUri: "mapable://unexpected/callback",
      }),
    ).toBeNull();
  });

  it("enforces mobile access-token scopes", () => {
    const { accessToken } = createMobileAccessToken({
      userId: "user-456",
      scopes: ["identity:read", "accessibility:read"],
    });

    expect(verifyMobileAccessToken(accessToken, "identity:read")).toEqual({
      userId: "user-456",
      scopes: ["identity:read", "accessibility:read"],
    });
    expect(verifyMobileAccessToken(accessToken, "accessibility:write")).toBeNull();
  });

  it("rejects a tampered token", () => {
    const { accessToken } = createMobileAccessToken({
      userId: "user-789",
      scopes: ["identity:read"],
    });
    const tampered = `${accessToken.slice(0, -1)}${accessToken.endsWith("a") ? "b" : "a"}`;

    expect(verifyMobileAccessToken(tampered, "identity:read")).toBeNull();
  });
});
