import { Prisma } from "@prisma/client";

import { phase12Config } from "@/lib/config/phase12";
import {
  isFederatedAccountabilityV2Enabled,
  ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER,
} from "@/lib/config/y5-rights-infrastructure";
import { requireRatifiedCharter } from "@/lib/governance/charter/charter-gate-service";
import { prisma } from "@/lib/prisma";

export async function publishAccountabilityReport(params: {
  periodLabel: string;
  title: string;
  summary: string;
  category: string;
  metrics?: Record<string, unknown>;
  federatedPartnerId?: string;
}) {
  if (!phase12Config.nationalAccountabilityPortalEnabled) {
    throw new Error("ACCOUNTABILITY_PORTAL_DISABLED");
  }
  if (isFederatedAccountabilityV2Enabled()) {
    await requireRatifiedCharter();
  }

  return prisma.nationalAccountabilityPublication.create({
    data: {
      ...params,
      metricsJson: params.metrics
        ? (params.metrics as Prisma.InputJsonValue)
        : undefined,
      status: "published",
      publishedAt: new Date(),
    },
  });
}

export async function listPublicAccountabilityReports() {
  if (!phase12Config.nationalAccountabilityPortalEnabled) return [];
  return prisma.nationalAccountabilityPublication.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: {
      id: true,
      periodLabel: true,
      title: true,
      summary: true,
      category: true,
      metricsJson: true,
      federatedPartnerId: true,
      publishedAt: true,
    },
  });
}

export function getAccountabilityDisclaimer() {
  return ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER;
}
