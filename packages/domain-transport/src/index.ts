import { z } from "zod";

export const transportReasonCodeSchema = z.enum([
  "DRIVER_INACTIVE",
  "VEHICLE_INACTIVE",
  "CREDENTIAL_MISSING",
  "CREDENTIAL_UNVERIFIED",
  "CREDENTIAL_EXPIRED",
  "ACCESSIBILITY_EVIDENCE_MISSING",
  "WHEELCHAIR_ACCESS_REQUIRED",
  "RAMP_OR_LIFT_REQUIRED",
  "LIFT_REQUIRED",
  "HOIST_REQUIRED",
  "ASSISTANCE_ANIMAL_SUPPORT_REQUIRED",
  "ROUTE_EVIDENCE_MISSING",
  "ROUTE_EVIDENCE_STALE",
  "PICKUP_WINDOW_INFEASIBLE",
  "PARTICIPANT_MISMATCH",
  "NO_FEASIBLE_OPTION",
  "HUMAN_RECOVERY_REVIEW_REQUIRED",
]);
export type TransportReasonCode = z.infer<typeof transportReasonCodeSchema>;

export const verificationSchema = z.object({
  kind: z.string().min(1),
  status: z.enum(["verified", "pending_review", "expired", "rejected", "not_provided"]),
  expiresAt: z.string().datetime().nullable(),
});

export const transportRequirementsSchema = z.object({
  requiresWheelchairAccessible: z.boolean().default(false),
  requiresRamp: z.boolean().default(false),
  requiresLift: z.boolean().default(false),
  requiresHoist: z.boolean().default(false),
  requiresAccessEquipment: z.boolean().default(false),
  assistanceAnimalPresent: z.boolean().default(false),
  maximumTransfers: z.number().int().min(0).optional(),
  requiredCommunicationCapabilities: z.array(z.string()).default([]),
  companionCount: z.number().int().min(0).default(0),
});
export type TransportRequirements = z.infer<typeof transportRequirementsSchema>;

export type TransportVehicleEvidence = {
  id: string;
  active: boolean;
  features?: {
    wheelchairAccessible: boolean;
    rampAvailable: boolean;
    liftAvailable: boolean;
    hoistAvailable: boolean;
    assistanceAnimalFriendly: boolean;
  } | null;
  verifications: z.infer<typeof verificationSchema>[];
};

export type TransportDriverEvidence = {
  id: string;
  active: boolean;
  communicationCapabilities: string[];
  verifications: z.infer<typeof verificationSchema>[];
};

const REQUIRED_DRIVER = ["licence", "screening", "training"];
const REQUIRED_VEHICLE = ["registration", "insurance", "inspection"];

function verificationReasons(
  records: z.infer<typeof verificationSchema>[],
  required: string[],
  now: Date
): TransportReasonCode[] {
  return required.flatMap((kind) => {
    const record = records.find((item) => item.kind === kind);
    if (!record) return ["CREDENTIAL_MISSING"];
    if (record.status !== "verified") return ["CREDENTIAL_UNVERIFIED"];
    if (record.expiresAt && new Date(record.expiresAt) <= now) return ["CREDENTIAL_EXPIRED"];
    return [];
  });
}

export function evaluateDriverEligibility(params: {
  driver: TransportDriverEvidence | null;
  requirements: TransportRequirements;
  now?: Date;
}): { eligible: boolean; reasonCodes: TransportReasonCode[] } {
  const now = params.now ?? new Date();
  if (!params.driver?.active) return { eligible: false, reasonCodes: ["DRIVER_INACTIVE"] };
  const reasons = verificationReasons(params.driver.verifications, REQUIRED_DRIVER, now);
  if (
    !params.requirements.requiredCommunicationCapabilities.every((capability) =>
      params.driver!.communicationCapabilities.includes(capability)
    )
  ) {
    reasons.push("ACCESSIBILITY_EVIDENCE_MISSING");
  }
  return { eligible: reasons.length === 0, reasonCodes: [...new Set(reasons)] };
}

