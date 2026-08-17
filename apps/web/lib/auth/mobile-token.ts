import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { resolveNextAuthSecret } from "@/lib/auth/nextauth-env";

const MOBILE_TOKEN_VERSION = "m1";
const AUTHORIZATION_CODE_TTL_SECONDS = 2 * 60;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const MINIMUM_MOBILE_SECRET_BYTES = 32;

export type MobileAccessScope =
  | "identity:read"
  | "accessibility:read"
  | "accessibility:write";

type MobileAuthorizationCodePayload = {
  kind: "authorization_code";
  userId: string;
  codeChallenge: string;
  redirectUri: string;
  exp: number;
  nonce: string;
};

type MobileAccessTokenPayload = {
  kind: "access_token";
  userId: string;
  scopes: MobileAccessScope[];
  exp: number;
  nonce: string;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signingSecret(): string {
  const configured = process.env.MOBILE_AUTH_SECRET?.trim();
  if (configured) {
    if (Buffer.byteLength(configured, "utf8") < MINIMUM_MOBILE_SECRET_BYTES) {
      throw new Error(
        `MOBILE_AUTH_SECRET must contain at least ${MINIMUM_MOBILE_SECRET_BYTES} bytes`,
      );
    }
    return configured;
  }

  if (process.env.NODE_ENV !== "production") {
    return resolveNextAuthSecret();
  }

  throw new Error("MOBILE_AUTH_SECRET is required for mobile authentication");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", signingSecret())
    .update(`${MOBILE_TOKEN_VERSION}.${encodedPayload}`)
    .digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

function encodeSignedPayload(payload: object): string {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${MOBILE_TOKEN_VERSION}.${encodedPayload}.${signPayload(encodedPayload)}`;
}

function decodeSignedPayload(token: string): unknown | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [version, encodedPayload, signature] = parts;
  if (version !== MOBILE_TOKEN_VERSION || !encodedPayload || !signature) {
    return null;
  }

  const expected = signPayload(encodedPayload);
  if (!safeEqual(signature, expected)) return null;

  try {
    return JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return null;
  }
}

export function createMobileAuthorizationCode({
  userId,
  codeChallenge,
  redirectUri,
}: {
  userId: string;
  codeChallenge: string;
  redirectUri: string;
}): string {
  const payload: MobileAuthorizationCodePayload = {
    kind: "authorization_code",
    userId,
    codeChallenge,
    redirectUri,
    exp: Math.floor(Date.now() / 1000) + AUTHORIZATION_CODE_TTL_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
  };

  return encodeSignedPayload(payload);
}

export function exchangeMobileAuthorizationCode({
  code,
  codeVerifier,
  redirectUri,
}: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): { userId: string } | null {
  const decoded = decodeSignedPayload(code);
  if (!decoded || typeof decoded !== "object") return null;

  const payload = decoded as Partial<MobileAuthorizationCodePayload>;
  if (
    payload.kind !== "authorization_code" ||
    typeof payload.userId !== "string" ||
    typeof payload.codeChallenge !== "string" ||
    typeof payload.redirectUri !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000) ||
    payload.redirectUri !== redirectUri
  ) {
    return null;
  }

  const calculatedChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  if (!safeEqual(calculatedChallenge, payload.codeChallenge)) return null;

  return { userId: payload.userId };
}

export function createMobileAccessToken({
  userId,
  scopes,
}: {
  userId: string;
  scopes: MobileAccessScope[];
}): { accessToken: string; expiresIn: number } {
  const payload: MobileAccessTokenPayload = {
    kind: "access_token",
    userId,
    scopes: [...new Set(scopes)],
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
    nonce: randomBytes(16).toString("base64url"),
  };

  return {
    accessToken: encodeSignedPayload(payload),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export function verifyMobileAccessToken(
  token: string,
  requiredScope?: MobileAccessScope,
): { userId: string; scopes: MobileAccessScope[] } | null {
  const decoded = decodeSignedPayload(token);
  if (!decoded || typeof decoded !== "object") return null;

  const payload = decoded as Partial<MobileAccessTokenPayload>;
  if (
    payload.kind !== "access_token" ||
    typeof payload.userId !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000) ||
    !Array.isArray(payload.scopes) ||
    !payload.scopes.every((scope) =>
      ["identity:read", "accessibility:read", "accessibility:write"].includes(
        scope,
      ),
    )
  ) {
    return null;
  }

  const scopes = payload.scopes as MobileAccessScope[];
  if (requiredScope && !scopes.includes(requiredScope)) return null;

  return { userId: payload.userId, scopes };
}
