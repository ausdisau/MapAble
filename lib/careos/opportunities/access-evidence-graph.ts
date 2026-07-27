import type { AccessConfidenceLevel } from "@prisma/client";

import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import { confidenceLabel } from "@/lib/access-map/access-confidence-service";
import { prisma } from "@/lib/prisma";

export type EvidenceProvenanceClass =
  | "unknown"
  | "user_reported"
  | "community"
  | "venue_claimed"
  | "mapable_verified"
  | "mapable_accredited"
  | "rating_only";

export type AccessEvidenceGraphNode = {
  id: string;
  entityType: "place" | "property" | "vehicle" | "careos_evidence";
  label: string;
  confidence: AccessConfidenceLevel | "unknown";
  provenanceClass: EvidenceProvenanceClass;
  ratingIsVerified: false;
  unknownRemainsUnknown: boolean;
  sourceRefs: string[];
};

function assertGraphEnabled() {
  if (!careosOpportunitiesConfig.accessEvidenceGraphEnabled) {
    throw new Error("ACCESS_EVIDENCE_GRAPH_DISABLED");
  }
}

function provenanceFromConfidence(
  level: AccessConfidenceLevel,
): EvidenceProvenanceClass {
  switch (level) {
    case "user_reported":
      return "user_reported";
    case "multiple_user_reports":
      return "community";
    case "venue_claimed":
      return "venue_claimed";
    case "mapable_verified":
      return "mapable_verified";
    case "mapable_accredited":
      return "mapable_accredited";
    case "unknown":
      return "unknown";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

/**
 * O9 — Unified Access Evidence Graph (read API).
 * Ratings never promoted to verified; unknown stays unknown.
 */
export async function queryAccessEvidenceGraph(input: {
  placeId?: string;
  query?: string;
  take?: number;
}): Promise<{
  nodes: AccessEvidenceGraphNode[];
  edges: Array<{ from: string; to: string; relation: string }>;
  doctrine: {
    ratingsAreNotVerified: true;
    unknownRemainsUnknown: true;
    noParticipantScores: true;
  };
}> {
  assertGraphEnabled();
  const take = Math.min(input.take ?? 25, 100);

  const places = await prisma.accessPlace.findMany({
    where: input.placeId
      ? { id: input.placeId }
      : input.query
        ? {
            OR: [
              { name: { contains: input.query, mode: "insensitive" } },
              { suburb: { contains: input.query, mode: "insensitive" } },
            ],
          }
        : undefined,
    take,
    orderBy: { updatedAt: "desc" },
  });

  const nodes: AccessEvidenceGraphNode[] = places.map((place) => {
    const confidence = place.confidence ?? "unknown";
    const provenanceClass = provenanceFromConfidence(confidence);
    return {
      id: place.id,
      entityType: "place" as const,
      label: `${place.name} — ${confidenceLabel(confidence)}`,
      confidence,
      provenanceClass,
      ratingIsVerified: false as const,
      unknownRemainsUnknown: confidence === "unknown",
      sourceRefs: [`access_place:${place.id}`, `source:${place.sourceType}`],
    };
  });

  const careosEvidence = input.placeId
    ? await prisma.careOSEvidenceReference.findMany({
        where: {
          OR: [
            { sourceId: input.placeId },
            { summary: { contains: input.placeId } },
          ],
        },
        take: 20,
      })
    : [];

  for (const evidence of careosEvidence) {
    nodes.push({
      id: evidence.id,
      entityType: "careos_evidence",
      label: evidence.summary,
      confidence: "unknown",
      provenanceClass:
        evidence.verificationStatus === "verified"
          ? "mapable_verified"
          : "unknown",
      ratingIsVerified: false,
      unknownRemainsUnknown: evidence.verificationStatus !== "verified",
      sourceRefs: [
        `careos_evidence:${evidence.id}`,
        evidence.sourceId ? `source:${evidence.sourceId}` : "source:none",
      ],
    });
  }

  const edges = careosEvidence.flatMap((evidence) =>
    input.placeId
      ? [
          {
            from: evidence.id,
            to: input.placeId,
            relation: "references",
          },
        ]
      : [],
  );

  return {
    nodes,
    edges,
    doctrine: {
      ratingsAreNotVerified: true,
      unknownRemainsUnknown: true,
      noParticipantScores: true,
    },
  };
}
