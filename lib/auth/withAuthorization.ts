import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  getCurrentUser,
  type CurrentUser,
} from "@/lib/auth/current-user";
import {
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor-token";
import type { UserRole } from "@/types/mapable";

/**
 * Convenience aliases accepted by `withAuthorization` role lists.
 * Canonical MapAble roles (e.g. `mapable_admin`) are always accepted as-is.
 */
const ROLE_ALIASES: Record<string, UserRole> = {
  ADMIN: "mapable_admin",
  MAPABLE_ADMIN: "mapable_admin",
  PROVIDER: "provider_admin",
  PROVIDER_ADMIN: "provider_admin",
  PARTICIPANT: "participant",
  FAMILY: "family_member",
  FAMILY_MEMBER: "family_member",
  SUPPORT_COORDINATOR: "support_coordinator",
  SUPPORT_WORKER: "support_worker",
  CARE_WORKER: "support_worker",
  TRANSPORT_OPERATOR: "transport_operator",
  DRIVER: "driver",
  PLAN_MANAGER: "plan_manager",
  EMPLOYER: "employer",
  AMBASSADOR: "ambassador",
};

export type AuthorizedRole = UserRole | keyof typeof ROLE_ALIASES | string;

export type WithAuthorizationOptions = {
  /**
   * Allowed roles (canonical MapAble roles or aliases like `ADMIN` / `PROVIDER`).
   * User must hold at least one (primary or assigned).
   */
  roles?: readonly AuthorizedRole[];
  /**
   * Optional permission checks. When set with `requireAnyPermission` (default true),
   * the user must hold at least one listed permission (via primary role matrix).
   */
  permissions?: readonly Permission[];
  requireAnyPermission?: boolean;
  /**
   * Require MFA / step-up before invoking the handler.
   * Satisfied by a valid `x-mfa-assertion` (or `x-mapable-mfa-token`) header,
   * or a session JWT marked `mfaVerified` from a 2FA/passkey login.
   */
  requireMfa?: boolean;
  /**
   * Extra authorization hook (e.g. resource ownership). Return `false` for 403,
   * a `Response` to short-circuit, or `true` to continue.
   */
  authorize?: (
    user: CurrentUser,
    request: Request,
    context: unknown,
  ) => boolean | Response | Promise<boolean | Response>;
};

/**
 * Must stay assignable to Next.js App Router's `AppRouteHandlerFnContext`
 * (`params` required Promise; value union includes `undefined`).
 */
type AppRouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

export type AuthorizedRouteHandler<
  TContext extends AppRouteContext = AppRouteContext,
> = (
  request: Request,
  context: TContext,
  user: CurrentUser,
) => Response | Promise<Response>;

function normalizeRole(role: string): UserRole | null {
  const trimmed = role.trim();
  const upper = trimmed.toUpperCase();
  if (upper in ROLE_ALIASES) return ROLE_ALIASES[upper];
  if (trimmed in ROLE_ALIASES) return ROLE_ALIASES[trimmed];
  // Canonical snake_case MapAble roles
  const canonical = new Set<string>(Object.values(ROLE_ALIASES));
  if (canonical.has(trimmed)) return trimmed as UserRole;
  if (canonical.has(trimmed.toLowerCase())) {
    return trimmed.toLowerCase() as UserRole;
  }
  return null;
}

function userHasAllowedRole(
  user: CurrentUser,
  allowed: readonly AuthorizedRole[],
): boolean {
  const normalised = allowed
    .map((r) => normalizeRole(String(r)))
    .filter((r): r is UserRole => Boolean(r));

  if (normalised.length === 0) return false;

  // Platform admins satisfy ADMIN alias lists.
  if (
    normalised.includes("mapable_admin") &&
    isAdminRole(user.primaryRole)
  ) {
    return true;
  }

  return normalised.some(
    (role) => user.primaryRole === role || user.roles.includes(role),
  );
}

function userHasAllowedPermission(
  user: CurrentUser,
  permissions: readonly Permission[],
  requireAny: boolean,
): boolean {
  if (permissions.length === 0) return true;
  if (requireAny) {
    return permissions.some((p) => hasPermission(user.primaryRole, p));
  }
  return permissions.every((p) => hasPermission(user.primaryRole, p));
}

/**
 * Verify MFA for sensitive routes.
 *
 * Order:
 * 1. Explicit step-up assertion header (`x-mfa-assertion` / `x-mapable-mfa-token`)
 * 2. Session flag `user.mfaVerified` from a 2FA or passkey login (JWT → session)
 */
export async function verifyRequestMfa(
  request: Request,
  userId: string,
): Promise<boolean> {
  const assertion =
    request.headers.get("x-mfa-assertion") ??
    request.headers.get("x-mapable-mfa-token");

  if (assertion) {
    for (const purpose of [
      "step-up-mfa",
      "credentials-2fa",
      "credentials-passkey",
      "passkey-authentication",
    ] as const) {
      const verified = verifyTwoFactorToken(assertion, purpose);
      if (verified?.userId === userId) return true;
    }
  }

  const session = await getServerSession(authOptions);
  if (
    session?.user?.id === userId &&
    (session.user as { mfaVerified?: boolean }).mfaVerified === true
  ) {
    return true;
  }

  return false;
}

/**
 * Unified App Router authorization HOC.
 *
 * Usage:
 * ```ts
 * export const POST = withAuthorization(
 *   { roles: ["ADMIN"], requireMfa: true },
 *   async (request, _ctx, user) => { ... },
 * );
 * ```
 *
 * Returns 401 when unauthenticated, 403 when role/permission/MFA checks fail,
 * before the handler runs.
 */
export function withAuthorization<
  TContext extends AppRouteContext = AppRouteContext,
>(
  options: WithAuthorizationOptions,
  handler: AuthorizedRouteHandler<TContext>,
): (
  request: Request,
  context: TContext,
) => Promise<Response> {
  return async (
    request: Request,
    context: TContext = { params: Promise.resolve({}) } as TContext,
  ) => {
    // Prefer NextAuth/Keycloak session presence, then hydrate CurrentUser from DB.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (options.roles?.length && !userHasAllowedRole(user, options.roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (options.permissions?.length) {
      const requireAny = options.requireAnyPermission ?? true;
      if (!userHasAllowedPermission(user, options.permissions, requireAny)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (options.requireMfa) {
      const mfaOk = await verifyRequestMfa(request, user.id);
      if (!mfaOk) {
        return NextResponse.json(
          {
            error: "Forbidden",
            code: "MFA_REQUIRED",
            message:
              "Multi-factor authentication is required for this action. Provide a valid x-mfa-assertion step-up token.",
          },
          { status: 403 },
        );
      }
    }

    if (options.authorize) {
      const extra = await options.authorize(user, request, context);
      if (extra instanceof Response) return extra;
      if (!extra) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return handler(request, context, user);
  };
}
