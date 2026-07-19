import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export type BreakGlassPurpose =
  | "tenant_read"
  | "tenant_write"
  | "participant_support"
  | "incident_response"
  | "billing_exception"
  | "security_investigation";

export type BreakGlassSession = {
  id: string;
  adminUserId: string;
  purpose: BreakGlassPurpose;
  organisationId?: string;
  participantId?: string;
  reason: string;
  openedAt: string;
  expiresAt: string;
  ticketRef?: string;
};

/** In-memory store for audited break-glass sessions (process-local). */
const sessions = new Map<string, BreakGlassSession>();

export class BreakGlassRequiredError extends Error {
  readonly status = 403;

  constructor(message = "Break-glass session required for admin tenant access") {
    super(message);
    this.name = "BreakGlassRequiredError";
  }
}

export function isAdminBreakGlassRequired(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.MAPABLE_REQUIRE_ADMIN_BREAK_GLASS === "true") return true;
  if (env.MAPABLE_REQUIRE_ADMIN_BREAK_GLASS === "false") return false;
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
}

export function openBreakGlassSession(input: {
  admin: CurrentUser;
  purpose: BreakGlassPurpose;
  reason: string;
  organisationId?: string;
  participantId?: string;
  ticketRef?: string;
  ttlMinutes?: number;
}): BreakGlassSession {
  if (!isAdminRole(input.admin.primaryRole)) {
    throw new BreakGlassRequiredError("Only platform admins may open break-glass");
  }
  const reason = input.reason.trim();
  if (reason.length < 12) {
    throw new BreakGlassRequiredError(
      "Break-glass reason must be at least 12 characters",
    );
  }
  const ttl = Math.min(Math.max(input.ttlMinutes ?? 60, 5), 240);
  const openedAt = new Date();
  const expiresAt = new Date(openedAt.getTime() + ttl * 60_000);
  const session: BreakGlassSession = {
    id: `bg_${openedAt.getTime()}_${input.admin.id.slice(0, 8)}`,
    adminUserId: input.admin.id,
    purpose: input.purpose,
    organisationId: input.organisationId,
    participantId: input.participantId,
    reason,
    openedAt: openedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    ticketRef: input.ticketRef,
  };
  sessions.set(session.id, session);
  return session;
}

export function getActiveBreakGlass(
  adminUserId: string,
  organisationId?: string,
): BreakGlassSession | null {
  const now = Date.now();
  for (const session of sessions.values()) {
    if (session.adminUserId !== adminUserId) continue;
    if (Date.parse(session.expiresAt) <= now) {
      sessions.delete(session.id);
      continue;
    }
    if (
      organisationId &&
      session.organisationId &&
      session.organisationId !== organisationId
    ) {
      continue;
    }
    return session;
  }
  return null;
}

export function revokeBreakGlassSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

/** Test helper — clears all sessions. */
export function __resetBreakGlassSessionsForTests(): void {
  sessions.clear();
}

/**
 * Platform admins may bypass org membership only with an active break-glass
 * session when MAPABLE_REQUIRE_ADMIN_BREAK_GLASS is enforced.
 */
export function assertAdminTenantAccess(
  user: CurrentUser,
  organisationId: string,
): void {
  if (!isAdminRole(user.primaryRole)) return;
  if (!isAdminBreakGlassRequired()) return;
  const active = getActiveBreakGlass(user.id, organisationId);
  if (!active) {
    throw new BreakGlassRequiredError(
      `Admin access to organisation ${organisationId} requires an active break-glass session`,
    );
  }
}
