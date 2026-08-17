import type { Prisma } from "@prisma/client";

import { appendMissionEvent } from "@/lib/careos/canonical-mission-service";
import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import { prisma } from "@/lib/prisma";

/** Multi-scheme taxonomy for navigation briefs — never eligibility scores (O3). */
export const SCHEME_TAXONOMY = {
  ndis: {
    label: "NDIS",
    kind: "disability_scheme",
  },
  foundational_supports: {
    label: "Foundational Supports",
    kind: "foundational",
  },
  support_at_home: {
    label: "Support at Home",
    kind: "aged_care",
  },
  aged_care_other: {
    label: "Other aged care",
    kind: "aged_care",
  },
  grant: {
    label: "Grant / community",
    kind: "grant",
  },
  private_pay: {
    label: "Private / self-funded",
    kind: "private",
  },
  unknown: {
    label: "Unknown / not yet identified",
    kind: "unknown",
  },
} as const;

export type SchemeKey = keyof typeof SCHEME_TAXONOMY;

export const YPIRAC_CAUTION =
  "YPIRAC caution: younger people in residential aged care require careful, human-led pathway planning. CareOS does not determine eligibility or placement.";

function assertSchemeEnabled() {
  if (!careosOpportunitiesConfig.schemeCoordinationEnabled) {
    throw new Error("SCHEME_COORDINATION_DISABLED");
  }
}

export function resolveSchemeLabel(key: string) {
  if (key in SCHEME_TAXONOMY) {
    return SCHEME_TAXONOMY[key as SchemeKey];
  }
  return SCHEME_TAXONOMY.unknown;
}

export async function tagMissionSchemes(input: {
  missionId: string;
  participantId: string;
  schemeKeys: SchemeKey[];
  actorUserId: string;
  includeYpiracCaution?: boolean;
}) {
  assertSchemeEnabled();
  // Explicitly does not perform eligibility determination (prohibited).

  const mission = await prisma.careOSMission.findFirst({
    where: { id: input.missionId, participantId: input.participantId },
  });
  if (!mission) throw new Error("MISSION_NOT_FOUND");

  const schemes = input.schemeKeys.map((key) => ({
    key,
    ...resolveSchemeLabel(key),
  }));

  const prev =
    typeof mission.inputSummary === "object" && mission.inputSummary !== null
      ? (mission.inputSummary as Record<string, unknown>)
      : {};

  const inputSummary = {
    ...prev,
    schemeTags: schemes,
    eligibilityAutomated: false,
    ypiracCaution: (input.includeYpiracCaution === true
      ? YPIRAC_CAUTION
      : prev.ypiracCaution) as Prisma.InputJsonValue,
  } as Prisma.InputJsonValue;

  await prisma.careOSMission.update({
    where: { id: mission.id },
    data: { inputSummary },
  });

  await appendMissionEvent({
    missionId: mission.id,
    participantId: input.participantId,
    eventType: "scheme_tags_updated",
    sourceModule: "scheme-coordination",
    summary: `Scheme tags updated by human (no eligibility decision): ${input.schemeKeys.join(", ")}`,
    payloadJson: {
      schemeKeys: input.schemeKeys,
      actorUserId: input.actorUserId,
      eligibilityAutomated: false,
    },
    eventKey: `scheme-tags-${mission.id}-${Date.now()}`,
  });

  return { missionId: mission.id, schemeTags: schemes, eligibilityAutomated: false };
}

export function buildSchemeNavigationBrief(input: {
  from: SchemeKey;
  to: SchemeKey;
  notes?: string;
}) {
  assertSchemeEnabled();
  const from = resolveSchemeLabel(input.from);
  const to = resolveSchemeLabel(input.to);
  return {
    kind: "scheme_navigation_brief",
    from,
    to,
    notes: input.notes ?? null,
    eligibilityDecision: null,
    automated: false,
    ypiracCaution:
      to.kind === "aged_care" || from.kind === "aged_care"
        ? YPIRAC_CAUTION
        : null,
    humanAssessorRequired: true,
  };
}
