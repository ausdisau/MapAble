import { z } from "zod";

export const normalizedPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const floorPlanFeatureTypeSchema = z.enum([
  "accessible_entrance",
  "alternative_accessible_entrance",
  "main_entrance",
  "doorway",
  "corridor",
  "ramp",
  "lift",
  "stairs",
  "escalator",
  "accessible_toilet",
  "changing_places",
  "ambulant_toilet",
  "service_counter",
  "accessible_seating",
  "quiet_room",
  "low_sensory_zone",
  "hearing_loop",
  "tactile_signage",
  "braille_signage",
  "assistance_point",
  "reception",
  "public_exit",
  "temporary_barrier",
  "temporary_closure",
  "route_destination",
  "other_accessibility_feature",
]);

export const floorPlanFeatureStatusSchema = z.enum([
  "verified",
  "venue_claimed",
  "community_reported",
  "unknown",
]);

export const floorPlanOperationalStatusSchema = z.enum([
  "available",
  "unavailable",
  "temporarily_closed",
  "unknown",
]);

export const floorPlanMeasurementsSchema = z.object({
  doorWidthMm: z.number().optional(),
  corridorWidthMm: z.number().optional(),
  thresholdHeightMm: z.number().optional(),
  counterHeightMm: z.number().optional(),
  liftDoorWidthMm: z.number().optional(),
  turningCircleMm: z.number().optional(),
  rampGradient: z.string().optional(),
  distanceMetres: z.number().optional(),
});

export const floorPlanFeatureSchema = z.object({
  id: z.string().min(1),
  floorPlanId: z.string().min(1),
  type: floorPlanFeatureTypeSchema,
  name: z.string().min(1),
  shortLabel: z.string().optional(),
  description: z.string().optional(),
  position: normalizedPointSchema,
  status: floorPlanFeatureStatusSchema,
  operationalStatus: floorPlanOperationalStatusSchema.optional(),
  accessibilityLevel: z.enum(["bronze", "silver", "gold", "not_rated"]).optional(),
  measurements: floorPlanMeasurementsSchema.optional(),
  attributes: z.record(z.string(), z.union([z.boolean(), z.string(), z.number(), z.null()])).optional(),
  notes: z.array(z.string()).optional(),
  evidenceUrls: z.array(z.string().url()).optional(),
  lastVerifiedAt: z.string().optional(),
  connectorId: z.string().optional(),
});

export const floorPlanZoneTypeSchema = z.enum([
  "public_area",
  "quiet_zone",
  "accessible_seating",
  "restricted_area",
  "temporary_closure",
]);

export const floorPlanZoneSchema = z.object({
  id: z.string().min(1),
  type: floorPlanZoneTypeSchema,
  name: z.string().min(1),
  polygon: z.array(normalizedPointSchema).min(3),
  description: z.string().optional(),
  status: z.string().optional(),
});

export const floorPlanRouteTypeSchema = z.enum([
  "step_free",
  "shortest_verified",
  "low_sensory",
  "assisted",
]);

export const floorPlanRouteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  routeType: floorPlanRouteTypeSchema,
  fromFeatureId: z.string().min(1),
  toFeatureId: z.string().min(1),
  floorSegments: z.array(
    z.object({
      floorPlanId: z.string().min(1),
      points: z.array(normalizedPointSchema).min(2),
    }),
  ),
  steps: z.array(
    z.object({
      id: z.string().min(1),
      floorPlanId: z.string().min(1),
      instruction: z.string().min(1),
      distanceMetres: z.number().optional(),
      featureId: z.string().optional(),
    }),
  ),
  verifiedAt: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export const floorConnectorSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["lift", "ramp", "stairs", "escalator"]),
  name: z.string().min(1),
  connectedFloorPlanIds: z.array(z.string().min(1)).min(2),
  accessible: z.union([z.boolean(), z.literal("unknown")]),
  operationalStatus: z.string().optional(),
});

export const floorPlanDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  features: z.array(floorPlanFeatureSchema),
  zones: z.array(floorPlanZoneSchema),
  routes: z.array(floorPlanRouteSchema),
  connectors: z.array(floorConnectorSchema),
});

export const floorPlanAssetSchema = z.object({
  url: z.string().min(1),
  type: z.enum(["png", "webp", "jpeg", "jpg", "svg"]),
  width: z.number().positive(),
  height: z.number().positive(),
  altText: z.string().min(1),
});

export const floorPlanSummarySchema = z.object({
  id: z.string().min(1),
  floorCode: z.string().min(1),
  floorName: z.string().min(1),
  sortOrder: z.number().int(),
  featureCount: z.number().int().nonnegative(),
});

export const floorPlanDetailSchema = z.object({
  id: z.string().min(1),
  floorCode: z.string().min(1),
  floorName: z.string().min(1),
  sortOrder: z.number().int(),
  planAsset: floorPlanAssetSchema,
  features: z.array(floorPlanFeatureSchema),
  zones: z.array(floorPlanZoneSchema),
  routes: z.array(floorPlanRouteSchema),
  connectors: z.array(floorConnectorSchema),
  sourceName: z.string().optional(),
  sourceUrl: z.string().optional(),
  licenceOrPermission: z.string().optional(),
  version: z.number().int().positive(),
  verifiedAt: z.string().optional(),
  verifiedByType: z.string().optional(),
  isToScale: z.boolean().optional(),
  orientationLabel: z.string().optional(),
});

export const venueFloorPlanListResponseSchema = z.object({
  venueId: z.string().min(1),
  venueName: z.string().min(1),
  hasFloorPlan: z.boolean(),
  floorPlanCount: z.number().int().nonnegative(),
  floorPlanLastVerifiedAt: z.string().nullable(),
  plans: z.array(floorPlanSummarySchema),
});

export const venueFloorPlanDetailResponseSchema = z.object({
  venueId: z.string().min(1),
  venueName: z.string().min(1),
  lastVerifiedAt: z.string().nullable(),
  plan: floorPlanDetailSchema,
});

export type NormalizedPoint = z.infer<typeof normalizedPointSchema>;
export type FloorPlanFeatureType = z.infer<typeof floorPlanFeatureTypeSchema>;
export type FloorPlanFeature = z.infer<typeof floorPlanFeatureSchema>;
export type FloorPlanZone = z.infer<typeof floorPlanZoneSchema>;
export type FloorPlanRoute = z.infer<typeof floorPlanRouteSchema>;
export type FloorConnector = z.infer<typeof floorConnectorSchema>;
export type FloorPlanDocument = z.infer<typeof floorPlanDocumentSchema>;
export type FloorPlanAsset = z.infer<typeof floorPlanAssetSchema>;
export type FloorPlanSummary = z.infer<typeof floorPlanSummarySchema>;
export type FloorPlanDetail = z.infer<typeof floorPlanDetailSchema>;
export type VenueFloorPlanListResponse = z.infer<typeof venueFloorPlanListResponseSchema>;
export type VenueFloorPlanDetailResponse = z.infer<typeof venueFloorPlanDetailResponseSchema>;
