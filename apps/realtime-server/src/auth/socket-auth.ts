import { createHmac, timingSafeEqual } from "crypto";

export type SocketIdentity = {
  userId: string;
  role: string;
  /** Optional explicit room grants issued with the auth token. */
  roomGrants?: string[];
};

type HandshakeAuth = {
  token?: unknown;
  userId?: unknown;
  role?: unknown;
  roomGrants?: unknown;
};

type SignedSocketPayload = {
  userId: string;
  role: string;
  roomGrants?: string[];
  exp?: number;
};

function authSecret(): string | null {
  const secret =
    process.env.SOCKETIO_AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "";
  return secret.length >= 16 ? secret : null;
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Mint a verified socket JWT (HMAC). Used by Next.js when issuing socket auth.
 * Format: `base64url(JSON).base64url(hmac)`
 */
export function mintSocketAuthToken(
  identity: SocketIdentity,
  options?: { expiresInSec?: number; secret?: string },
): string {
  const secret = options?.secret ?? authSecret();
  if (!secret) {
    throw new Error("SOCKETIO_AUTH_SECRET_MISSING");
  }
  const exp =
    Math.floor(Date.now() / 1000) + (options?.expiresInSec ?? 60 * 60);
  const payload: SignedSocketPayload = {
    userId: identity.userId,
    role: identity.role,
    roomGrants: identity.roomGrants,
    exp,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${encoded}.${signPayload(encoded, secret)}`;
}

/**
 * Resolve authenticated socket identity from the handshake.
 * Only accepts HMAC-signed tokens — client-spoofed userId/role are ignored.
 */
export function resolveSocketIdentity(
  handshakeAuth: unknown,
): SocketIdentity | null {
  if (!handshakeAuth || typeof handshakeAuth !== "object") return null;

  const auth = handshakeAuth as HandshakeAuth;
  const token = typeof auth.token === "string" ? auth.token.trim() : "";
  if (!token) return null;

  const verified = verifySignedSocketToken(token);
  if (!verified) return null;

  // Never trust companion handshake userId/role over the signed payload.
  return verified;
}

export function verifySignedSocketToken(token: string): SocketIdentity | null {
  const secret = authSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<SignedSocketPayload>;

    if (typeof parsed.userId !== "string" || !parsed.userId.trim()) {
      return null;
    }
    if (typeof parsed.exp === "number" && parsed.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      userId: parsed.userId.trim(),
      role:
        typeof parsed.role === "string" && parsed.role.trim()
          ? parsed.role.trim()
          : "unknown",
      roomGrants: normalizeRoomGrants(parsed.roomGrants),
    };
  } catch {
    return null;
  }
}

function normalizeRoomGrants(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const grants = value.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  return grants.length > 0 ? grants : undefined;
}

/** @deprecated Prefer resolveSocketIdentity — kept for compatibility. */
export function verifySocketToken(token: string): boolean {
  return verifySignedSocketToken(token) !== null;
}
