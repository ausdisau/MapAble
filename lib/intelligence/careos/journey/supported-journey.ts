import { z } from "zod";

export const supportedJourneyRequestSchema = z.object({
  tenantId: z.string().min(1),
  participantId: z.string().min(1),
  appointment: z.object({
    id: z.string().min(1),
    startsAt: z.string().datetime(),
    timezone: z.string().min(1),
    destination: z.string().min(1),
  }),
  requirements: z.object({
    serviceType: z.string().min(1),
    workerCredentials: z.array(z.string()).default([]),
    communicationSupport: z.array(z.string()).default([]),
    wheelchairAccessible: z.boolean().default(false),
    requiresRamp: z.boolean().default(false),
    assistanceAnimal: z.boolean().default(false),
    minimumConnectionMinutes: z.number().int().min(0).default(15),
  }),
  excludedWorkerIds: z.array(z.string()).default([]),
  excludedProviderIds: z.array(z.string()).default([]),
  idempotencyKey: z.string().uuid(),
});

export type JourneyOption = {
  id: string;
  workerId: string;
  vehicleId: string;
  providerId: string;
  pickupAt: string;
  arrivalAt: string;
  supportStartAt: string;
  supportFinishAt: string;
  verifiedEvidence: string[];
  missingEvidence: string[];
  preferencesSatisfied: string[];
  tradeOffs: string[];
  uncertainty: string[];
  reasonCodes: string[];
  feasible: boolean;
  simulatedCost: { currency: "AUD"; minorUnits: number };
};

export type SimulationReservation = {
  id: string;
  idempotencyKey: string;
  optionId: string;
  status: "simulated_confirmed";
  noOperationalChangeMade: true;
};

const fixtures = [
  {
    workerId: "syn_worker_river",
    vehicleId: "syn_vehicle_accessible",
    providerId: "syn_provider_north",
    credentials: ["first_aid", "wwcc"],
    communication: ["plain_language", "aac"],
    wheelchairAccessible: true,
    ramp: true,
    assistanceAnimal: true,
  },
  {
    workerId: "syn_worker_sky",
    vehicleId: "syn_vehicle_accessible_2",
    providerId: "syn_provider_east",
    credentials: ["first_aid", "wwcc"],
    communication: ["plain_language"],
    wheelchairAccessible: true,
    ramp: true,
    assistanceAnimal: false,
  },
] as const;

export function planSupportedJourney(input: z.infer<typeof supportedJourneyRequestSchema>) {
  const request = supportedJourneyRequestSchema.parse(input);
  const appointment = new Date(request.appointment.startsAt);
  const options: JourneyOption[] = fixtures.flatMap((candidate) => {
    const reasons = [
      ...(request.excludedWorkerIds.includes(candidate.workerId) ? ["PARTICIPANT_EXCLUDED_WORKER"] : []),
      ...(request.excludedProviderIds.includes(candidate.providerId) ? ["PARTICIPANT_EXCLUDED_PROVIDER"] : []),
      ...(!request.requirements.workerCredentials.every((credential) => (candidate.credentials as readonly string[]).includes(credential)) ? ["WORKER_CREDENTIAL_MISSING"] : []),
      ...(!request.requirements.communicationSupport.every((support) => (candidate.communication as readonly string[]).includes(support)) ? ["COMMUNICATION_SUPPORT_MISSING"] : []),
      ...(request.requirements.wheelchairAccessible && !candidate.wheelchairAccessible ? ["WHEELCHAIR_ACCESS_REQUIRED"] : []),
      ...(request.requirements.requiresRamp && !candidate.ramp ? ["RAMP_REQUIRED"] : []),
      ...(request.requirements.assistanceAnimal && !candidate.assistanceAnimal ? ["ASSISTANCE_ANIMAL_SUPPORT_REQUIRED"] : []),
    ];
    if (reasons.length > 0) return [];
    const arrivalAt = new Date(appointment.getTime() - request.requirements.minimumConnectionMinutes * 60_000);
    const pickupAt = new Date(arrivalAt.getTime() - 45 * 60_000);
    const supportStartAt = new Date(pickupAt.getTime() - 15 * 60_000);
    return [{
      id: `journey_${candidate.workerId}_${candidate.vehicleId}`,
      workerId: candidate.workerId,
      vehicleId: candidate.vehicleId,
      providerId: candidate.providerId,
      pickupAt: pickupAt.toISOString(),
      arrivalAt: arrivalAt.toISOString(),
      supportStartAt: supportStartAt.toISOString(),
      supportFinishAt: new Date(appointment.getTime() + 90 * 60_000).toISOString(),
      verifiedEvidence: ["worker_credentials", "vehicle_accessibility"],
      missingEvidence: [],
      preferencesSatisfied: ["accessible_transport"],
      tradeOffs: candidate.providerId === "syn_provider_east" ? ["No assistance-animal support"] : ["AAC communication support available"],
      uncertainty: ["Synthetic availability only; no booking has been made."],
      reasonCodes: ["ELIGIBLE_SYNTHETIC_OPTION"],
      feasible: true,
      simulatedCost: { currency: "AUD", minorUnits: 12500 },
    }];
  });
  return {
    options,
    humanReviewRequired: options.length === 0,
    reasonCodes: options.length === 0 ? ["NO_SAFE_SUPPORTED_JOURNEY_OPTION"] : [],
    noOperationalChangeMade: true as const,
  };
}

export function simulateJourneyConfirmation(params: {
  optionId: string;
  idempotencyKey: string;
}): SimulationReservation {
  return {
    id: `reservation_${params.idempotencyKey}`,
    idempotencyKey: params.idempotencyKey,
    optionId: params.optionId,
    status: "simulated_confirmed",
    noOperationalChangeMade: true,
  };
}
