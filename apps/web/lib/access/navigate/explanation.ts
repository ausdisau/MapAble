import type { AccessPathSegment, RouteObjective } from "./types";

export type RouteExplanation = {
  routeId: string;
  distanceMetres: number;
  durationMinutes: number;
  maximumSlopePercent: number;
  minimumWidthMm: number;
  surfaceSummary: Array<{ type: string; percent: number }>;
  curbCuts: number;
  crossings: number;
  stairs: number;
  unknownSegments: number;
  temporaryBarriers: number;
  confidence: number;
  evidenceCoverage: number;
  lastVerified: string | null;
  warnings: string[];
  explanation: string;
  alternatives: string[];
};

export function summariseSegments(segments: AccessPathSegment[]): {
  maximumSlopePercent: number;
  minimumWidthMm: number;
  surfaceSummary: Array<{ type: string; percent: number }>;
  curbCuts: number;
  crossings: number;
  stairs: number;
  unknownSegments: number;
  confidence: number;
  evidenceCoverage: number;
  lastVerified: string | null;
  warnings: string[];
} {
  if (segments.length === 0) {
    return {
      maximumSlopePercent: 0,
      minimumWidthMm: 0,
      surfaceSummary: [],
      curbCuts: 0,
      crossings: 0,
      stairs: 0,
      unknownSegments: 0,
      confidence: 0,
      evidenceCoverage: 0,
      lastVerified: null,
      warnings: ["No route segments available."],
    };
  }

  const totalLen = segments.reduce((s, seg) => s + seg.lengthMetres, 0);
  const surfaceMap = new Map<string, number>();
  let minimumWidthMm = Infinity;
  let maximumSlopePercent = 0;
  let curbCuts = 0;
  let crossings = 0;
  let stairs = 0;
  let unknownSegments = 0;
  let confidenceSum = 0;
  let evidenceCount = 0;
  let lastVerified: string | null = null;
  const warnings: string[] = [];

  for (const seg of segments) {
    surfaceMap.set(
      seg.surfaceType,
      (surfaceMap.get(seg.surfaceType) ?? 0) + seg.lengthMetres,
    );
    if (seg.widthMm != null) minimumWidthMm = Math.min(minimumWidthMm, seg.widthMm);
    maximumSlopePercent = Math.max(maximumSlopePercent, seg.longitudinalSlopePercent);
    if (seg.curbCut) curbCuts += 1;
    if (seg.crossingType !== "none") crossings += 1;
    stairs += seg.stairs;
    if (seg.surfaceType === "UNKNOWN" || seg.confidence < 0.5) unknownSegments += 1;
    confidenceSum += seg.confidence;
    if (seg.accessibilityEvidenceIds.length > 0) evidenceCount += 1;
    if (seg.lastHumanVerifiedAt) {
      if (!lastVerified || seg.lastHumanVerifiedAt > lastVerified) {
        lastVerified = seg.lastHumanVerifiedAt;
      }
    }
    if (seg.sourceClass === "ai_inferred") {
      warnings.push(`Segment ${seg.id} uses AI-inferred data — not independently verified.`);
    }
    if (seg.longitudinalSlopePercent > 5) {
      warnings.push(
        `Segment ${seg.id} has ${seg.longitudinalSlopePercent}% gradient — above typical power-chair preference.`,
      );
    }
    if (seg.stairs > 0) {
      warnings.push(`Segment ${seg.id} includes stairs — excluded unless you allow stairs.`);
    }
  }

  const surfaceSummary = [...surfaceMap.entries()].map(([type, len]) => ({
    type,
    percent: Math.round((len / totalLen) * 100),
  }));

  return {
    maximumSlopePercent,
    minimumWidthMm: minimumWidthMm === Infinity ? 0 : minimumWidthMm,
    surfaceSummary,
    curbCuts,
    crossings,
    stairs,
    unknownSegments,
    confidence: confidenceSum / segments.length,
    evidenceCoverage: evidenceCount / segments.length,
    lastVerified,
    warnings,
  };
}

export function buildExplanation(params: {
  routeId: string;
  objective: RouteObjective;
  segments: AccessPathSegment[];
  distanceMetres: number;
  durationMinutes: number;
  temporaryBarriers?: number;
  alternativeObjectives?: RouteObjective[];
}): RouteExplanation {
  const summary = summariseSegments(params.segments);
  const alt = params.alternativeObjectives ?? [];

  let explanation = `Route uses ${params.segments.length} segments over ${params.distanceMetres} metres (about ${params.durationMinutes} minutes). `;
  explanation += `Evidence coverage is ${Math.round(summary.evidenceCoverage * 100)}% with confidence ${Math.round(summary.confidence * 100)}%. `;

  if (summary.unknownSegments > 0) {
    explanation += `${summary.unknownSegments} segment(s) have limited or unverified evidence. `;
  }
  if (params.objective === "LOWEST_GRADIENT") {
    explanation += "This option prioritises lower gradients over shortest distance.";
  } else if (params.objective === "MOST_VERIFIED") {
    explanation += "This option prioritises segments with stronger verification.";
  } else if (params.objective === "FASTEST") {
    explanation += "This option prioritises shorter distance; check gradient and evidence warnings.";
  }

  if (alt.length > 0) {
    explanation += ` Alternatives available: ${alt.join(", ")}.`;
  }

  return {
    routeId: params.routeId,
    distanceMetres: params.distanceMetres,
    durationMinutes: params.durationMinutes,
    maximumSlopePercent: summary.maximumSlopePercent,
    minimumWidthMm: summary.minimumWidthMm,
    surfaceSummary: summary.surfaceSummary,
    curbCuts: summary.curbCuts,
    crossings: summary.crossings,
    stairs: summary.stairs,
    unknownSegments: summary.unknownSegments,
    temporaryBarriers: params.temporaryBarriers ?? 0,
    confidence: summary.confidence,
    evidenceCoverage: summary.evidenceCoverage,
    lastVerified: summary.lastVerified,
    warnings: summary.warnings,
    explanation,
    alternatives: alt.map(String),
  };
}

export function compareRouteExplanation(
  chosen: RouteExplanation,
  alternative: RouteExplanation,
): string {
  const extraDist = alternative.distanceMetres - chosen.distanceMetres;
  const slopeDiff =
    alternative.maximumSlopePercent - chosen.maximumSlopePercent;
  if (extraDist > 0 && slopeDiff < 0) {
    return `Alternative is ${extraDist} metres longer but avoids a ${Math.abs(slopeDiff).toFixed(1)}% steeper maximum gradient.`;
  }
  if (alternative.evidenceCoverage > chosen.evidenceCoverage) {
    return `Alternative has ${Math.round((alternative.evidenceCoverage - chosen.evidenceCoverage) * 100)}% better evidence coverage.`;
  }
  return "Alternative offers different trade-offs — review warnings and segment evidence.";
}
