import { z } from "zod";

import { normalizedPointSchema } from "@/lib/access/floor-plan/normalized-point";

export const publicationStatusSchema = z.enum([
  "draft",
  "in_review",
  "changes_requested",
  "approved",
  "published",
  "superseded",
  "archived",
  "rejected",
]);

export const visibilitySchema = z.enum([
  "public",
  "authenticated",
  "restricted",
  "staff_only",
]);

export const trustLevelSchema = z.enum([
  "mapable_verified",
  "independent_assessor_verified",
  "venue_supplied",
  "community_reported",
  "not_verified",
  "verification_expired",
  "disputed",
  "superseded",
]);

export const operationalStatusSchema = z.enum([
  "available",
  "partially_available",
  "unavailable",
  "temporarily_closed",
  "under_maintenance",
  "unknown",
]);

export const correctionTypeSchema = z.enum([
  "feature_missing",
  "feature_mispositioned",
  "measurement_incorrect",
  "lift_unavailable",
  "entrance_locked",
  "floor_plan_outdated",
  "route_obstructed",
  "quiet_room_unavailable",
  "verification_label_incorrect",
  "restricted_info_exposed",
  "other",
]);

export const routeModeSchema = z.enum([
  "shortest_verified",
  "step_free",
  "low_sensory",
  "avoid_lifts",
  "avoid_stairs",
  "avoid_escalators",
  "assisted",
  "rest_points_preferred",
  "selected_accessible_entrance",
]);

export const indoorRouteNodeSchema = z.object({
  id: z.string().min(1),
  floorPlanId: z.string().min(1),
  type: z.enum([
    "entrance",
    "exit",
    "junction",
    "doorway",
    "lift",
    "ramp",
    "stairs",
    "escalator",
    "destination",
    "rest_point",
    "assistance_point",
  ]),
  position: normalizedPointSchema,
  featureId: z.string().optional(),
});

export const indoorRouteEdgeSchema = z.object({
  id: z.string().min(1),
  fromNodeId: z.string().min(1),
  toNodeId: z.string().min(1),
  bidirectional: z.boolean().default(true),
  distanceMetres: z.number().optional(),
  stepFree: z.union([z.boolean(), z.literal("unknown")]),
  minimumWidthMm: z.number().optional(),
  maximumGradient: z.string().optional(),
  surfaceType: z.string().optional(),
  requiresAssistance: z.boolean().optional(),
  restricted: z.boolean().default(false),
  operationalStatus: operationalStatusSchema.optional(),
  verifiedAt: z.string().optional(),
  trustLevel: trustLevelSchema,
});

export const indoorRouteGraphSchema = z.object({
  schemaVersion: z.literal(1),
  nodes: z.array(indoorRouteNodeSchema),
  edges: z.array(indoorRouteEdgeSchema),
});

export const visitPlanShareScopeSchema = z.enum([
  "venue_only",
  "time_and_venue",
  "travel_details",
  "indoor_route",
  "access_notes",
  "communication_preferences",
  "pickup_details",
  "live_status_updates",
]);

export type PublicationStatus = z.infer<typeof publicationStatusSchema>;
export type Visibility = z.infer<typeof visibilitySchema>;
export type TrustLevel = z.infer<typeof trustLevelSchema>;
export type OperationalStatus = z.infer<typeof operationalStatusSchema>;
export type IndoorRouteNode = z.infer<typeof indoorRouteNodeSchema>;
export type IndoorRouteEdge = z.infer<typeof indoorRouteEdgeSchema>;
export type IndoorRouteGraph = z.infer<typeof indoorRouteGraphSchema>;
export type RouteMode = z.infer<typeof routeModeSchema>;
