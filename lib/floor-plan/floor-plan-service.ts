import {
  demoVenueHasFloorPlan,
  getDemoFloorPlanDetail,
  getDemoFloorPlanSummaries,
} from "@/lib/demo/floor-plan-fixture";
import {
  floorPlanDocumentSchema,
  type FloorPlanDetail,
  type VenueFloorPlanDetailResponse,
  type VenueFloorPlanListResponse,
} from "@/lib/floor-plan/schemas";

/** List published floor plan summaries for a venue. */
export async function listVenueFloorPlans(
  venueId: string,
  venueName?: string,
): Promise<VenueFloorPlanListResponse | null> {
  // Demo venues
  const demo = getDemoFloorPlanSummaries(venueId);
  if (demo) return demo;

  // Database lookup (when floor plans exist in Prisma)
  try {
    const { prisma } = await import("@/lib/prisma");
    const place = await prisma.accessPlace.findFirst({
      where: { id: venueId, status: "published" },
      select: { id: true, name: true },
    });
    if (!place) return null;

    const rows = await prisma.accessFloorPlan.findMany({
      where: {
        placeId: venueId,
        publicationStatus: "published",
        visibility: "public",
        supersededAt: null,
      },
      orderBy: { sortOrder: "asc" },
    });

    if (rows.length === 0) {
      return {
        venueId: place.id,
        venueName: place.name,
        hasFloorPlan: false,
        floorPlanCount: 0,
        floorPlanLastVerifiedAt: null,
        plans: [],
      };
    }

    const lastVerified = rows.reduce<Date | null>((latest, row) => {
      if (!row.verifiedAt) return latest;
      if (!latest || row.verifiedAt > latest) return row.verifiedAt;
      return latest;
    }, null);

    return {
      venueId: place.id,
      venueName: place.name,
      hasFloorPlan: true,
      floorPlanCount: rows.length,
      floorPlanLastVerifiedAt: lastVerified?.toISOString() ?? null,
      plans: rows.map((row) => {
        const doc = floorPlanDocumentSchema.safeParse(row.structuredData);
        return {
          id: row.id,
          floorCode: row.floorCode,
          floorName: row.floorName,
          sortOrder: row.sortOrder,
          featureCount: doc.success ? doc.data.features.length : 0,
        };
      }),
    };
  } catch {
    return null;
  }
}

/** Get a single published floor plan with full document. */
export async function getVenueFloorPlanDetail(
  venueId: string,
  floorPlanId: string,
): Promise<VenueFloorPlanDetailResponse | null> {
  const demo = getDemoFloorPlanDetail(venueId, floorPlanId);
  if (demo) {
    return {
      venueId,
      venueName: demo.venueName,
      lastVerifiedAt: demo.plan.verifiedAt ?? null,
      plan: demo.plan,
    };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const row = await prisma.accessFloorPlan.findFirst({
      where: {
        id: floorPlanId,
        placeId: venueId,
        publicationStatus: "published",
        visibility: "public",
        supersededAt: null,
      },
      include: { place: { select: { name: true } } },
    });
    if (!row) return null;

    const docResult = floorPlanDocumentSchema.safeParse(row.structuredData);
    if (!docResult.success || docResult.data.schemaVersion !== 1) {
      return null;
    }

    const doc = docResult.data;
    const plan: FloorPlanDetail = {
      id: row.id,
      floorCode: row.floorCode,
      floorName: row.floorName,
      sortOrder: row.sortOrder,
      planAsset: {
        url: row.planAssetUrl,
        type: row.planAssetType as FloorPlanDetail["planAsset"]["type"],
        width: row.originalWidth,
        height: row.originalHeight,
        altText: row.altText ?? `${row.floorName} floor plan`,
      },
      features: doc.features,
      zones: doc.zones,
      routes: doc.routes,
      connectors: doc.connectors,
      sourceName: row.sourceName ?? undefined,
      sourceUrl: row.sourceUrl ?? undefined,
      licenceOrPermission: row.licenceOrPermission ?? undefined,
      version: row.version,
      verifiedAt: row.verifiedAt?.toISOString(),
      verifiedByType: row.verifiedByType ?? undefined,
      isToScale: row.isToScale,
      orientationLabel: row.orientationLabel ?? undefined,
    };

    return {
      venueId,
      venueName: row.place.name,
      lastVerifiedAt: row.verifiedAt?.toISOString() ?? null,
      plan,
    };
  } catch {
    return null;
  }
}

export { demoVenueHasFloorPlan };
