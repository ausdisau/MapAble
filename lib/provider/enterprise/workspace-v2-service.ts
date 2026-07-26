import type { CurrentUser } from "@/lib/auth/current-user";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import {
  resolveTenantContext,
  whereOrganisationScope,
} from "@/lib/platform/multi-tenant-admin/tenant-context";
import { prisma } from "@/lib/prisma";

export async function getEnterpriseWorkspaceSummaryV2(
  organisationId: string,
  user: CurrentUser
) {
  const ctx = await resolveTenantContext(user);

  if (!y2OrchestrationConfig.multiTenantWorkspaceV2Enabled) {
    const { getEnterpriseWorkspaceSummary } = await import(
      "@/lib/provider/enterprise/workspace-service"
    );
    return getEnterpriseWorkspaceSummary(organisationId, user.id, user.primaryRole);
  }

  const orgScope = whereOrganisationScope(ctx);

  const [careShifts, openRecoveries, reconExceptions, rosterGaps] =
    await Promise.all([
      prisma.careShift.count({
        where: { organisationId, ...orgScope },
      }),
      prisma.backupShiftRecovery.count({
        where: {
          status: { in: ["detected", "awaiting_dispatch", "escalated"] },
          careShift: { organisationId },
        },
      }),
      prisma.paymentReconciliationException.count({
        where: {
          workflowState: "open",
          organisationId: ctx.organisationId ?? organisationId,
        },
      }),
      prisma.careShift.count({
        where: {
          organisationId,
          status: "scheduled",
          workerProfileId: null,
          startAt: { lte: new Date(Date.now() + 72 * 3600000) },
        },
      }),
    ]);

  return {
    organisationId,
    tenantId: ctx.tenantId,
    careShifts,
    openRecoveries,
    openReconciliationExceptions: reconExceptions,
    rosterGaps,
    note: "Tenant-scoped summary — cross-tenant data excluded.",
  };
}

export async function onboardProviderTenant(params: {
  slug: string;
  name: string;
  organisationId: string;
  adminUserId: string;
}) {
  const { createTenant, addTenantMember } = await import(
    "@/lib/platform/multi-tenant-admin/tenant-service"
  );

  const tenant = await createTenant(params.slug, params.name);

  await prisma.enterpriseProviderWorkspace.upsert({
    where: { organisationId: params.organisationId },
    create: {
      organisationId: params.organisationId,
      tenantId: tenant.id,
      label: params.name,
    },
    update: { tenantId: tenant.id },
  });

  await addTenantMember(tenant.id, params.adminUserId, "admin", params.adminUserId);

  return tenant;
}
