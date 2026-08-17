import { distanceKm } from "@/lib/map/geo";
import type {
  FoundationalSupport,
  FoundationalSupportCategory,
} from "@/lib/schemas/foundational-supports";
import { FoundationalSupportSchema } from "@/lib/schemas/foundational-supports";

/** Curated fixture markers — no Prisma DDL. */
const FIXTURES: FoundationalSupport[] = [
  {
    id: "fs-nsw-library-parramatta",
    name: "Parramatta City Library",
    category: "PUBLIC_INFRASTRUCTURE",
    fundingSource: "City of Parramatta Council",
    costType: "FREE",
    location: {
      lat: -33.8151,
      lng: 151.0011,
      address: "1 Civic Pl, Parramatta NSW 2150",
    },
    accessibilityFeatures: ["step_free_entry", "accessible_toilet", "hearing_loop"],
  },
  {
    id: "fs-nsw-health-community",
    name: "Western Sydney Community Health Hub",
    category: "MAINSTREAM_HEALTH",
    fundingSource: "NSW Health",
    costType: "FREE",
    location: {
      lat: -33.7969,
      lng: 150.9224,
      address: "Blacktown NSW 2148",
    },
    accessibilityFeatures: ["step_free_entry", "accessible_parking"],
  },
  {
    id: "fs-vic-peer-network",
    name: "Melbourne Disability Peer Network",
    category: "PEER_NETWORK",
    fundingSource: "Victorian Government",
    costType: "FREE",
    location: {
      lat: -37.8136,
      lng: 144.9631,
      address: "Melbourne VIC 3000",
    },
    accessibilityFeatures: ["auslan_sessions", "quiet_room"],
  },
  {
    id: "fs-sa-community-group",
    name: "Adelaide Community Connect Group",
    category: "COMMUNITY_GROUP",
    fundingSource: "City of Adelaide",
    costType: "SUBSIDISED",
    location: {
      lat: -34.9285,
      lng: 138.6007,
      address: "Adelaide SA 5000",
    },
    accessibilityFeatures: ["step_free_entry", "accessible_toilet"],
  },
  {
    id: "fs-nsw-state-therapy",
    name: "Community Allied Health Clinic (State)",
    category: "STATE_THERAPY",
    fundingSource: "NSW Health",
    costType: "SUBSIDISED",
    location: {
      lat: -33.8688,
      lng: 151.2093,
      address: "Sydney NSW 2000",
    },
    accessibilityFeatures: ["step_free_entry", "accessible_parking", "quiet_room"],
  },
];

for (const row of FIXTURES) {
  FoundationalSupportSchema.parse(row);
}

export function listFoundationalSupportsNear(params: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: FoundationalSupportCategory;
}): FoundationalSupport[] {
  const radius = params.radiusKm ?? 25;
  return FIXTURES.filter((item) => {
    if (params.category && item.category !== params.category) return false;
    const d = distanceKm(
      params.latitude,
      params.longitude,
      item.location.lat,
      item.location.lng
    );
    return d <= radius;
  });
}

export type FoundationalSupportFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: Record<string, unknown>;
  }>;
};

export function foundationalSupportsToGeoJson(
  items: FoundationalSupport[]
): FoundationalSupportFeatureCollection {
  return {
    type: "FeatureCollection",
    features: items.map((item) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [item.location.lng, item.location.lat] as [number, number],
      },
      properties: {
        id: item.id,
        name: item.name,
        kind: "foundational_support" as const,
        subtitle: `${item.category} · ${item.costType}`,
        category: item.category,
        fundingSource: item.fundingSource,
        costType: item.costType,
        address: item.location.address,
        accessibilityFeatures: item.accessibilityFeatures,
        layerId: "foundational-supports-layer",
      },
    })),
  };
}