export function evaluateVehicleEligibility(params: {
  vehicle: TransportVehicleEvidence | null;
  requirements: TransportRequirements;
  now?: Date;
}): { eligible: boolean; reasonCodes: TransportReasonCode[] } {
  const now = params.now ?? new Date();
  if (!params.vehicle?.active) return { eligible: false, reasonCodes: ["VEHICLE_INACTIVE"] };
  const reasons = verificationReasons(params.vehicle.verifications, REQUIRED_VEHICLE, now);
  const feature = params.vehicle.features;
  if (!feature && (
    params.requirements.requiresWheelchairAccessible ||
    params.requirements.requiresRamp ||
    params.requirements.requiresLift ||
    params.requirements.requiresHoist ||
    params.requirements.assistanceAnimalPresent
  )) reasons.push("ACCESSIBILITY_EVIDENCE_MISSING");
  if (params.requirements.requiresWheelchairAccessible && !feature?.wheelchairAccessible) reasons.push("WHEELCHAIR_ACCESS_REQUIRED");
  if (params.requirements.requiresRamp && !feature?.rampAvailable && !feature?.liftAvailable) reasons.push("RAMP_OR_LIFT_REQUIRED");
  if (params.requirements.requiresLift && !feature?.liftAvailable) reasons.push("LIFT_REQUIRED");
  if (params.requirements.requiresHoist && !feature?.hoistAvailable) reasons.push("HOIST_REQUIRED");
  if (params.requirements.assistanceAnimalPresent && !feature?.assistanceAnimalFriendly) reasons.push("ASSISTANCE_ANIMAL_SUPPORT_REQUIRED");
  if (params.requirements.requiresAccessEquipment) {
    reasons.push(...verificationReasons(params.vehicle.verifications, ["access_equipment"], now));
  }
  return { eligible: reasons.length === 0, reasonCodes: [...new Set(reasons)] };
}

export function evaluateRouteFeasibility(params: {
  participantId: string;
  requestedParticipantId: string;
  routeEvidenceAt?: string;
  pickupWindowStart: string;
  pickupWindowEnd?: string;
  routeDurationMinutes?: number;
  now?: Date;
  maxEvidenceAgeMinutes?: number;
}): { feasible: boolean; reasonCodes: TransportReasonCode[] } {
  const now = params.now ?? new Date();
  const maxAge = params.maxEvidenceAgeMinutes ?? 60;
  const reasons: TransportReasonCode[] = [];
  if (params.participantId !== params.requestedParticipantId) reasons.push("PARTICIPANT_MISMATCH");
  if (!params.routeEvidenceAt) reasons.push("ROUTE_EVIDENCE_MISSING");
  else if (now.getTime() - new Date(params.routeEvidenceAt).getTime() > maxAge * 60_000) reasons.push("ROUTE_EVIDENCE_STALE");
  const start = new Date(params.pickupWindowStart);
  const end = params.pickupWindowEnd ? new Date(params.pickupWindowEnd) : start;
  if (params.routeDurationMinutes && end.getTime() - start.getTime() < params.routeDurationMinutes * 60_000) {
    reasons.push("PICKUP_WINDOW_INFEASIBLE");
  }
  return { feasible: reasons.length === 0, reasonCodes: reasons };
}

export function proposeDisruptionRecovery(params: {
  disruption: "worker_cancellation" | "transport_cancellation" | "inaccessible_station" | "provider_withdrawal";
  hasCompliantAlternative: boolean;
}): {
  outcome: "PROPOSE_ALTERNATIVES" | "ESCALATE";
  reasonCodes: TransportReasonCode[];
  noOperationalChangeMade: true;
} {
  return params.hasCompliantAlternative
    ? { outcome: "PROPOSE_ALTERNATIVES", reasonCodes: [], noOperationalChangeMade: true }
    : {
        outcome: "ESCALATE",
        reasonCodes: ["NO_FEASIBLE_OPTION", "HUMAN_RECOVERY_REVIEW_REQUIRED"],
        noOperationalChangeMade: true,
      };
}

export function buildRecoveryReviewProposal(params: {
  participantId: string;
  tenantId: string;
  reasonCodes: TransportReasonCode[];
  hasCompliantAlternative: boolean;
}) {
  const recovery = proposeDisruptionRecovery({
    disruption: "transport_cancellation",
    hasCompliantAlternative: params.hasCompliantAlternative,
  });
  return {
    recovery,
    reviewCase:
      recovery.outcome === "ESCALATE"
        ? {
            schemaVersion: "1.0" as const,
            id: `review_${params.participantId}`,
            participantId: params.participantId,
            tenantId: params.tenantId,
            category: "recovery" as const,
            priority: "high" as const,
            reasonCodes: [...params.reasonCodes, ...recovery.reasonCodes],
            ownerId: null,
            dueAt: null,
            status: "open" as const,
          }
        : null,
    noOperationalChangeMade: true as const,
  };
}
