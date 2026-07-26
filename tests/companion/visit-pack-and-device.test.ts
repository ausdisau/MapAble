import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetCompanionDevicesForTests,
  enrolCompanionDevice,
  isCompanionDeviceActive,
  revokeCompanionDevice,
} from "@/lib/companion/device-registry";
import { visitPackIntegrityHash } from "@/lib/companion/visit-pack-compile";
import { companionDeviceEnrolSchema } from "@/mobile-contracts/schemas/companion-device";
import { visitPackSchema } from "@/mobile-contracts/schemas/visit-pack";

vi.mock("@/lib/support/communication-passport/service", () => ({
  getCommunicationPassport: vi.fn(async () => ({
    participantId: "p1",
    version: 2,
    updatedAt: new Date().toISOString(),
    instructions: [
      {
        id: "instr_aac",
        mode: "aac",
        participantWording: "I use AAC",
        workerFacingWording: "Allow AAC time",
        required: true,
        sortOrder: 0,
      },
    ],
    disclosableFieldKeys: ["instructions.mode"],
  })),
}));

describe("Companion Visit Pack contracts", () => {
  it("validates redacted offline-bounded packs", () => {
    const pack = visitPackSchema.parse({
      packId: "00000000-0000-4000-8000-000000000001",
      participantId: "p1",
      passportVersion: 2,
      compiledAt: "2026-07-17T08:00:00.000Z",
      expiresAt: "2026-07-18T08:00:00.000Z",
      instructions: [
        {
          id: "instr_aac",
          mode: "aac",
          workerFacingWording: "Allow AAC time",
          required: true,
        },
      ],
      redacted: true,
      offlineBounded: true,
    });
    expect(visitPackIntegrityHash(pack)).toHaveLength(64);
    expect(
      visitPackSchema.safeParse({ ...pack, redacted: false }).success,
    ).toBe(false);
  });
});

describe("Companion device enrolment", () => {
  beforeEach(() => {
    __resetCompanionDevicesForTests();
  });

  it("enrols and revokes lost devices", () => {
    const parsed = companionDeviceEnrolSchema.parse({
      deviceId: "device-abc-123456",
      platform: "ios",
      appVersion: "0.1.0",
    });
    enrolCompanionDevice({ ...parsed, userId: "u1" });
    expect(isCompanionDeviceActive("u1", parsed.deviceId)).toBe(true);
    revokeCompanionDevice({
      userId: "u1",
      deviceId: parsed.deviceId,
      reason: "lost",
    });
    expect(isCompanionDeviceActive("u1", parsed.deviceId)).toBe(false);
  });
});
