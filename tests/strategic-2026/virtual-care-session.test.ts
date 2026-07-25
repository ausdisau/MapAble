import { beforeEach, describe, expect, it, vi } from "vitest";

const createAudit = vi.fn();
const createRoomForAppointment = vi.fn();
let hubEnabled = true;

vi.mock("@/lib/config/strategic-2026", () => ({
  isVirtualCareHubEnabled: () => hubEnabled,
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: (...args: unknown[]) => createAudit(...args),
}));

vi.mock("@/lib/telehealth/video/video-room-service", () => ({
  createVideoRoomForAppointment: (...args: unknown[]) =>
    createRoomForAppointment(...args),
}));

vi.mock("@/lib/telehealth/video/video-adapter", () => ({
  getVideoProvider: () => "mock" as const,
}));

import { createClinicalSession } from "@/lib/telehealth/clinical-session";

describe("createClinicalSession", () => {
  beforeEach(() => {
    hubEnabled = true;
    createAudit.mockReset();
    createRoomForAppointment.mockReset();
    createAudit.mockResolvedValue(undefined);
  });

  it("creates adapter scaffold session without appointment FK", async () => {
    const result = await createClinicalSession({
      participantId: "p1",
      supportItemCode: "15_037_0117_1_3",
      actorUserId: "u1",
    });

    expect(result.mode).toBe("scaffold");
    expect(result.supportItemCode).toBe("15_037_0117_1_3");
    expect(result.joinUrl).toMatch(/\/telehealth\/mock\//);
    expect(result.sessionId).toBeTruthy();
    expect(createRoomForAppointment).not.toHaveBeenCalled();
    expect(createAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "telehealth.clinical_session.created",
        participantId: "p1",
      })
    );
  });

  it("falls back to adapter when appointment room create fails", async () => {
    createRoomForAppointment.mockRejectedValue(new Error("FK missing"));

    const result = await createClinicalSession({
      participantId: "p1",
      supportItemCode: "15_005_0117_1_3",
      actorUserId: "u1",
      appointmentId: "appt-missing",
    });

    expect(result.mode).toBe("scaffold");
    expect(result.joinUrl).toMatch(/\/telehealth\/mock\//);
  });

  it("throws when hub flag is off", async () => {
    hubEnabled = false;
    await expect(
      createClinicalSession({
        participantId: "p1",
        supportItemCode: "15_037_0117_1_3",
        actorUserId: "u1",
      })
    ).rejects.toThrow("VIRTUAL_CARE_HUB_DISABLED");
  });
});

describe("strategic-2026 flag helpers", () => {
  it("default off without env true", async () => {
    vi.resetModules();
    vi.doUnmock("@/lib/config/strategic-2026");
    const mod = await import("@/lib/config/strategic-2026");
    expect(mod.isPlatformShieldEnabled()).toBe(false);
    expect(mod.isFoundationalSupportsEnabled()).toBe(false);
    expect(mod.isPaceQuarterlyPacingEnabled()).toBe(false);
    expect(mod.isBehavioralRiskEnabled()).toBe(false);
    expect(mod.isVirtualCareHubEnabled()).toBe(false);
  });
});
