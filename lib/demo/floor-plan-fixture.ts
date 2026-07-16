/**
 * Development-only floor plan fixture for demo-parramatta-library.
 * Not included in production database seeding.
 */
import type { FloorPlanDetail, VenueFloorPlanListResponse } from "@/lib/floor-plan/schemas";

export const DEMO_FLOOR_PLAN_VENUE_IDS = new Set(["demo-parramatta-library"]);

const LIFT_CONNECTOR_ID = "connector-main-lift";

const GROUND_FLOOR: FloorPlanDetail = {
  id: "demo-parramatta-ground",
  floorCode: "G",
  floorName: "Ground floor",
  sortOrder: 0,
  planAsset: {
    url: "/floor-plans/demo/parramatta-ground.svg",
    type: "svg",
    width: 800,
    height: 600,
    altText:
      "Ground floor plan of Parramatta City Library with the step-free southern entrance, reception, lift, and accessible toilet.",
  },
  sourceName: "MapAble assessor",
  sourceUrl: undefined,
  licenceOrPermission: "MapAble assessor produced for demo purposes",
  version: 1,
  verifiedAt: "2026-05-12T00:00:00.000Z",
  verifiedByType: "MapAble assessor",
  isToScale: false,
  orientationLabel: "North up",
  features: [
    {
      id: "feat-south-entrance",
      floorPlanId: "demo-parramatta-ground",
      type: "accessible_entrance",
      name: "Step-free southern entrance",
      shortLabel: "Entrance",
      description: "Automatic doors with ramped approach from the car park.",
      position: { x: 0.5, y: 0.88 },
      status: "verified",
      operationalStatus: "available",
      accessibilityLevel: "silver",
      measurements: { doorWidthMm: 920, thresholdHeightMm: 5 },
      lastVerifiedAt: "2026-05-12",
    },
    {
      id: "feat-reception",
      floorPlanId: "demo-parramatta-ground",
      type: "reception",
      name: "Reception desk",
      shortLabel: "Recep",
      description: "Lowered section available. Hearing loop at desk.",
      position: { x: 0.5, y: 0.55 },
      status: "verified",
      operationalStatus: "available",
      measurements: { counterHeightMm: 750 },
      lastVerifiedAt: "2026-05-12",
    },
    {
      id: "feat-ground-lift",
      floorPlanId: "demo-parramatta-ground",
      type: "lift",
      name: "Main lift",
      shortLabel: "Lift",
      description: "Lift serves all public floors. Braille and audible indicators.",
      position: { x: 0.72, y: 0.45 },
      status: "verified",
      operationalStatus: "available",
      connectorId: LIFT_CONNECTOR_ID,
      measurements: { liftDoorWidthMm: 900 },
      lastVerifiedAt: "2026-05-12",
    },
    {
      id: "feat-ground-toilet",
      floorPlanId: "demo-parramatta-ground",
      type: "accessible_toilet",
      name: "Accessible toilet",
      shortLabel: "Toilet",
      description: "Ground-floor accessible toilet near lift.",
      position: { x: 0.82, y: 0.35 },
      status: "verified",
      operationalStatus: "available",
      measurements: { doorWidthMm: 910, turningCircleMm: 1500 },
      lastVerifiedAt: "2026-05-12",
    },
    {
      id: "feat-quiet-room",
      floorPlanId: "demo-parramatta-ground",
      type: "quiet_room",
      name: "Quiet study room",
      shortLabel: "Quiet",
      description: "Bookable quiet room with adjustable lighting.",
      position: { x: 0.25, y: 0.35 },
      status: "verified",
      operationalStatus: "available",
      lastVerifiedAt: "2026-05-12",
    },
    {
      id: "feat-temp-barrier",
      floorPlanId: "demo-parramatta-ground",
      type: "temporary_barrier",
      name: "Temporary corridor barrier",
      shortLabel: "Barrier",
      description: "Short-term works near east corridor. Use main corridor instead.",
      position: { x: 0.65, y: 0.62 },
      status: "community_reported",
      operationalStatus: "temporarily_closed",
      notes: ["Reported 2026-06-01. Detour via reception."],
      lastVerifiedAt: "2026-06-01",
    },
    {
      id: "feat-hearing-loop",
      floorPlanId: "demo-parramatta-ground",
      type: "hearing_loop",
      name: "Hearing loop — service desk",
      shortLabel: "Loop",
      position: { x: 0.52, y: 0.52 },
      status: "verified",
      operationalStatus: "available",
      lastVerifiedAt: "2026-05-12",
    },
  ],
  zones: [
    {
      id: "zone-quiet-ground",
      type: "quiet_zone",
      name: "Quiet study area",
      polygon: [
        { x: 0.12, y: 0.22 },
        { x: 0.38, y: 0.22 },
        { x: 0.38, y: 0.48 },
        { x: 0.12, y: 0.48 },
      ],
      description: "Lower noise area on ground floor.",
    },
  ],
  routes: [
    {
      id: "route-entrance-toilet",
      name: "Step-free entrance to accessible toilet",
      routeType: "step_free",
      fromFeatureId: "feat-south-entrance",
      toFeatureId: "feat-ground-toilet",
      floorSegments: [
        {
          floorPlanId: "demo-parramatta-ground",
          points: [
            { x: 0.5, y: 0.88 },
            { x: 0.5, y: 0.65 },
            { x: 0.72, y: 0.65 },
            { x: 0.82, y: 0.35 },
          ],
        },
      ],
      steps: [
        {
          id: "step-1",
          floorPlanId: "demo-parramatta-ground",
          instruction: "Enter through the step-free southern entrance.",
          distanceMetres: 0,
          featureId: "feat-south-entrance",
        },
        {
          id: "step-2",
          floorPlanId: "demo-parramatta-ground",
          instruction: "Continue approximately 14 metres along the main corridor.",
          distanceMetres: 14,
        },
        {
          id: "step-3",
          floorPlanId: "demo-parramatta-ground",
          instruction: "Turn right at the lift area.",
          featureId: "feat-ground-lift",
        },
        {
          id: "step-4",
          floorPlanId: "demo-parramatta-ground",
          instruction: "The accessible toilet is on the right.",
          featureId: "feat-ground-toilet",
        },
      ],
      verifiedAt: "2026-05-12",
      warnings: ["East corridor temporarily closed — use main corridor."],
    },
  ],
  connectors: [
    {
      id: LIFT_CONNECTOR_ID,
      type: "lift",
      name: "Main lift",
      connectedFloorPlanIds: ["demo-parramatta-ground", "demo-parramatta-level1"],
      accessible: true,
      operationalStatus: "available",
    },
  ],
  routeGraph: {
    schemaVersion: 1,
    nodes: [
      {
        id: "node-entrance",
        floorPlanId: "demo-parramatta-ground",
        type: "entrance",
        position: { x: 0.5, y: 0.88 },
        featureId: "feat-south-entrance",
      },
      {
        id: "node-junction-lift",
        floorPlanId: "demo-parramatta-ground",
        type: "junction",
        position: { x: 0.72, y: 0.65 },
      },
      {
        id: "node-lift",
        floorPlanId: "demo-parramatta-ground",
        type: "lift",
        position: { x: 0.72, y: 0.45 },
        featureId: "feat-ground-lift",
      },
      {
        id: "node-toilet",
        floorPlanId: "demo-parramatta-ground",
        type: "destination",
        position: { x: 0.82, y: 0.35 },
        featureId: "feat-ground-toilet",
      },
    ],
    edges: [
      {
        id: "edge-entrance-junction",
        fromNodeId: "node-entrance",
        toNodeId: "node-junction-lift",
        bidirectional: true,
        stepFree: true,
        distanceMetres: 14,
        trustLevel: "mapable_verified",
        restricted: false,
      },
      {
        id: "edge-junction-lift",
        fromNodeId: "node-junction-lift",
        toNodeId: "node-lift",
        bidirectional: true,
        stepFree: true,
        distanceMetres: 5,
        trustLevel: "mapable_verified",
        restricted: false,
      },
      {
        id: "edge-lift-toilet",
        fromNodeId: "node-lift",
        toNodeId: "node-toilet",
        bidirectional: true,
        stepFree: true,
        distanceMetres: 8,
        minimumWidthMm: 900,
        trustLevel: "mapable_verified",
        restricted: false,
      },
    ],
  },
};

