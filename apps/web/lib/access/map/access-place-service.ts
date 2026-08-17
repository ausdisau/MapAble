import type {
  AccessPlaceCategory,
  AccessPlaceFeatureType,
  AccessPlaceSourceType,
  AccessPlaceStatus,
  Prisma,
} from "@prisma/client";

import { confidenceFromSource } from "@/lib/access/map/access-confidence-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { runInTransaction } from "@/lib/db/transaction-service";
import { prisma } from "@/lib/prisma";
import type { CreateAccessPlaceInput } from "@/types/access-map";

const placeInclude = {
  location: true,
  features: true,
  ratingSummaries: true,
  accreditationAssessments: {
    where: { status: "published" as const },
    orderBy: { publishedAt: "desc" as const },
    take: 1,
  },
  reviews: {
    where: { status: "published" as const, visibility: "public" as const },
    orderBy: { createdAt: "desc" as const },
    take: 5,
    include: { ratings: true },
  },
  _count: {
    select: {
      reviews: { where: { status: "published" } },
    },
  },
} satisfies Prisma.AccessPlaceInclude;

export async function listPublishedPlaces(take = 50) {
  return prisma.accessPlace.findMany({
    where: { status: "published" },
    take,
    orderBy: { updatedAt: "desc" },
    include: {
      location: true,
      features: true,
      _count: { select: { reviews: { where: { status: "published" } } } },
    },
  });
}

export async function getPlaceById(placeId: string, publicOnly = true) {
  return prisma.accessPlace.findFirst({
    where: publicOnly
      ? { id: placeId, status: "published" }
      : { id: placeId },
    include: placeInclude,
  });
}

export async function createAccessPlace(params: {
  input: CreateAccessPlaceInput;
  createdById: string;
  status?: AccessPlaceStatus;
  sourceType?: AccessPlaceSourceType;
  sourceReference?: string;
  /** When provided, place + audit share the caller transaction. */
  tx?: Prisma.TransactionClient;
}) {
  const status = params.status ?? "pending_moderation";
  const sourceType = params.sourceType ?? "user_suggested";

  const run = async (db: Prisma.TransactionClient) => {
    const place = await db.accessPlace.create({
      data: {
        name: params.input.name,
        category: params.input.category as AccessPlaceCategory,
        description: params.input.description,
        addressText: params.input.addressText,
        suburb: params.input.suburb,
        stateOrRegion: params.input.stateOrRegion,
        country: params.input.country,
        status,
        sourceType,
        sourceReference: params.sourceReference,
        createdById: params.createdById,
        confidence: "user_reported",
        location: {
          create: {
            latitude: params.input.latitude,
            longitude: params.input.longitude,
          },
        },
        features: params.input.features?.length
          ? {
              create: params.input.features.map((type) => ({
                type: type as AccessPlaceFeatureType,
              })),
            }
          : undefined,
        events: {
          create: {
            actorId: params.createdById,
            action: "place.created",
            metadata: { status, sourceType },
          },
        },
      },
      include: { location: true, features: true },
    });

    await createAuditEvent({
      actorUserId: params.createdById,
      action: "access_place.created",
      entityType: "AccessPlace",
      entityId: place.id,
      metadata: { status, sourceType },
      tx: db,
    });

    return place;
  };

  if (params.tx) {
    return run(params.tx);
  }
  return runInTransaction((tx) => run(tx));
}

export async function updateAccessPlace(
  placeId: string,
  data: Prisma.AccessPlaceUpdateInput,
  actorId: string
) {
  const place = await prisma.accessPlace.update({
    where: { id: placeId },
    data,
    include: { location: true, features: true },
  });

  await prisma.accessPlaceEvent.create({
    data: {
      placeId,
      actorId,
      action: "place.updated",
      metadata: { fields: Object.keys(data) },
    },
  });

  await createAuditEvent({
    actorUserId: actorId,
    action: "access_place.updated",
    entityType: "AccessPlace",
    entityId: placeId,
  });

  return place;
}

export async function publishAccessPlace(placeId: string, actorId: string) {
  const reviewCount = await prisma.accessPlaceReview.count({
    where: { placeId, status: "published" },
  });
  const place = await prisma.accessPlace.findUnique({ where: { id: placeId } });
  if (!place) throw new Error("Place not found");

  const hasAccred = await prisma.accessAccreditationAssessment.count({
    where: { placeId, status: "published" },
  });

  return updateAccessPlace(
    placeId,
    {
      status: "published",
      confidence: confidenceFromSource(
        place.sourceType,
        reviewCount,
        hasAccred > 0
      ),
    },
    actorId
  );
}

export async function reportAccessPlace(params: {
  placeId: string;
  reporterId?: string;
  reason: string;
  details?: string;
}) {
  if (params.reporterId) {
    const existing = await prisma.accessPlaceReport.findFirst({
      where: {
        placeId: params.placeId,
        reporterId: params.reporterId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (existing) {
      throw new Error("PLACE_REPORT_ALREADY_SUBMITTED");
    }
  }

  const report = await prisma.accessPlaceReport.create({
    data: {
      placeId: params.placeId,
      reporterId: params.reporterId,
      reason: params.reason as never,
      details: params.details,
    },
  });

  await prisma.accessContentReport.create({
    data: {
      entityType: "AccessPlace",
      entityId: params.placeId,
      reporterId: params.reporterId,
      reason: params.reason as never,
      details: params.details,
    },
  });

  await prisma.accessModerationQueue.create({
    data: {
      entityType: "AccessPlace",
      entityId: params.placeId,
      flagReason: params.reason,
    },
  });

  return report;
}

export function placeToGeoJsonFeature(place: {
  id: string;
  name: string;
  category: string;
  location: { latitude: number; longitude: number } | null;
}) {
  if (!place.location) return null;
  return {
    type: "Feature" as const,
    id: place.id,
    geometry: {
      type: "Point" as const,
      coordinates: [place.location.longitude, place.location.latitude],
    },
    properties: {
      id: place.id,
      name: place.name,
      category: place.category,
    },
  };
}

export { placeInclude };
