import { afterEach, describe, expect, it } from "vitest";

import {
  buildCareOSActionEnvelope,
  hashCareOSPayload,
  validateCareOSActionPayload,
} from "@/intelligence/actions/action-envelope";
import {
  createCareOSActionToken,
  verifyCareOSActionToken,
} from "@/intelligence/actions/action-token";
import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import { analyseCareOSOperationalEvent } from "@/intelligence/continuity/event-engine";
import {
  careOSPreferenceKeySchema,
  upsertCareOSPreferenceSchema,
} from "@/intelligence/preferences/preference-service";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("CareOS action envelope", () => {
  it("hashes object payloads independently of key order", () => {
    expect(hashCareOSPayload({ b: 2, a: 1 })).toBe(
      hashCareOSPayload({ a: 1, b: 2 }),
    );
  });

  it("validates care and transport payloads through existing domain schemas", () => {
    expect(
      validateCareOSActionPayload("submit_care_request", {
        requestType: "appointment_support",
        title: "Support for physiotherapy",
        description: "Help before and during the appointment",
        linkedTransportRequired: true,
      }),
    ).toMatchObject({ requestType: "appointment_support" });

    expect(
      validateCareOSActionPayload("submit_transport_request", {
        pickupAddress: "1 Example Street",
        dropoffAddress: "2 Clinic Road",
        scheduledStart: "2026-08-01T01:00:00.000Z",
      }),
    ).toMatchObject({ pickupAddress: "1 Example Street" });
  });

  it("rejects incomplete consequential payloads", () => {
    expect(() =>
      validateCareOSActionPayload("submit_transport_request", {
        pickupAddress: "1 Example Street",
      }),
    ).toThrow();
  });

  it("signs and verifies a participant-bound short-lived token", () => {
    process.env.MAPABLE_AI_APPROVAL_SECRET = "a".repeat(64);
    const envelope = buildCareOSActionEnvelope({
      proposalId: "ddcc5ccd-d5dd-4d01-a0f9-08f01ba256bf",
      requestId: "request-1",
      participantId: "participant-1",
      actionType: "submit_care_request",
      payload: {
        requestType: "appointment_support",
        title: "Appointment support",
        description: "Support for an appointment",
      },
      informationToShare: ["appointment timing"],
    });
    const token = createCareOSActionToken(envelope);
    expect(verifyCareOSActionToken(token)).toEqual(envelope);
  });
});

describe("CareOS operational continuity", () => {
  it("routes a worker cancellation to urgent human coordination", () => {
    const result = analyseCareOSOperationalEvent({
      missionId: "ddcc5ccd-d5dd-4d01-a0f9-08f01ba256bf",
      participantId: "participant-1",
      eventType: "worker_cancelled",
      sourceModule: "care",
      summary: "Worker cancelled",
    });
    expect(result.severity).toBe("urgent");
    expect(result.humanReviewRequired).toBe(true);
    expect(result.assignedRole).toBe("support_coordinator");
    expect(result.participantApprovalRequired).toBe(true);
  });

  it("does not turn a preference change into an executable recovery action", () => {
    const result = analyseCareOSOperationalEvent({
      missionId: "ddcc5ccd-d5dd-4d01-a0f9-08f01ba256bf",
      participantId: "participant-1",
      eventType: "participant_preference_changed",
      sourceModule: "core",
      summary: "Pickup buffer changed",
    });
    expect(result.severity).toBe("information");
    expect(result.humanReviewRequired).toBe(false);
    expect(result.participantApprovalRequired).toBe(false);
  });
});

describe("CareOS participant preferences", () => {
  it("allows only inspectable preference keys", () => {
    expect(careOSPreferenceKeySchema.safeParse("preferred_contact_method").success).toBe(true);
    expect(careOSPreferenceKeySchema.safeParse("predicted_personality").success).toBe(false);
  });

  it("bounds preference values and optional expiry", () => {
    expect(
      upsertCareOSPreferenceSchema.safeParse({
        key: "preferred_pickup_buffer_minutes",
        value: 20,
        expiresAt: null,
      }).success,
    ).toBe(true);
    expect(
      upsertCareOSPreferenceSchema.safeParse({
        key: "preferred_pickup_buffer_minutes",
        value: 99999,
      }).success,
    ).toBe(false);
  });
});

describe("CareOS operational feature flags", () => {
  it("keeps persistence and event automation off by default", () => {
    delete process.env.MAPABLE_CAREOS_PERSISTENCE_ENABLED;
    delete process.env.MAPABLE_CAREOS_EVENT_AUTOMATION_ENABLED;
    const config = getMapAbleIntelligenceConfig();
    expect(config.careOSPersistenceEnabled).toBe(false);
    expect(config.careOSEventAutomationEnabled).toBe(false);
  });
});
