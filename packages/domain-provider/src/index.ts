import { z } from "zod";

export const providerEvidenceSchema = z.object({
  serviceType: z.string().min(1),
  geography: z.string().optional(),
  capability: z.string().min(1),
  communicationSupport: z.array(z.string()).default([]),
  mobilityFeatures: z.array(z.string()).default([]),
  assistanceAnimalSupported: z.boolean().default(false),
  verificationStatus: z.enum(["verified", "self_declared", "unverified", "disputed", "revoked"]),
  effectiveAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  permittedPurposes: z.array(z.string()).default([]),
});

export const capacitySnapshotSchema = z.object({
  totalCapacity: z.number().int().nonnegative(),
  bookedCapacity: z.number().int().nonnegative(),
  date: z.string().datetime(),
  serviceType: z.string().min(1),
});

export function evaluateProviderCapability(params: {
  evidence: z.infer<typeof providerEvidenceSchema>[];
  requiredCapabilities: string[];
  requiredMobilityFeatures: string[];
  requiresAssistanceAnimalSupport: boolean;
  purpose: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const eligible = params.requiredCapabilities.every((capability) =>
    params.evidence.some((evidence) =>
      evidence.capability === capability &&
      evidence.verificationStatus === "verified" &&
      new Date(evidence.effectiveAt) <= now &&
      (!evidence.expiresAt || new Date(evidence.expiresAt) > now) &&
      !evidence.revokedAt &&
      evidence.permittedPurposes.includes(params.purpose)
    )
  );
  const mobilityEligible = params.requiredMobilityFeatures.every((feature) =>
    params.evidence.some((evidence) =>
      evidence.verificationStatus === "verified" &&
      evidence.mobilityFeatures.includes(feature) &&
      (!evidence.expiresAt || new Date(evidence.expiresAt) > now) &&
      !evidence.revokedAt
    )
  );
  const animalEligible = !params.requiresAssistanceAnimalSupport || params.evidence.some(
    (evidence) => evidence.verificationStatus === "verified" && evidence.assistanceAnimalSupported
  );
  return {
    eligible: eligible && mobilityEligible && animalEligible,
    reasonCodes: [
      ...(!eligible ? ["PROVIDER_CAPABILITY_EVIDENCE_MISSING"] : []),
      ...(!mobilityEligible ? ["PROVIDER_ACCESSIBILITY_EVIDENCE_MISSING"] : []),
      ...(!animalEligible ? ["ASSISTANCE_ANIMAL_EVIDENCE_MISSING"] : []),
    ],
  };
}

export function evaluateCapacity(snapshot: z.infer<typeof capacitySnapshotSchema>) {
  const parsed = capacitySnapshotSchema.parse(snapshot);
  return {
    available: Math.max(0, parsed.totalCapacity - parsed.bookedCapacity),
    hasCapacity: parsed.bookedCapacity < parsed.totalCapacity,
  };
}

export type ParticipantControlledCandidate = {
  id: string;
  providerId: string;
  verified: boolean;
  capabilities: string[];
  communicationSupport: string[];
};

export function filterParticipantControlledCandidates(params: {
  candidates: ParticipantControlledCandidate[];
  blockedWorkerIds: string[];
  blockedProviderIds: string[];
  requiredCapabilities: string[];
  requiredCommunicationSupport: string[];
}) {
  return params.candidates.filter(
    (candidate) =>
      candidate.verified &&
      !params.blockedWorkerIds.includes(candidate.id) &&
      !params.blockedProviderIds.includes(candidate.providerId) &&
      params.requiredCapabilities.every((capability) =>
        candidate.capabilities.includes(capability)
      ) &&
      params.requiredCommunicationSupport.every((capability) =>
        candidate.communicationSupport.includes(capability)
      )
  );
}
