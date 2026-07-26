/**
 * Break-glass step-up MFA verification (mock).
 * Wire to passkey / TOTP verification service before production hardening sign-off.
 */

export type BreakGlassMfaVerificationResult =
  | { ok: true; method: "mock_passkey_or_totp" }
  | { ok: false; reason: "missing" | "invalid" };

/**
 * Mock verification for the `x-mfa-token` header.
 * Accepts any non-empty token with length >= 16 until the real passkey/TOTP
 * verifier is connected.
 */
export function verifyBreakGlassMfaToken(
  token: string | null
): BreakGlassMfaVerificationResult {
  if (!token || !token.trim()) {
    return { ok: false, reason: "missing" };
  }

  const normalized = token.trim();
  // Placeholder: reject obviously forged short tokens.
  if (normalized.length < 16) {
    return { ok: false, reason: "invalid" };
  }

  // TODO: verify against passkey assertion or TOTP challenge service.
  return { ok: true, method: "mock_passkey_or_totp" };
}
