import type { SocketIdentity } from "../auth/socket-auth";

const DISPATCHER_ROLES = new Set([
  "mapable_admin",
  "provider_admin",
  "transport_operator",
]);

const WORKER_ROLES = new Set([
  "support_worker",
  "support_coordinator",
  "provider_admin",
  "mapable_admin",
]);

export type ParsedRoom =
  | { kind: "user"; resourceId: string; raw: string }
  | { kind: "thread"; resourceId: string; raw: string }
  | { kind: "provider"; resourceId: string; raw: string }
  | { kind: "booking"; resourceId: string; raw: string }
  | { kind: "support-ticket"; resourceId: string; raw: string }
  | { kind: "quality"; resourceId: string; raw: string }
  | { kind: "trip"; resourceId: string; raw: string }
  | { kind: "care"; resourceId: string; raw: string };

export class RoomAuthorizationError extends Error {
  readonly code = "ROOM_FORBIDDEN";

  constructor(message = "Not authorised to join this room") {
    super(message);
    this.name = "RoomAuthorizationError";
  }
}

/**
 * Parse a client-supplied room id into a typed resource reference.
 * Rejects opaque / unrecognised formats — never trust raw room strings.
 */
export function parseRoomId(room: string): ParsedRoom | null {
  if (typeof room !== "string") return null;
  const raw = room.trim();
  if (!raw || raw.length > 200) return null;

  const prefixed = raw.match(
    /^(user|thread|provider|booking|support-ticket|quality):([A-Za-z0-9_-]+)$/,
  );
  if (prefixed) {
    return {
      kind: prefixed[1] as ParsedRoom["kind"],
      resourceId: prefixed[2]!,
      raw,
    };
  }

  const underscored = raw.match(/^(trip|care)_([A-Za-z0-9_-]+)$/);
  if (underscored) {
    return {
      kind: underscored[1] as "trip" | "care",
      resourceId: underscored[2]!,
      raw,
    };
  }

  return null;
}

/** Legacy prefix allow-list (structural only — not an authorization decision). */
export function isAllowedRoom(room: string): boolean {
  return parseRoomId(room) !== null;
}

/**
 * Async authorization for realtime room joins (anti-IDOR).
 * Validates the authenticated socket identity against the requested room.
 * Throws RoomAuthorizationError when the client must be rejected/disconnected.
 */
export async function authorizeRoomJoin(
  identity: SocketIdentity,
  roomId: string,
): Promise<ParsedRoom> {
  if (!identity.userId || !identity.role) {
    throw new RoomAuthorizationError("Unauthenticated socket");
  }

  const parsed = parseRoomId(roomId);
  if (!parsed) {
    throw new RoomAuthorizationError("Invalid room id");
  }

  // Explicit grants issued with the auth token (server-minted allow list).
  if (identity.roomGrants?.includes(parsed.raw)) {
    return parsed;
  }

  const allowed = await resolveRoomMembership(identity, parsed);
  if (!allowed) {
    throw new RoomAuthorizationError(
      `Forbidden: ${identity.userId} cannot join ${parsed.raw}`,
    );
  }

  return parsed;
}

/**
 * Membership check for a specific session/resource.
 * Scaffold implementation — replace lookup internals with API/DB calls that
 * verify participant, assigned worker, or dispatcher relationships.
 */
async function resolveRoomMembership(
  identity: SocketIdentity,
  room: ParsedRoom,
): Promise<boolean> {
  // Yield once so this remains a true async boundary for future I/O.
  await Promise.resolve();

  switch (room.kind) {
    case "user":
      // Private user channel — only the owning user.
      return identity.userId === room.resourceId;

    case "provider":
      return (
        DISPATCHER_ROLES.has(identity.role) ||
        identity.userId === room.resourceId
      );

    case "thread":
    case "support-ticket":
    case "quality":
      // Require an explicit server-minted grant (no ambient join by guessable id).
      return false;

    case "booking":
    case "care":
      // Participant self-join by matching id, or assigned worker / dispatcher roles
      // that have been granted via roomGrants. Ambient role alone is insufficient
      // for booking/care rooms (prevents IDOR via care_456 enumeration).
      if (identity.userId === room.resourceId) return true;
      if (WORKER_ROLES.has(identity.role) || DISPATCHER_ROLES.has(identity.role)) {
        // Role is necessary but not sufficient — require grant for the specific session.
        return false;
      }
      return false;

    case "trip":
      // Trip rooms: only the trip participant (matching id) or a dispatcher
      // with an explicit grant for that trip.
      if (identity.userId === room.resourceId) return true;
      if (DISPATCHER_ROLES.has(identity.role)) {
        return false;
      }
      return false;

    default: {
      const _exhaustive: never = room;
      return _exhaustive;
    }
  }
}

/**
 * Authorize join or throw; caller should disconnect on failure.
 */
export async function assertCanJoinRoomOrThrow(
  identity: SocketIdentity | null | undefined,
  roomId: string,
): Promise<ParsedRoom> {
  if (!identity) {
    throw new RoomAuthorizationError("Unauthenticated socket");
  }
  return authorizeRoomJoin(identity, roomId);
}
