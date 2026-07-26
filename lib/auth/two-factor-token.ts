import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { resolveNextAuthSecret } from "@/lib/auth/nextauth-env";

const TWO_FACTOR_TOKEN_VERSION = "v1";

export type TwoFactorTokenPurpose =
  | "credentials-2fa"
  | "credentials-passkey"
  | "passkey-authentication"
  | "passkey-registration"
  | "twilio-2fa-challenge"
  /** Short-lived step-up assertion for sensitive API mutations (e.g. break-glass). */
  | "step-up-mfa";

type TwoFactorTokenPayload = {
  challenge?: string;
  exp: number;
  nonce: string;
  purpose: TwoFactorTokenPurpose;
  userId: string;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signingSecret(): string {
  const secret = resolveNextAuthSecret();
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for two-factor tokens");
  }
  return secret;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", signingSecret())
    .update(`${TWO_FACTOR_TOKEN_VERSION}.${encodedPayload}`)
    .digest("base64url");
}

export function createTwoFactorToken({
  challenge,
  purpose,
  userId,
  ttlSeconds = 10 * 60,
}: {
  challenge?: string;
  purpose: TwoFactorTokenPurpose;
  userId: string;
  ttlSeconds?: number;
}): string {
  const payload: TwoFactorTokenPayload = {
    challenge,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: randomBytes(16).toString("base64url"),
    purpose,
    userId,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${TWO_FACTOR_TOKEN_VERSION}.${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyTwoFactorToken(
  token: string,
  purpose: TwoFactorTokenPurpose,
): { challenge?: string; userId: string } | null {
  const [version, encodedPayload, signature] = token.split(".");
  if (version !== TWO_FACTOR_TOKEN_VERSION || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload),
    ) as Partial<TwoFactorTokenPayload>;
    if (
      payload.purpose !== purpose ||
      typeof payload.userId !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      challenge:
        typeof payload.challenge === "string" ? payload.challenge : undefined,
      userId: payload.userId,
    };
  } catch {
    return null;
  }
}
