import { describe, expect, it } from "vitest";

import { createTwoFactorToken } from "@/lib/auth/two-factor-token";
import { verifyBreakGlassMfaToken } from "@/lib/security/break-glass-mfa";

describe("break-glass MFA (WebAuthn step-up)", () => {
  it("rejects missing and short mock tokens", () => {
    expect(verifyBreakGlassMfaToken(null).ok).toBe(false);
    expect(verifyBreakGlassMfaToken("short-token-12345").ok).toBe(false);
    expect(
      verifyBreakGlassMfaToken("this-is-long-enough-but-not-signed").ok,
    ).toBe(false);
  });

  it("accepts a verified step-up token bound to the user", () => {
    const token = createTwoFactorToken({
      purpose: "step-up-mfa",
      userId: "admin-1",
    });
    const result = verifyBreakGlassMfaToken(token, "admin-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.method).toBe("webauthn_step_up");
      expect(result.userId).toBe("admin-1");
    }
  });

  it("rejects a token minted for a different user", () => {
    const token = createTwoFactorToken({
      purpose: "passkey-authentication",
      userId: "other-user",
    });
    expect(verifyBreakGlassMfaToken(token, "admin-1").ok).toBe(false);
  });
});
