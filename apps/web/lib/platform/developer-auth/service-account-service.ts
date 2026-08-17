import type { ApiScope } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureDeveloperPlatformEnabled } from "@/lib/config/developer-platform";
import { prisma } from "@/lib/prisma";

export async function createServiceAccount(input: {
  apiClientId: string;
  name: string;
  scopes: ApiScope[];
  actorUserId: string;
}) {
  ensureDeveloperPlatformEnabled();
  const account = await prisma.serviceAccount.create({
    data: {
      apiClientId: input.apiClientId,
      name: input.name,
      scopes: input.scopes,
      participantAuthorityBlocked: true,
    },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "developer_platform.service_account_created",
    entityType: "ServiceAccount",
    entityId: account.id,
  });
  return account;
}

export async function listServiceAccounts(apiClientId: string) {
  return prisma.serviceAccount.findMany({
    where: { apiClientId, active: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deactivateServiceAccount(
  accountId: string,
  actorUserId: string,
) {
  await prisma.serviceAccount.update({
    where: { id: accountId },
    data: { active: false },
  });
  await createAuditEvent({
    actorUserId,
    action: "developer_platform.service_account_deactivated",
    entityType: "ServiceAccount",
    entityId: accountId,
  });
}
