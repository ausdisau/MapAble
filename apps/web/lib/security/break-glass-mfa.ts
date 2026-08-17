/**
 * Break-glass step-up MFA verification via WebAuthn / passkey assertion tokens.
 * Fail-closed — no mock accept-any path.
 */

import { verifyTwoFactorToken } from "@/lib/auth/two-factor-token";

export type BreakGlassMfaVerificationResult =
  | { ok: true; method: "webauthn_step_up"; userId: string }
  | { ok: false; reason: "missing" | "invalid" };

const STEP_UP_PURPOSES = [
  "step-up-mfa",
  "credentials-2fa",
  "credentials-passkey",
  "passkey-authentication",
] as const;

/**
 * Verify `x-mfa-token` / assertion material as a signed step-up token.
 * Optionally bind to an expected userId when known.
 */
export function verifyBreakGlassMfaToken(
  token: string | null,
  expectedUserId?: string,
): BreakGlassMfaVerificationResult {
  if (!token || !token.trim()) {
    return { ok: false, reason: "missing" };
  }

  const normalized = token.trim();
  for (const purpose of STEP_UP_PURPOSES) {
    const verified = verifyTwoFactorToken(normalized, purpose);
    if (!verified?.userId) continue;
    if (expectedUserId && verified.userId !== expectedUserId) {
      return { ok: false, reason: "invalid" };
    }
    return { ok: true, method: "webauthn_step_up", userId: verified.userId };
  }

  return { ok: false, reason: "invalid" };
}
