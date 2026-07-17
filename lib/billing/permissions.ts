import type { MapAbleUserRole } from "@prisma/client";

import { hasPermission, type Permission } from "@/lib/auth/permissions";
import type { BillingPermission } from "@/types/billing";
import type { UserRole } from "@/types/mapable";

export function hasBillingPermission(
  role: UserRole | MapAbleUserRole,
  permission: BillingPermission
): boolean {
  return hasPermission(role, permission as Permission);
}

export function listBillingPermissions(
  role: UserRole | MapAbleUserRole
): BillingPermission[] {
  const all: BillingPermission[] = [
    "billing:view_own",
    "billing:view_delegated",
    "billing:view_provider",
    "billing:view_all",
    "billing:create_draft",
    "billing:edit_draft",
    "billing:approve_participant",
    "billing:approve_provider",
    "billing:issue_invoice",
    "billing:void_invoice",
    "billing:create_credit_note",
    "billing:record_payment",
    "billing:reconcile",
    "billing:manage_payouts",
    "billing:manage_policy",
    "billing:manage_integrations",
    "billing:export",
    "billing:audit",
  ];
  return all.filter((p) => hasBillingPermission(role, p));
}

export function canAccessBillingCentre(
  role: UserRole | MapAbleUserRole
): boolean {
  return (
    hasBillingPermission(role, "billing:view_own") ||
    hasBillingPermission(role, "billing:view_delegated") ||
    hasBillingPermission(role, "billing:view_provider") ||
    hasBillingPermission(role, "billing:view_all") ||
    hasPermission(role, "invoice:read:self") ||
    hasPermission(role, "invoice:read:org") ||
    hasPermission(role, "invoice:manage:any") ||
    hasPermission(role, "admin:billing:read")
  );
}
