import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

export function canViewPublishedPlaces(): boolean {
  return true;
}

export function canSuggestPlace(user: CurrentUser | null): boolean {
  return Boolean(user);
}

export function canEditPlace(user: CurrentUser | null): boolean {
  if (!user) return false;
  return (
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "accessibility_map:manage")
  );
}

export function canPublishPlace(user: CurrentUser | null): boolean {
  return canEditPlace(user);
}

export function canReportPlace(_user: CurrentUser | null): boolean {
  return true;
}
