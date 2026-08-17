import type { AccessibilityConfidence, AccessibilityFeatureType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listAccessiblePlaces(take = 50) {
  return prisma.accessiblePlace.findMany({
    take,
    orderBy: { name: "asc" },
    include: { features: true },
  });
}

export async function createAccessiblePlace(params: {
  name: string;
  address?: string;
  confidence?: AccessibilityConfidence;
  features?: { type: AccessibilityFeatureType; notes?: string }[];
}) {
  const place = await prisma.accessiblePlace.create({
    data: {
      name: params.name,
      address: params.address,
      confidence: params.confidence ?? "self_reported",
    },
  });

  if (params.features?.length) {
    await prisma.accessibilityFeature.createMany({
      data: params.features.map((f) => ({
        placeId: place.id,
        type: f.type,
        notes: f.notes,
      })),
    });
  }

  return place;
}

export async function linkPlaceToEntity(
  placeId: string,
  entityType: string,
  entityId: string
) {
  return prisma.placeLink.create({
    data: { placeId, entityType, entityId },
  });
}

export function formatPlaceForDisplay(place: {
  name: string;
  confidence: AccessibilityConfidence;
  features: { type: string }[];
}) {
  return {
    name: place.name,
    confidenceLabel: place.confidence.replace(/_/g, " "),
    disclaimer:
      "Community and self-reported data — not legal certification. Your personal access needs still apply.",
    features: place.features.map((f) => f.type.replace(/_/g, " ")),
  };
}
