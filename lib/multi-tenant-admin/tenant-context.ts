import type { CurrentUser } from "@/lib/auth/current-user";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import { assertTenantAccess } from "@/lib/multi-tenant-admin/tenant-service";
import { prisma } from "@/lib/prisma";

export type TenantContext = {
  tenantId: string | null;
  organisationId: string | null;
  enabled: boolean;
};

export async function resolveTenantContext(
  user: CurrentUser
): Promise<TenantContext> {
  if (!y2OrchestrationConfig.multiTenantWorkspaceV2Enabled) {
    return { tenantId: null, organisationId: null, enabled: false };
  }

  const membership = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return { tenantId: null, organisationId: null, enabled: true };
  }

  const workspace = await prisma.enterpriseProviderWorkspace.findUnique({
    where: { organisationId: membership.organisationId },
    include: { tenant: true },
  });

  const tenantId = workspace?.tenantId ?? null;
  const organisationId = membership.organisationId;

  if (tenantId) {
    await assertTenantAccess(user.id, tenantId);
  }

  return {
    tenantId,
    organisationId,
    enabled: true,
  };
}

export function whereOrganisationScope(
  ctx: TenantContext,
  organisationField = "organisationId"
) {
  if (!ctx.enabled || !ctx.organisationId) return {};
  return { [organisationField]: ctx.organisationId };
}

export function whereTenantOrganisations(ctx: TenantContext) {
  if (!ctx.enabled || !ctx.tenantId) return {};
  return {
    organisation: {
      id: {
        in: undefined as unknown as string[],
      },
    },
  };
}

export async function assertOrganisationInTenant(
  ctx: TenantContext,
  organisationId: string
) {
  if (!ctx.enabled || !ctx.tenantId) return;

  const workspace = await prisma.enterpriseProviderWorkspace.findFirst({
    where: { organisationId, tenantId: ctx.tenantId },
  });
  if (!workspace) throw new Error("TENANT_ORG_FORBIDDEN");
}

export async function getOrganisationIdsForTenant(tenantId: string) {
  const workspaces = await prisma.enterpriseProviderWorkspace.findMany({
    where: { tenantId },
    select: { organisationId: true },
  });
  return workspaces.map((w) => w.organisationId);
}
