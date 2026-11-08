import type { AccessSourceClass } from "@/lib/access/infrastructure/provenance";

export type PathSurfaceType =
  | "CONCRETE"
  | "ASPHALT"
  | "PAVERS"
  | "GRAVEL"
  | "GRASS"
  | "WOOD"
  | "UNKNOWN";

export type AccessPathNode = {
  id: string;
  lat: number;
  lng: number;
  label: string;
};

export type AccessPathSegment = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  bidirectional: boolean;
  lengthMetres: number;
  widthMm: number | null;
  longitudinalSlopePercent: number;
  crossSlopePercent: number;
  surfaceType: PathSurfaceType;
  surfaceCondition: "good" | "fair" | "poor" | "unknown";
  curbCut: boolean;
  curbCutWidthMm: number | null;
  stairs: number;
  crossingType: "none" | "marked" | "signal" | "unsignalised";
  confidence: number;
  sourceClass: AccessSourceClass;
  lastObservedAt: string | null;
  lastHumanVerifiedAt: string | null;
  accessibilityEvidenceIds: string[];
};

export type AccessPathGraph = {
  graphId: string;
  label: string;
  nodes: AccessPathNode[];
  segments: AccessPathSegment[];
  isLiveEvidence: false;
};

export type TemporaryBarrierState = {
  id: string;
  segmentId: string;
  type: string;
  reportedAt: string;
  expiresAt: string | null;
  confidence: number;
  verificationState: "community_reported";
};

export type RouteObjective =
  | "FASTEST"
  | "SMOOTHEST"
  | "LOWEST_GRADIENT"
  | "MOST_VERIFIED"
  | "FEWEST_CROSSINGS"
  | "CUSTOM";

export type MobilityRoutingConstraints = {
  chairWidthMm: number;
  minimumPreferredPathWidthMm: number;
  preferredMaximumSlopePercent: number;
  absoluteMaximumSlopePercent: number;
  preferredMaximumCrossSlopePercent: number;
  curbRampRequired: boolean;
  stairsAllowed: boolean;
  avoidedSurfaceTypes: PathSurfaceType[];
  unknownSegmentPolicy: "avoid" | "allow_with_warning";
  lowConfidencePolicy: "avoid" | "allow_with_warning";
};

export const DEFAULT_MOBILITY_CONSTRAINTS: MobilityRoutingConstraints = {
  chairWidthMm: 700,
  minimumPreferredPathWidthMm: 1200,
  preferredMaximumSlopePercent: 5,
  absoluteMaximumSlopePercent: 8,
  preferredMaximumCrossSlopePercent: 2,
  curbRampRequired: true,
  stairsAllowed: false,
  avoidedSurfaceTypes: ["GRAVEL", "GRASS"],
  unknownSegmentPolicy: "allow_with_warning",
  lowConfidencePolicy: "allow_with_warning",
};

export type PlannedRoutePath = {
  segmentIds: string[];
  nodeIds: string[];
  totalDistanceMetres: number;
  totalDurationMinutes: number;
};

export type RoutePlanResult = {
  paths: Array<{
    objective: RouteObjective;
    path: PlannedRoutePath;
    segments: AccessPathSegment[];
  }>;
};
