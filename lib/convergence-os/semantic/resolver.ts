import type { Prisma, SemanticOverlapClass } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isRelatedProjectionPair } from "@/lib/convergence-os/schema/collision-engine";

export type SemanticCandidateSeed = {
  candidateKey: string;
  leftName: string;
  rightName: string;
  leftPath?: string;
  rightPath?: string;
  classification: SemanticOverlapClass;
  confidence: number;
  unresolvedDifferences: string;
  recommendedReviewers: string[];
  evidenceJson: Prisma.InputJsonValue;
};

/**
 * Seed semantic overlap candidates from known platform collisions.
 * Never auto-merges concepts — humans decide canonical meaning.
 */
export const SEMANTIC_CANDIDATE_SEEDS: SemanticCandidateSeed[] = [
  {
    candidateKey: "case_vs_careos_mission",
    leftName: "Case",
    rightName: "CareOSMission",
    leftPath: "prisma Case / lib/cases",
    rightPath: "CareOS PR #252",
    classification: "overlapping_concept",
    confidence: 0.82,
    unresolvedDifferences:
      "Case remains interim bridge; CareOSMission is proposed cross-programme mission SoR.",
    recommendedReviewers: ["care_os", "architecture"],
    evidenceJson: {
      signals: ["shared mission semantics", "multi-writer collision"],
      vectorSimilarityAlone: false,
    },
  },
  {
    candidateKey: "transport_booking_vs_trip",
    leftName: "TransportBooking",
    rightName: "TransportTrip",
    leftPath: "legacy booking",
    rightPath: "lib/transport",
    classification: "legacy_alias",
    confidence: 0.75,
    unresolvedDifferences: "Booking may remain adapter over Trip.",
    recommendedReviewers: ["transport", "architecture"],
    evidenceJson: { signals: ["shared fields", "programme ownership"] },
  },
  {
    candidateKey: "venue_vs_access_place",
    leftName: "Venue",
    rightName: "AccessPlace",
    classification: "overlapping_concept",
    confidence: 0.7,
    unresolvedDifferences: "Public place identity should consolidate on AccessPlace.",
    recommendedReviewers: ["places", "architecture"],
    evidenceJson: { signals: ["place identity", "C-011"] },
  },
  {
    candidateKey: "provider_vs_organisation",
    leftName: "Provider",
    rightName: "Organisation",
    classification: "extension",
    confidence: 0.65,
    unresolvedDifferences: "Provider may be role/extension of Organisation.",
    recommendedReviewers: ["identity", "architecture"],
    evidenceJson: { signals: ["org tenancy", "C-015"] },
  },
  {
    candidateKey: "personal_vault_dual",
    leftName: "PersonalVault",
    rightName: "PersonalVault",
    leftPath: "Vault #281",
    rightPath: "RightsOS #280",
    classification: "identical_concept",
    confidence: 0.95,
    unresolvedDifferences: "Dual DDL definitions — Vault SoR wins per C-008.",
    recommendedReviewers: ["personal_access_vault", "rights_os", "architecture"],
    evidenceJson: { signals: ["identical model name", "dual branch DDL"] },
  },
  {
    candidateKey: "floor_plan_vs_living_twin",
    leftName: "AccessFloorPlan",
    rightName: "LivingAccessTwin",
    classification: "projection",
    confidence: 0.78,
    unresolvedDifferences:
      "Living Access Twin projects indoor accessibility; must not become second place SoR.",
    recommendedReviewers: ["indoor_accessibility", "architecture"],
    evidenceJson: { signals: ["C-012", "extends AccessPlace"] },
  },
];

export async function seedSemanticCandidates(): Promise<{ upserted: number }> {
  let upserted = 0;
  for (const seed of SEMANTIC_CANDIDATE_SEEDS) {
    // Reinforce projection labelling when related-pair helper agrees
    const classification =
      isRelatedProjectionPair(seed.leftName, seed.rightName) &&
      seed.classification === "overlapping_concept"
        ? ("projection" as const)
        : seed.classification;

    await prisma.semanticOverlapCandidate.upsert({
      where: { candidateKey: seed.candidateKey },
      create: {
        candidateKey: seed.candidateKey,
        leftName: seed.leftName,
        rightName: seed.rightName,
        leftPath: seed.leftPath,
        rightPath: seed.rightPath,
        classification,
        confidence: seed.confidence,
        unresolvedDifferences: seed.unresolvedDifferences,
        recommendedReviewers: seed.recommendedReviewers,
        evidenceJson: seed.evidenceJson,
        humanDecision: null,
      },
      update: {
        classification,
        confidence: seed.confidence,
        unresolvedDifferences: seed.unresolvedDifferences,
        recommendedReviewers: seed.recommendedReviewers,
        evidenceJson: seed.evidenceJson,
      },
    });
    upserted += 1;
  }
  return { upserted };
}

export async function recordHumanSemanticDecision(input: {
  candidateKey: string;
  humanDecision: string;
  actorIsHuman: boolean;
}) {
  if (!input.actorIsHuman) {
    throw new Error("Only humans may decide canonical semantic meaning");
  }
  return prisma.semanticOverlapCandidate.update({
    where: { candidateKey: input.candidateKey },
    data: {
      humanDecision: input.humanDecision,
    },
  });
}