const LEVEL_ONE: FloorPlanDetail = {
  id: "demo-parramatta-level1",
  floorCode: "1",
  floorName: "Level 1",
  sortOrder: 1,
  planAsset: {
    url: "/floor-plans/demo/parramatta-level1.svg",
    type: "svg",
    width: 800,
    height: 600,
    altText:
      "Level 1 floor plan of Parramatta City Library showing accessible seating, hearing loop area, and Changing Places facility.",
  },
  sourceName: "MapAble assessor",
  licenceOrPermission: "MapAble assessor produced for demo purposes",
  version: 1,
  verifiedAt: "2026-05-12T00:00:00.000Z",
  verifiedByType: "MapAble assessor",
  isToScale: false,
  orientationLabel: "North up",
  features: [
    {
      id: "feat-level1-lift",
      floorPlanId: "demo-parramatta-level1",
      type: "lift",
      name: "Main lift",
      shortLabel: "Lift",
      description: "Lift serves all public floors.",
      position: { x: 0.72, y: 0.45 },
      status: "verified",
      operationalStatus: "available",
      connectorId: LIFT_CONNECTOR_ID,
      measurements: { liftDoorWidthMm: 900 },
      lastVerifiedAt: "2026-05-12",
    },
    {
      id: "feat-accessible-seating",
      floorPlanId: "demo-parramatta-level1",
      type: "accessible_seating",
      name: "Accessible seating area",
      shortLabel: "Seating",
      description: "Wheelchair spaces with companion seating.",
      position: { x: 0.35, y: 0.4 },
      status: "verified",
      operationalStatus: "available",
      lastVerifiedAt: "2026-05-12",
    },
    {
      id: "feat-changing-places",
      floorPlanId: "demo-parramatta-level1",
      type: "changing_places",
      name: "Changing Places facility",
      shortLabel: "CP",
      description: "Adult change table and hoist. Key available at reception.",
      position: { x: 0.82, y: 0.3 },
      status: "verified",
      operationalStatus: "available",
      measurements: { doorWidthMm: 950, turningCircleMm: 1800 },
      lastVerifiedAt: "2026-05-12",
    },
    {
      id: "feat-level1-hearing",
      floorPlanId: "demo-parramatta-level1",
      type: "hearing_loop",
      name: "Hearing loop — reading room",
      shortLabel: "Loop",
      position: { x: 0.4, y: 0.55 },
      status: "verified",
      operationalStatus: "available",
      lastVerifiedAt: "2026-05-12",
    },
    {
      id: "feat-low-sensory",
      floorPlanId: "demo-parramatta-level1",
      type: "low_sensory_zone",
      name: "Low-sensory reading nook",
      shortLabel: "Low",
      description: "Dimmed lighting available on request.",
      position: { x: 0.2, y: 0.55 },
      status: "verified",
      operationalStatus: "available",
      lastVerifiedAt: "2026-05-12",
    },
  ],
  zones: [
    {
      id: "zone-low-sensory",
      type: "quiet_zone",
      name: "Low-sensory zone",
      polygon: [
        { x: 0.1, y: 0.45 },
        { x: 0.32, y: 0.45 },
        { x: 0.32, y: 0.68 },
        { x: 0.1, y: 0.68 },
      ],
    },
  ],
  routes: [
    {
      id: "route-lift-to-cp",
      name: "Lift to Changing Places",
      routeType: "step_free",
      fromFeatureId: "feat-level1-lift",
      toFeatureId: "feat-changing-places",
      floorSegments: [
        {
          floorPlanId: "demo-parramatta-level1",
          points: [
            { x: 0.72, y: 0.45 },
            { x: 0.82, y: 0.3 },
          ],
        },
      ],
      steps: [
        {
          id: "l1-step-1",
          floorPlanId: "demo-parramatta-level1",
          instruction: "Exit the lift on Level 1.",
          featureId: "feat-level1-lift",
        },
        {
          id: "l1-step-2",
          floorPlanId: "demo-parramatta-level1",
          instruction: "The Changing Places facility is approximately 8 metres ahead on the right.",
          distanceMetres: 8,
          featureId: "feat-changing-places",
        },
      ],
      verifiedAt: "2026-05-12",
    },
  ],
  connectors: [
    {
      id: LIFT_CONNECTOR_ID,
      type: "lift",
      name: "Main lift",
      connectedFloorPlanIds: ["demo-parramatta-ground", "demo-parramatta-level1"],
      accessible: true,
      operationalStatus: "available",
    },
  ],
};

