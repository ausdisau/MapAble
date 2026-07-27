import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.fn();
const findUniqueOrThrow = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const create = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    supportProfile: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
      findUniqueOrThrow: (...args: unknown[]) => findUniqueOrThrow(...args),
      create: (...args: unknown[]) => create(...args),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/config/y1-wedge", () => ({
  y1WedgeConfig: { supportProfileEnabled: true },
}));

vi.mock("@/lib/consent/consent-service", () => ({
  checkConsent: vi.fn(async () => true),
}));

import {
  publishSupportProfile,
  saveSupportProfileDraft,
} from "@/lib/support/profile/support-profile-service";

describe("SupportProfile expectedVersion CAS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue({
      id: "sp1",
      participantId: "p1",
      version: 3,
      routinesJson: [],
      preferencesJson: [],
      boundariesJson: [],
      escalationJson: {},
      publishedAt: null,
    });
  });

  it("rejects draft save when expectedVersion mismatches", async () => {
    await expect(
      saveSupportProfileDraft({
        participantId: "p1",
        actorUserId: "p1",
        patch: {},
        expectedVersion: 2,
      }),
    ).rejects.toThrow(/VERSION_CONFLICT/);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects publish when CAS updateMany matches zero rows", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    await expect(
      publishSupportProfile({
        participantId: "p1",
        actorUserId: "p1",
        expectedVersion: 3,
      }),
    ).rejects.toThrow(/VERSION_CONFLICT/);
  });

  it("publishes when CAS matches", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    findUniqueOrThrow.mockResolvedValue({
      id: "sp1",
      participantId: "p1",
      version: 4,
      routinesJson: [],
      preferencesJson: [],
      boundariesJson: [],
      escalationJson: {},
      publishedAt: new Date(),
    });
    const result = await publishSupportProfile({
      participantId: "p1",
      actorUserId: "p1",
      expectedVersion: 3,
    });
    expect(result.version).toBe(4);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { participantId: "p1", version: 3 },
      }),
    );
  });
});
