import { hasPermission } from "@/lib/auth/permissions";
import { phase7Config } from "@/lib/config/phase7";
import { assertTenantAccess } from "@/lib/platform/multi-tenant-admin/tenant-service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

export async function getEnterpriseWorkspaceSummary(
  organisationId: string,
  userId: string,
  role: UserRole
) {
  if (!phase7Config.enterpriseProviderConsoleEnabled) {
    return { disabled: true };
  }

  if (
    !hasPermission(role, "care:read:org") &&
    !hasPermission(role, "care:manage:org") &&
    role !== "mapable_admin"
  ) {
    throw new Error("FORBIDDEN");
  }

  const workspace = await prisma.enterpriseProviderWorkspace.findUnique({
    where: { organisationId },
    include: { tenant: true },
  });

  if (workspace?.tenantId) {
    await assertTenantAccess(userId, workspace.tenantId);
  }

  const [careShifts, incidents, invoices, quality] = await Promise.all([
    prisma.careShift.count({ where: { organisationId } }),
    prisma.incidentReport.count({ where: { organisationId } }),
    prisma.invoice.count({ where: { organisationId } }),
    prisma.providerQualityScore.findFirst({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    organisationId,
    careShifts,
    openIncidents: incidents,
    invoices,
    qualityExplanation: quality?.explanation,
    note: "Organisation-scoped summary — participant private notes excluded.",
  };
}
