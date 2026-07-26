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

/**
 * Resolve authenticated socket identity from the handshake.
 * Prefers structured auth fields; falls back to a compact token payload.
 *
 * Token formats accepted (scaffold):
 * - Opaque bearer with companion `userId` + `role` on `handshake.auth`
 * - `base64url(JSON.stringify({ userId, role, roomGrants?, exp? }))`
 */
export function resolveSocketIdentity(
  handshakeAuth: unknown
): SocketIdentity | null {
  if (!handshakeAuth || typeof handshakeAuth !== "object") return null;

  const auth = handshakeAuth as HandshakeAuth;
  const token = typeof auth.token === "string" ? auth.token.trim() : "";
  if (!token || token.length < 16) return null;

  if (typeof auth.userId === "string" && auth.userId.trim()) {
    const role =
      typeof auth.role === "string" && auth.role.trim()
        ? auth.role.trim()
        : "unknown";
    return {
      userId: auth.userId.trim(),
      role,
      roomGrants: normalizeRoomGrants(auth.roomGrants),
    };
  }

  return decodeCompactIdentityToken(token);
}

function normalizeRoomGrants(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const grants = value.filter(
    (item): item is string => typeof item === "string" && item.length > 0
  );
  return grants.length > 0 ? grants : undefined;
}

function decodeCompactIdentityToken(token: string): SocketIdentity | null {
  try {
    const payloadPart = token.includes(".") ? token.split(".")[0]! : token;
    const json = Buffer.from(payloadPart, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as {
      userId?: unknown;
      role?: unknown;
      roomGrants?: unknown;
      exp?: unknown;
    };

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

/** @deprecated Prefer resolveSocketIdentity — kept for compatibility. */
export function verifySocketToken(token: string): boolean {
  return Boolean(token && token.length > 10);
}
