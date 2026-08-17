import type { CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

import { requireApiSession } from "./auth-handler";

/** High-level portal roles accepted by Partner API Program routes. */
export type AuthorizationRole = "PROVIDER" | "ADMIN";

const ROLE_ALIASES: Record<AuthorizationRole, UserRole[]> = {
  PROVIDER: ["provider_admin", "transport_operator"],
  ADMIN: ["mapable_admin"],
};

function userHasAuthorizationRole(
  user: CurrentUser,
  role: AuthorizationRole
): boolean {
  if (role === "ADMIN") {
    return isAdminRole(user.primaryRole) || user.roles.some(isAdminRole);
  }

  const allowed = ROLE_ALIASES[role];
  return (
    allowed.includes(user.primaryRole) ||
    user.roles.some((r) => allowed.includes(r))
  );
}

/**
 * Protects an App Router route handler, requiring at least one of the given
 * high-level roles (PROVIDER or ADMIN).
 */
export function withAuthorization(
  roles: AuthorizationRole[],
  handler: (req: Request, user: CurrentUser) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const allowed = roles.some((role) => userHasAuthorizationRole(user, role));
    if (!allowed) return apiForbidden();

    return handler(req, user);
  };
}
