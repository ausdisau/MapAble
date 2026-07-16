import { requireApiSession } from "@/lib/api/auth-handler";
import { isIndoorFeatureEnabled } from "@/lib/indoor-accessibility/feature-flags";
import { featureDisabledResponse, indoorApiError } from "@/lib/indoor-accessibility/api-errors";
import { canReportStatus, canVerifyStatus } from "@/lib/indoor-accessibility/permissions";
import { recordIndoorAuditEvent } from "@/lib/indoor-accessibility/audit/indoor-audit-service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const incidentSchema = z.object({
  placeId: z.string(),
  floorPlanId: z.string().optional(),
  featureId: z.string().optional(),
  incidentType: z.string(),
  description: z.string().min(5).max(2000),
  source: z.string().default("community"),
  trustLevel: z.string().default("community_reported"),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  if (!isIndoorFeatureEnabled("operationalStatus")) {
    return featureDisabledResponse("operationalStatus");
  }
  const url = new URL(request.url);
  const placeId = url.searchParams.get("placeId");
  if (!placeId) return Response.json({ error: "placeId required" }, { status: 400 });
  const now = new Date();
  const incidents = await prisma.indoorAccessibilityIncident.findMany({
    where: {
      placeId,
      resolvedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { reportedAt: "desc" },
    take: 50,
  });
  return Response.json({ incidents });
}

export async function POST(request: Request) {
  if (!isIndoorFeatureEnabled("operationalStatus")) {
    return featureDisabledResponse("operationalStatus");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canReportStatus(user)) {
    return indoorApiError("FORBIDDEN", "Not allowed.", 403);
  }
  const body = await request.json();
  const parsed = incidentSchema.safeParse(body);
  if (!parsed.success) return indoorApiError("FLOOR_PLAN_VALIDATION_FAILED", "Invalid incident.", 400);

  const incident = await prisma.indoorAccessibilityIncident.create({
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      moderationState: "pending",
    },
  });
  return Response.json({ incident }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isIndoorFeatureEnabled("operationalStatus")) {
    return featureDisabledResponse("operationalStatus");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canVerifyStatus(user)) {
    return indoorApiError("FORBIDDEN", "Verifier access required.", 403);
  }
  const body = await request.json();
  const schema = z.object({
    incidentId: z.string(),
    action: z.enum(["verify", "resolve"]),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return indoorApiError("FLOOR_PLAN_VALIDATION_FAILED", "Invalid request.", 400);

  const data =
    parsed.data.action === "verify"
      ? { verifiedAt: new Date(), moderationState: "verified", trustLevel: "mapable_verified" }
      : { resolvedAt: new Date(), moderationState: "resolved" };

  const incident = await prisma.indoorAccessibilityIncident.update({
    where: { id: parsed.data.incidentId },
    data,
  });

  await recordIndoorAuditEvent({
    action: "status.incident_verified",
    actorUserId: user.id,
    entityType: "IndoorAccessibilityIncident",
    entityId: incident.id,
    placeId: incident.placeId,
  });

  return Response.json({ incident });
}
