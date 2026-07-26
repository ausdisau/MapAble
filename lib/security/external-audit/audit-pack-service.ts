import { Prisma } from "@prisma/client";

import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

export async function createSecurityAuditPack(params: {
  title: string;
  framework: string;
  evidence?: Record<string, unknown>;
}) {
  if (!phase8Config.externalSecurityAuditReadinessEnabled) {
    throw new Error("SECURITY_AUDIT_DISABLED");
  }
  return prisma.externalSecurityAuditPack.create({
    data: {
      title: params.title,
      framework: params.framework,
      evidenceJson: params.evidence
        ? (params.evidence as Prisma.InputJsonValue)
        : { placeholder: true },
    },
  });
}

export async function publishSecurityAuditPack(packId: string) {
  return prisma.externalSecurityAuditPack.update({
    where: { id: packId },
    data: { status: "published", publishedAt: new Date() },
  });
}

export async function listSecurityAuditPacks() {
  return prisma.externalSecurityAuditPack.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
