import {
  requireApiPermission,
  requireApiSession,
} from "@/lib/api/auth-handler";
import type { CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden } from "@/lib/auth/guards";
import {
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

/**
 * Thin wrapper around requireApiPermission for billing:* checks.
 */
export async function requireBillingPermission(
  permission: Permission
): Promise<CurrentUser | Response> {
  return requireApiPermission(permission);
}

/**
 * Require any one of the given billing permissions.
 */
export async function requireAnyBillingPermission(
  permissions: Permission[]
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const allowed = permissions.some((p) =>
    hasPermission(user.primaryRole, p)
  );
  if (!allowed) return apiForbidden();
  return user;
}
