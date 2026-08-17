import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

/** Participant (or family with read) may use participant transport shells. */
export function canAccessParticipantTransport(user: CurrentUser): boolean {
  return (
    hasPermission(user.primaryRole, "transport:manage:self") ||
    hasPermission(user.primaryRole, "transport:read:self") ||
    isAdminRole(user.primaryRole)
  );
}

export function canManageParticipantTransport(user: CurrentUser): boolean {
  return (
    hasPermission(user.primaryRole, "transport:manage:self") ||
    isAdminRole(user.primaryRole)
  );
}

/**
 * Operator console access today uses global role permissions.
 * Later prompts will require transport operator membership, not only role.
 */
export function canAccessOperatorTransport(user: CurrentUser): boolean {
  return (
    hasPermission(user.primaryRole, "transport:manage:org") ||
    hasPermission(user.primaryRole, "transport:read:org") ||
    hasPermission(user.primaryRole, "transport:manage:any") ||
    isAdminRole(user.primaryRole)
  );
}

export function canAccessDriverTransport(user: CurrentUser): boolean {
  return (
    hasPermission(user.primaryRole, "transport:drive") ||
    isAdminRole(user.primaryRole)
  );
}

export function canAccessAdminTransport(user: CurrentUser): boolean {
  return (
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "transport:manage:any")
  );
}

export function hasTransportPermission(
  user: CurrentUser,
  permission: Permission
): boolean {
  return hasPermission(user.primaryRole, permission);
}
