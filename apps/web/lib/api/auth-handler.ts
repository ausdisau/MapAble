import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  getCurrentUser,
  getUserById,
  type CurrentUser,
} from "@/lib/auth/current-user";
import { apiForbidden, apiUnauthorized } from "@/lib/auth/guards";
import {
  verifyMobileAccessToken,
  type MobileAccessScope,
} from "@/lib/auth/mobile-token";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

export async function requireApiSession(): Promise<
  CurrentUser | Response
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiUnauthorized();
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();
  return user;
}

export async function requireMobileBearer(
  request: Request,
  requiredScope?: MobileAccessScope,
): Promise<CurrentUser | Response> {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!authorization.startsWith("Bearer ")) return apiUnauthorized();

  const token = authorization.slice("Bearer ".length).trim();
  const verified = verifyMobileAccessToken(token, requiredScope);
  if (!verified) return apiUnauthorized();

  const user = await getUserById(verified.userId);
  if (!user) return apiUnauthorized();
  return user;
}

/**
 * Mobile-safe API boundary. If a Bearer header is present, it must be a valid
 * scoped mobile token. Otherwise, preserve the existing web cookie-session path.
 */
export async function requireApiSessionOrMobileBearer(
  request: Request,
  requiredScope?: MobileAccessScope,
): Promise<CurrentUser | Response> {
  if (request.headers.has("authorization")) {
    return requireMobileBearer(request, requiredScope);
  }
  return requireApiSession();
}

export async function requireApiPermission(
  permission: Permission
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, permission)) return apiForbidden();
  return user;
}

export async function requireApiAdmin(): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isAdminRole(user.primaryRole)) return apiForbidden();
  return user;
}

/** Requires platform admin or a specific back-of-house admin permission. */
export async function requireApiAdminScope(
  permission: Permission
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, permission)) return apiForbidden();
  return user;
}