const DEMO_FLOOR_PLANS: Record<string, FloorPlanDetail[]> = {
  "demo-parramatta-library": [GROUND_FLOOR, LEVEL_ONE],
};

export function getDemoFloorPlanSummaries(venueId: string): VenueFloorPlanListResponse | null {
  const plans = DEMO_FLOOR_PLANS[venueId];
  if (!plans) return null;
  return {
    venueId,
    venueName: "Parramatta City Library",
    hasFloorPlan: true,
    floorPlanCount: plans.length,
    floorPlanLastVerifiedAt: "2026-05-12T00:00:00.000Z",
    plans: plans.map((p) => ({
      id: p.id,
      floorCode: p.floorCode,
      floorName: p.floorName,
      sortOrder: p.sortOrder,
      featureCount: p.features.length,
    })),
  };
}

export function getDemoFloorPlanDetail(
  venueId: string,
  floorPlanId: string,
): { venueName: string; plan: FloorPlanDetail } | null {
  const plans = DEMO_FLOOR_PLANS[venueId];
  if (!plans) return null;
  const plan = plans.find((p) => p.id === floorPlanId);
  if (!plan) return null;
  return { venueName: "Parramatta City Library", plan };
}

export function demoVenueHasFloorPlan(venueId: string): boolean {
  return DEMO_FLOOR_PLAN_VENUE_IDS.has(venueId);
}

export function getDemoFloorPlanCount(venueId: string): number {
  return DEMO_FLOOR_PLANS[venueId]?.length ?? 0;
}
