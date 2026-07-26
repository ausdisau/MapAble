import type { BillingFundingSourceType } from "@prisma/client";
import type { z } from "zod";

import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import type { createFundingSourceSchema } from "@/lib/billing/core/schemas";
import { prisma } from "@/lib/prisma";

type CreateInput = z.infer<typeof createFundingSourceSchema>;

export async function listFundingSources(userId: string) {
  return prisma.billingFundingSource.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createFundingSource(userId: string, input: CreateInput) {
  if (input.isDefault) {
    await prisma.billingFundingSource.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const source = await prisma.billingFundingSource.create({
    data: {
      userId,
      type: input.type as BillingFundingSourceType,
      label: input.label,
      ndisParticipantNumber: input.ndisParticipantNumber,
      planManagerName: input.planManagerName,
      planManagerEmail: input.planManagerEmail,
      isDefault: input.isDefault ?? false,
      metadata: input.metadata as object | undefined,
    },
  });

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingFundingSource",
    entityId: source.id,
    action: "created",
    after: source,
  });

  return source;
}
