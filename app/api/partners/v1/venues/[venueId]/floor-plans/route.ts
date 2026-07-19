import {
  authenticatePartnerRequest,
  requirePartnerScope,
} from "@/lib/indoor-accessibility/partner/api-auth";
import { PARTNER_API_DISCLAIMER } from "@/lib/indoor-accessibility/partner/partner-dto";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ venueId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const auth = await authenticatePartnerRequest(request);
  if (auth instanceof Response) return auth;
  if (!requirePartnerScope(auth.scopes, "floorplans:read")) {
    return Response.json(
      { error: { code: "SCOPE_DENIED", message: "floorplans:read required" } },
      { status: 403 },
    );
  }

  const { venueId } = await params;
  const plans = await prisma.accessFloorPlan.findMany({
    where: {
      placeId: venueId,
      publicationStatus: "published",
      visibility: "public",
    },
    orderBy: [{ sortOrder: "asc" }],
    select: {
      id: true,
      floorCode: true,
      floorName: true,
      sortOrder: true,
      altText: true,
      verifiedAt: true,
      structuredData: true,
    },
  });

  const filtered = plans.map((p) => {
    const data = p.structuredData as { features?: unknown[]; zones?: unknown[] };
    const publicZones = ((data.zones ?? []) as Array<{ type?: string }>).filter(
      (z) => z.type !== "restricted",
    );
    return {
      id: p.id,
      floorCode: p.floorCode,
      floorName: p.floorName,
      sortOrder: p.sortOrder,
      altText: p.altText,
      verifiedAt: p.verifiedAt?.toISOString() ?? null,
      featureCount: data.features?.length ?? 0,
      zones: publicZones,
      features: data.features,
    };
  });

  return Response.json({
    disclaimer: PARTNER_API_DISCLAIMER,
    venueId,
    floorPlans: filtered,
  });
}
