import { createHmac } from "crypto";

import type { MapAbleUserRole } from "@prisma/client";

import { getMetabaseConfig, isMetabaseEnabled } from "@/lib/analytics/metabase/metabase-client";
import { canAccessAnalyticsView } from "@/lib/governance/data/analytics-view-policy";
import { prisma } from "@/lib/prisma";

export async function createMetabaseEmbedToken(input: {
  dashboardId: number;
  userId: string;
  role: MapAbleUserRole;
  organisationId?: string;
  viewKey: string;
}) {
  if (!isMetabaseEnabled()) {
    throw new Error("Metabase not enabled");
  }

  if (
    !canAccessAnalyticsView(input.role, input.viewKey, input.organisationId)
  ) {
    throw new Error("Not authorised for this analytics view");
  }

  const { siteUrl, secretKey } = getMetabaseConfig();
  if (!siteUrl || !secretKey) {
    throw new Error("Metabase not configured");
  }

  const payload = {
    resource: { dashboard: input.dashboardId },
    params: input.organisationId
      ? { organisation_id: input.organisationId }
      : {},
    exp: Math.round(Date.now() / 1000) + 600,
  };

  const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secretKey)
    .update(token)
    .digest("hex");

  await prisma.analyticsAccessLog.create({
    data: {
      userId: input.userId,
      dashboardKey: input.viewKey,
    },
  });

  return {
    embedUrl: `${siteUrl}/embed/dashboard/${token}.${signature}`,
    expiresInSeconds: 600,
  };
}
