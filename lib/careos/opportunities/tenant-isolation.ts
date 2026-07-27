import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import { prisma } from "@/lib/prisma";

export class TenantIsolationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "TENANT_CONTEXT_REQUIRED"
      | "TENANT_MISMATCH"
      | "CROSS_TENANT_DENIED",
  ) {
    super(message);
    this.name = "TenantIsolationError";
  }
}

function assertTenantEnforcementEnabled() {
  if (!careosOpportunitiesConfig.tenantIsolationEnforcementEnabled) {
    throw new Error("TENANT_ISOLATION_DISABLED");
  }
}

/**
 * O12 — Mandatory tenant context for white-label / enterprise surfaces.
 * Silent cross-tenant access is denied and audited.
 */
export async function assertMandatoryTenantContext(input: {
  actorUserId: string;
  tenantId: string | null | undefined;
  resourceType: string;
  resourceId?: string;
  resourceTenantId?: string | null;
}) {
  assertTenantEnforcementEnabled();

  if (!input.tenantId) {
    await prisma.tenantAccessDenial.create({
      data: {
        actorUserId: input.actorUserId,
        attemptedTenantId: "missing",
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        reason: "TENANT_CONTEXT_REQUIRED",
      },
    });
    throw new TenantIsolationError(
      "Tenant context is required for this enterprise operation.",
      "TENANT_CONTEXT_REQUIRED",
    );
  }

  if (
    input.resourceTenantId &&
    input.resourceTenantId !== input.tenantId
  ) {
    await prisma.tenantAccessDenial.create({
      data: {
        actorUserId: input.actorUserId,
        attemptedTenantId: input.tenantId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        reason: "CROSS_TENANT_DENIED",
      },
    });
    throw new TenantIsolationError(
      "Cross-tenant access denied.",
      "CROSS_TENANT_DENIED",
    );
  }

  return { tenantId: input.tenantId, isolated: true as const };
}

export function requireTenantIdHeader(
  headers: Headers,
): string | null {
  return headers.get("x-mapable-tenant-id") ?? headers.get("x-tenant-id");
}

export async function listTenantAccessDenials(tenantId?: string) {
  assertTenantEnforcementEnabled();
  return prisma.tenantAccessDenial.findMany({
    where: tenantId ? { attemptedTenantId: tenantId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
