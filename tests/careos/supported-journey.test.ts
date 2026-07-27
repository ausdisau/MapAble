import { describe, expect, it } from "vitest";

import {
  planSupportedJourney,
  simulateJourneyConfirmation,
} from "@/lib/intelligence/careos/journey/supported-journey";

const request = {
  tenantId: "synthetic-tenant",
  participantId: "synthetic-participant",
  appointment: {
    id: "appointment-1",
    startsAt: "2026-07-20T10:00:00.000Z",
    timezone: "Australia/Sydney",
    destination: "Synthetic physiotherapy",
  },
  requirements: {
    serviceType: "personal_care",
    workerCredentials: ["first_aid", "wwcc"],
    communicationSupport: ["plain_language"],
    wheelchairAccessible: true,
    requiresRamp: true,
    assistanceAnimal: false,
    minimumConnectionMinutes: 15,
  },
  excludedWorkerIds: [],
  excludedProviderIds: [],
  idempotencyKey: "e6e9ed94-c727-4512-a1d6-4d35c2d9c174",
};

describe("supported journey simulation", () => {
  it("returns several evidence-based options without operational change", () => {
    const journey = planSupportedJourney(request);
    expect(journey.options).toHaveLength(2);
    expect(journey.noOperationalChangeMade).toBe(true);
    expect(journey.options.every((option) => option.feasible)).toBe(true);
  });

  it("excludes participant-blocked workers before ranking", () => {
    const journey = planSupportedJourney({ ...request, excludedWorkerIds: ["syn_worker_river"] });
    expect(journey.options.map((option) => option.workerId)).not.toContain("syn_worker_river");
  });

  it("returns a simulated idempotent reservation only", () => {
    const reservation = simulateJourneyConfirmation({
      optionId: "journey_syn_worker_river_syn_vehicle_accessible",
      idempotencyKey: request.idempotencyKey,
    });
    expect(reservation.idempotencyKey).toBe(request.idempotencyKey);
    expect(reservation.noOperationalChangeMade).toBe(true);
  });
});
