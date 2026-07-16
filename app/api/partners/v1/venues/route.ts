import {
  authenticatePartnerRequest,
  requirePartnerScope,
} from "@/lib/indoor-accessibility/partner/api-auth";
import {
  PARTNER_API_DISCLAIMER,
  toPartnerVenueSummary,
} from "@/lib/indoor-accessibility/partner/partner-dto";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await authenticatePartnerRequest(request);
  if (auth instanceof Response) return auth;
  if (!requirePartnerScope(auth.scopes, "venues:read")) {
    return Response.json({ error: { code: "SCOPE_DENIED", message: "venues:read required" } }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const places = await prisma.accessPlace.findMany({
    where: { status: "published" },
    take: limit,
    orderBy: { name: "asc" },
    include: {
      floorPlans: {
        where: { publicationStatus: "published", visibility: "public" },
        select: { id: true, verifiedAt: true },
      },
    },
  });

  const venues = places.map((p) =>
    toPartnerVenueSummary({
      id: p.id,
      name: p.name,
      category: p.category ?? undefined,
      suburb: p.suburb,
      hasFloorPlan: p.floorPlans.length > 0,
      floorPlanCount: p.floorPlans.length,
      lastVerifiedAt:
        p.floorPlans
          .map((fp) => fp.verifiedAt?.toISOString() ?? null)
          .filter(Boolean)
          .sort()
          .pop() ?? null,
    }),
  );

  return Response.json({
    disclaimer: PARTNER_API_DISCLAIMER,
    venues,
  });
}
