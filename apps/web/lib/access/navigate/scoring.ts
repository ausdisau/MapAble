import type {
  AccessPathSegment,
  MobilityRoutingConstraints,
  RouteObjective,
  TemporaryBarrierState,
} from "./types";

export function segmentPassesHardConstraints(
  segment: AccessPathSegment,
  constraints: MobilityRoutingConstraints,
): boolean {
  if (segment.stairs > 0 && !constraints.stairsAllowed) return false;
  const requiredWidth = Math.max(
    constraints.chairWidthMm + 100,
    constraints.minimumPreferredPathWidthMm,
  );
  if (segment.widthMm != null && segment.widthMm < requiredWidth) return false;
  if (segment.longitudinalSlopePercent > constraints.absoluteMaximumSlopePercent) {
    return false;
  }
  if (constraints.curbRampRequired && !segment.curbCut && segment.stairs === 0) {
    // Allow if no curb transition needed (internal path) — only block marked crossings without curb cut
    if (segment.crossingType !== "none") return false;
  }
  return true;
}

export function segmentExcludedByPolicy(
  segment: AccessPathSegment,
  constraints: MobilityRoutingConstraints,
): boolean {
  if (constraints.avoidedSurfaceTypes.includes(segment.surfaceType)) return true;
  if (
    segment.surfaceType === "UNKNOWN" &&
    constraints.unknownSegmentPolicy === "avoid"
  ) {
    return true;
  }
  if (
    segment.confidence < 0.5 &&
    constraints.lowConfidencePolicy === "avoid"
  ) {
    return true;
  }
  return false;
}

export function edgeWeight(
  segment: AccessPathSegment,
  objective: RouteObjective,
  constraints: MobilityRoutingConstraints,
): number {
  let cost = segment.lengthMetres;

  const slopePenalty =
    Math.max(0, segment.longitudinalSlopePercent - constraints.preferredMaximumSlopePercent) *
    40;
  cost += slopePenalty;

  const crossSlopePenalty =
    Math.max(0, segment.crossSlopePercent - constraints.preferredMaximumCrossSlopePercent) *
    25;
  cost += crossSlopePenalty;

  if (segment.surfaceCondition === "poor") cost += 80;
  if (segment.surfaceCondition === "fair") cost += 30;
  if (constraints.avoidedSurfaceTypes.includes(segment.surfaceType)) cost += 200;

  if (segment.widthMm != null && segment.widthMm < constraints.minimumPreferredPathWidthMm) {
    cost += (constraints.minimumPreferredPathWidthMm - segment.widthMm) * 0.5;
  }

  if (segment.crossingType === "unsignalised") cost += 40;
  if (!segment.curbCut && segment.crossingType !== "none") cost += 60;

  const uncertaintyCost = (1 - segment.confidence) * 100;
  cost += uncertaintyCost;

  if (segment.sourceClass === "ai_inferred") cost += 50;
  if (segment.sourceClass === "unknown") cost += 80;

  switch (objective) {
    case "FASTEST":
      break;
    case "SMOOTHEST":
      if (segment.surfaceCondition !== "good") cost += 60;
      if (segment.surfaceType === "PAVERS" || segment.surfaceType === "GRAVEL") cost += 40;
      break;
    case "LOWEST_GRADIENT":
      cost += segment.longitudinalSlopePercent * 25;
      break;
    case "MOST_VERIFIED":
      cost += (1 - segment.confidence) * 150;
      if (!segment.lastHumanVerifiedAt) cost += 40;
      break;
    case "FEWEST_CROSSINGS":
      if (segment.crossingType !== "none") cost += 100;
      break;
    case "CUSTOM":
      break;
    default: {
      const _exhaustive: never = objective;
      return _exhaustive;
    }
  }

  return cost;
}

export function isSegmentBlocked(
  segmentId: string,
  barriers: TemporaryBarrierState[],
  now = new Date(),
): boolean {
  return barriers.some((b) => {
    if (b.segmentId !== segmentId) return false;
    if (b.expiresAt && new Date(b.expiresAt) < now) return false;
    return true;
  });
}
