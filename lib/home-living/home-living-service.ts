import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import { prisma } from "@/lib/prisma";

export type ClinicalBoundaryClassification =
  | "operational_coordination"
  | "participant_preference"
  | "approved_support_instruction"
  | "requires_qualified_clinical_review"
  | "emergency_escalation"
  | "prohibited_ai_decision";

export function classifyClinicalBoundary(
  category:
    | "preference"
    | "authorised_plan"
    | "diagnosis"
    | "medication_change"
    | "emergency"
    | "restrictive_practice"
    | "coordination",
): ClinicalBoundaryClassification {
  switch (category) {
    case "preference":
      return "participant_preference";
    case "authorised_plan":
      return "approved_support_instruction";
    case "coordination":
      return "operational_coordination";
    case "emergency":
      return "emergency_escalation";
    case "diagnosis":
    case "medication_change":
    case "restrictive_practice":
      return "prohibited_ai_decision";
    default: {
      const exhaustive: never = category;
      return exhaustive;
    }
  }
}

export async function updateHomeLivingProfile(input: {
  participantId: string;
  actorUserId: string;
  desiredLivingArrangements: string[];
  preferredLocations: string[];
  accessibilityRequirements: string[];
  communicationRequirements: string[];
  privacyPreferences: string[];
  dignityOfRiskChoices: string[];
  nonNegotiables: string[];
}) {
  if (!homeLivingConfig.enabled) throw new Error("HOME_LIVING_DISABLED");
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  const profile = await prisma.homeLivingProfile.upsert({
    where: { participantId: input.participantId },
    create: {
      participantId: input.participantId,
      desiredLivingArrangements: input.desiredLivingArrangements,
      preferredLocations: input.preferredLocations,
      accessibilityRequirements: input.accessibilityRequirements,
      communicationRequirements: input.communicationRequirements,
      privacyPreferences: input.privacyPreferences,
      dignityOfRiskChoices: input.dignityOfRiskChoices,
      nonNegotiables: input.nonNegotiables,
    },
    update: {
      desiredLivingArrangements: input.desiredLivingArrangements,
      preferredLocations: input.preferredLocations,
      accessibilityRequirements: input.accessibilityRequirements,
      communicationRequirements: input.communicationRequirements,
      privacyPreferences: input.privacyPreferences,
      dignityOfRiskChoices: input.dignityOfRiskChoices,
      nonNegotiables: input.nonNegotiables,
    },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "home_living.profile_updated",
    entityType: "HomeLivingProfile",
    entityId: profile.id,
  });
  return profile;
}

export function evaluateComplexSupportEligibility(input: {
  requiredCompetencies: string[];
  evidence: Array<{
    competencyType: string;
    verificationStatus: string;
    effectiveAt: Date;
    expiresAt: Date | null;
    revokedAt: Date | null;
    participantId: string | null;
  }>;
  participantId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const verifiedRequirements: string[] = [];
  const missingRequirements: string[] = [];
  const expiredRequirements: string[] = [];
  for (const requirement of input.requiredCompetencies) {
    const record = input.evidence.find(
      (item) =>
        item.competencyType === requirement &&
        (!item.participantId || item.participantId === input.participantId),
    );
    if (!record || record.verificationStatus !== "verified") {
      missingRequirements.push(requirement);
      continue;
    }
    if (
      record.revokedAt ||
      record.effectiveAt > now ||
      (record.expiresAt && record.expiresAt <= now)
    ) {
      expiredRequirements.push(requirement);
      continue;
    }
    verifiedRequirements.push(requirement);
  }
  return {
    eligibility:
      missingRequirements.length || expiredRequirements.length
        ? ("requires_human_review" as const)
        : ("eligible" as const),
    verifiedRequirements,
    missingRequirements,
    expiredRequirements,
    participantOrientationStatus: input.evidence.some(
      (item) => item.participantId === input.participantId,
    )
      ? "verified"
      : "missing",
    reviewerRequired:
      missingRequirements.length > 0 || expiredRequirements.length > 0,
  };
}

export async function addSupportPlanVersion(input: {
  supportPlanId: string;
  participantId: string;
  actorUserId: string;
  authorAuthority: string;
  instructions: Record<string, unknown>;
  limitations: string[];
  effectiveAt: Date;
  reviewAt?: Date;
}) {
  if (!homeLivingConfig.highIntensityGovernanceEnabled) {
    throw new Error("HIGH_INTENSITY_GOVERNANCE_DISABLED");
  }
  const plan = await prisma.participantSupportPlan.findFirst({
    where: {
      id: input.supportPlanId,
      participantId: input.participantId,
    },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
    },
  });
  if (!plan) throw new Error("SUPPORT_PLAN_NOT_FOUND");
  const version = (plan.versions[0]?.version ?? 0) + 1;
  return prisma.$transaction(async (tx) => {
    if (plan.versions[0]) {
      await tx.supportPlanVersion.update({
        where: { id: plan.versions[0].id },
        data: { supersededAt: new Date() },
      });
    }
    const created = await tx.supportPlanVersion.create({
      data: {
        supportPlanId: plan.id,
        version,
        authorUserId: input.actorUserId,
        authorAuthority: input.authorAuthority,
        instructionsJson: input.instructions as Prisma.InputJsonValue,
        limitations: input.limitations,
        effectiveAt: input.effectiveAt,
        reviewAt: input.reviewAt,
      },
    });
    await tx.participantSupportPlan.update({
      where: { id: plan.id },
      data: { currentVersion: version, status: "active" },
    });
    return created;
  });
}
