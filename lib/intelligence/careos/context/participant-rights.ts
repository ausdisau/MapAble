import { prisma } from "@/lib/prisma";

export type ParticipantRightsSnapshot = Readonly<{
  blockedWorkerIds: string[];
  blockedProviderIds: string[];
  requiredWorkerCredentials: string[];
  requiredCommunicationCapabilities: string[];
  requiredGenderPreference?: string;
  requiredLanguagePreference?: string;
  mobilityAidType?: string;
  mobilityAidDimensions?: string;
  requiredVehicleFeatures: string[];
  transferRequirements: string[];
  securementRequirements: string[];
  assistanceAnimalRequirements: string[];
  maximumWalkingDistance?: number;
  sensoryRequirements: string[];
  participantHardExclusions: string[];
}>;

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function buildParticipantRightsSnapshot(
  participantId: string
): Promise<ParticipantRightsSnapshot> {
  const [accessibility, preferences] = await Promise.all([
    prisma.accessibilityProfile.findUnique({ where: { userId: participantId } }),
    prisma.careParticipantPreference.findMany({
      where: { participantId },
      select: { preferenceKey: true, value: true },
    }),
  ]);
  const mobility = (accessibility?.mobilityNeeds ?? []) as unknown;
  const transport = (accessibility?.transportRequirements ?? {}) as Record<
    string,
    unknown
  >;
  const communication = (accessibility?.communicationPreferences ?? []) as unknown;
  const sensory = (accessibility?.sensoryPreferences ?? {}) as Record<string, unknown>;
  const preferenceValues = new Map(preferences.map((item) => [item.preferenceKey, item.value]));

  return Object.freeze({
    blockedWorkerIds: stringArray(preferenceValues.get("blocked_worker_ids")),
    blockedProviderIds: stringArray(preferenceValues.get("blocked_provider_ids")),
    requiredWorkerCredentials: stringArray(
      preferenceValues.get("required_worker_credentials")
    ),
    requiredCommunicationCapabilities: stringArray(communication),
    requiredGenderPreference: stringValue(
      preferenceValues.get("required_gender_preference")
    ),
    requiredLanguagePreference: stringValue(
      preferenceValues.get("required_language_preference")
    ),
    mobilityAidType: stringArray(mobility)[0],
    mobilityAidDimensions: stringValue(transport.mobilityAidDimensions),
    requiredVehicleFeatures: stringArray(transport.requiredVehicleFeatures),
    transferRequirements: stringArray(transport.transferRequirements),
    securementRequirements: stringArray(transport.securementRequirements),
    assistanceAnimalRequirements: stringArray(
      transport.assistanceAnimalRequirements
    ),
    maximumWalkingDistance:
      typeof transport.maximumWalkingDistance === "number"
        ? transport.maximumWalkingDistance
        : undefined,
    sensoryRequirements: stringArray(sensory.requirements),
    participantHardExclusions: stringArray(
      preferenceValues.get("hard_exclusions")
    ),
  });
}
