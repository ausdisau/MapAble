import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import { resolveNextAuthSecret } from "@/lib/auth/nextauth-env";

const ROOM_TOKEN_TTL_SECONDS = 60 * 60; // 60 minutes
const ROOM_TOKEN_VERSION = "th1";

export type TelehealthRoomTokenClaims = {
  roomId: string;
  userId: string;
  role: "participant" | "clinician";
  exp: number;
  iat: number;
  jti: string;
};

export type TelehealthRoomTokenBundle = {
  /** Opaque bearer for WebRTC / LiveKit / Twilio-style join. */
  token: string;
  /** ISO expiry (60 minutes from issue). */
  expiresAt: string;
  /** Provider-shaped metadata for client SDKs. */
  provider: {
    identity: string;
    roomName: string;
    e2eeRequired: true;
  };
};

function signingSecret(): string {
  const secret =
    process.env.TELEHEALTH_ROOM_TOKEN_SECRET?.trim() ||
    resolveNextAuthSecret();
  if (!secret) {
    throw new Error("TELEHEALTH_ROOM_TOKEN_SECRET or NEXTAUTH_SECRET required");
  }
  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", signingSecret())
    .update(`${ROOM_TOKEN_VERSION}.${encodedPayload}`)
    .digest("base64url");
}

/**
 * Issue a short-lived, cryptographically signed telehealth room token (60m).
 * Scaffold shape mirrors LiveKit/Twilio join tokens until a provider is wired.
 */
export function issueTelehealthRoomToken(input: {
  roomId: string;
  userId: string;
  role: "participant" | "clinician";
}): TelehealthRoomTokenBundle {
  const now = Math.floor(Date.now() / 1000);
  const claims: TelehealthRoomTokenClaims = {
    roomId: input.roomId,
    userId: input.userId,
    role: input.role,
    iat: now,
    exp: now + ROOM_TOKEN_TTL_SECONDS,
    jti: randomBytes(16).toString("base64url"),
  };

  const encodedPayload = Buffer.from(JSON.stringify(claims), "utf8").toString(
    "base64url",
  );
  const token = `${ROOM_TOKEN_VERSION}.${encodedPayload}.${sign(encodedPayload)}`;

  return {
    token,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
    provider: {
      identity: input.userId,
      roomName: input.roomId,
      e2eeRequired: true,
    },
  };
}

export function verifyTelehealthRoomToken(
  token: string,
): TelehealthRoomTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== ROOM_TOKEN_VERSION) return null;

  const [, encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as TelehealthRoomTokenClaims;
    if (
      typeof claims.exp !== "number" ||
      claims.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}
