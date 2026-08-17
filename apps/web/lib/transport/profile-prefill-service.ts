import type { CurrentUser } from "@/lib/auth/current-user";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import {
  mobilityFromAccessibilityProfile,
  type MobilityRequirements,
} from "@/lib/transport/mobility-schema";

export type MobilityPrefillResult = {
  mobilityRequirements: MobilityRequirements;
  accessNotes?: string;
  fromProfile: boolean;
  profileShared: boolean;
};

export async function getMobilityPrefillForUser(
  user: CurrentUser
): Promise<MobilityPrefillResult> {
  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return {
      mobilityRequirements: {},
      fromProfile: false,
      profileShared: false,
    };
  }

  const mobilityRequirements = mobilityFromAccessibilityProfile({
    transportRequirements: profile.transportRequirements as Record<
      string,
      unknown
    > | null,
    mobilityNeeds: profile.mobilityNeeds as string[] | null,
  });

  const tr = (profile.transportRequirements ?? {}) as Record<string, unknown>;
  const pickupNotes =
    typeof tr.pickupNotes === "string" ? tr.pickupNotes : undefined;
  const dropoffNotes =
    typeof tr.dropoffNotes === "string" ? tr.dropoffNotes : undefined;
  const accessNotes = [pickupNotes, dropoffNotes].filter(Boolean).join("\n");

  return {
    mobilityRequirements,
    accessNotes: accessNotes || undefined,
    fromProfile: true,
    profileShared: true,
  };
}

/** Provider may read mobility prefill only with transport.accessibility_share consent */
export async function getMobilityPrefillForParticipant(
  actor: CurrentUser,
  participantId: string
): Promise<MobilityPrefillResult | null> {
  if (actor.id === participantId) {
    return getMobilityPrefillForUser(actor);
  }

  const allowed = await checkConsent({
    subjectUserId: participantId,
    scope: "transport.accessibility_share",
    grantedToUserId: actor.id,
  });
  if (!allowed) return null;

  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: participantId },
  });
  if (!profile) return null;

  return {
    mobilityRequirements: mobilityFromAccessibilityProfile({
      transportRequirements: profile.transportRequirements as Record<
        string,
        unknown
      > | null,
      mobilityNeeds: profile.mobilityNeeds as string[] | null,
    }),
    fromProfile: true,
    profileShared: true,
  };
}
