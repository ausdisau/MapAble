import type { BillingInvoice } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { hasBillingPermission } from "@/lib/billing/permissions";
import { prisma } from "@/lib/prisma";
import { assertAdminTenantAccess } from "@/lib/security/break-glass";

export class BillingAccessError extends Error {
  readonly status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "BillingAccessError";
    this.status = status;
  }
}

/**
 * Participant owns the invoice, provider staff in the billing org,
 * or mapable finance/admin with view_all.
 */
export async function assertCanViewBillingInvoice(
  user: CurrentUser,
  invoiceId: string
): Promise<BillingInvoice> {
  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) {
    throw new BillingAccessError("Invoice not found", 404);
  }

  if (isAdminRole(user.primaryRole) || hasBillingPermission(user.primaryRole, "billing:view_all")) {
    return invoice;
  }

  if (invoice.userId === user.id) {
    return invoice;
  }

  if (
    invoice.providerId &&
    (hasBillingPermission(user.primaryRole, "billing:view_provider") ||
      hasPermission(user.primaryRole, "invoice:read:org"))
  ) {
    const orgIds = await getUserOrganisationIds(user.id);
    if (orgIds.includes(invoice.providerId)) {
      return invoice;
    }
  }

  // Nominees / coordinators with delegated view — only when they already hold the permission.
  // Delegation records are not fully modelled here; deny by default for IDOR safety.
  throw new BillingAccessError("Invoice not found", 404);
}

export async function assertCanAccessBillingOrganisation(
  user: CurrentUser,
  organisationId: string
): Promise<void> {
  if (isAdminRole(user.primaryRole)) {
    assertAdminTenantAccess(user, organisationId);
    return;
  }
  if (hasBillingPermission(user.primaryRole, "billing:view_all")) {
    return;
  }

  if (
    !hasBillingPermission(user.primaryRole, "billing:view_provider") &&
    !hasBillingPermission(user.primaryRole, "billing:manage_payouts") &&
    !hasPermission(user.primaryRole, "invoice:read:org")
  ) {
    throw new BillingAccessError("Organisation access denied", 403);
  }

  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new BillingAccessError("Organisation access denied", 403);
  }
}

export async function assertCanManageBillingOrganisation(
  user: CurrentUser,
  organisationId: string
): Promise<void> {
  if (isAdminRole(user.primaryRole) || hasBillingPermission(user.primaryRole, "billing:view_all")) {
    return;
  }

  if (
    !hasBillingPermission(user.primaryRole, "billing:manage_payouts") &&
    !hasBillingPermission(user.primaryRole, "billing:export") &&
    !hasBillingPermission(user.primaryRole, "billing:create_draft")
  ) {
    throw new BillingAccessError("Organisation manage access denied", 403);
  }

  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new BillingAccessError("Organisation manage access denied", 403);
  }
}

export async function getAccessibleBillingInvoiceOrNull(
  user: CurrentUser,
  invoiceId: string
): Promise<BillingInvoice | null> {
  try {
    return await assertCanViewBillingInvoice(user, invoiceId);
  } catch (e) {
    if (e instanceof BillingAccessError && e.status === 404) return null;
    throw e;
  }
}
