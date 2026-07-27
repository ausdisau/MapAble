import { appendMissionEvent } from "@/lib/careos/canonical-mission-service";
import {
  YPIRAC_CAUTION,
  type SchemeKey,
  buildSchemeNavigationBrief,
} from "@/lib/careos/opportunities/scheme-coordination";
import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import { prisma } from "@/lib/prisma";

function assertLifespanEnabled() {
  if (!careosOpportunitiesConfig.lifespanLiaisonEnabled) {
    throw new Error("LIFESPAN_LIAISON_DISABLED");
  }
}

/**
 * O10 — Support at Home / lifespan liaison.
 * Human-authored navigation briefs only — no SAH eligibility automation.
 */
export async function createLifespanLiaisonBrief(input: {
  participantId: string;
  missionId?: string;
  schemeFrom: SchemeKey;
  schemeTo: SchemeKey;
  summary: string;
  createdById: string;
  tenantId?: string;
  authorityDecisionId?: string;
}) {
  assertLifespanEnabled();
  // Navigation only — no Support at Home / NDIS eligibility automation.

  const navigation = buildSchemeNavigationBrief({
    from: input.schemeFrom,
    to: input.schemeTo,
  });

  const brief = await prisma.lifespanLiaisonBrief.create({
    data: {
      participantId: input.participantId,
      missionId: input.missionId,
      schemeFrom: input.schemeFrom,
      schemeTo: input.schemeTo,
      summary: input.summary,
      ypiracCautionShown: true,
      authorityDecisionId: input.authorityDecisionId,
      createdById: input.createdById,
      tenantId: input.tenantId,
    },
  });

  if (input.missionId) {
    await appendMissionEvent({
      missionId: input.missionId,
      participantId: input.participantId,
      eventType: "lifespan_liaison_brief_created",
      sourceModule: "lifespan-liaison",
      sourceEntityId: brief.id,
      summary: "Human lifespan / Support at Home liaison brief recorded",
      payloadJson: {
        briefId: brief.id,
        schemeFrom: input.schemeFrom,
        schemeTo: input.schemeTo,
        eligibilityAutomated: false,
        ypiracCaution: YPIRAC_CAUTION,
      },
      eventKey: `lifespan-brief-${brief.id}`,
    });
  }

  return {
    brief,
    navigation,
    ypiracCaution: YPIRAC_CAUTION,
    eligibilityAutomated: false,
    humanAssessorRequired: true,
  };
}

export async function listLifespanLiaisonBriefs(participantId: string) {
  assertLifespanEnabled();
  return prisma.lifespanLiaisonBrief.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
  });
}
