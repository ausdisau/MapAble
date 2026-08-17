import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase7Config } from "@/lib/config/phase7";
import { prisma } from "@/lib/prisma";

export async function createTenant(slug: string, name: string) {
  if (!phase7Config.multiTenantPartnerAdminEnabled) {
    throw new Error("MULTI_TENANT_DISABLED");
  }
  return prisma.tenant.create({ data: { slug, name } });
}

export async function addTenantMember(
  tenantId: string,
  userId: string,
  role: string,
  actorUserId: string
) {
  const membership = await prisma.tenantMembership.create({
    data: { tenantId, userId, role },
  });
  await createAuditEvent({
    actorUserId,
    action: "tenant.member_added",
    entityType: "Tenant",
    entityId: tenantId,
  });
  return membership;
}

export async function userCanAccessTenant(userId: string, tenantId: string) {
  const m = await prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });
  return Boolean(m);
}

export async function assertTenantAccess(userId: string, tenantId: string) {
  const ok = await userCanAccessTenant(userId, tenantId);
  if (!ok) throw new Error("TENANT_FORBIDDEN");
}
