import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSession = vi.fn();
const createAuditEvent = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const create = vi.fn();

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSession(...args),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: (...args: unknown[]) => createAuditEvent(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessibilityProfile: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
      create: (...args: unknown[]) => create(...args),
    },
  },
}));

import { PATCH } from "@/app/api/accessibility-profile/digital-preferences/route";
import {
  applyPreset,
  DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
} from "@/lib/accessibility/ui-preferences";

describe("PATCH /api/accessibility-profile/digital-preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSession.mockResolvedValue({
      id: "user-1",
      primaryRole: "participant",
    });
  });

  it("merges UI prefs and preserves unrelated profile fields", async () => {
    findUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      mobilityNeeds: ["walker"],
      sensoryPreferences: { lightSensitivity: true },
      cognitivePreferences: { plainLanguage: true },
      shareWithProviders: { orgA: true },
      digitalPreferences: {
        screenReaderUser: true,
        voiceControlPreferred: true,
      },
    });

    const ui = applyPreset(
      DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
      "reduce-motion",
    );

    update.mockImplementation(async ({ data }: { data: { digitalPreferences: unknown } }) => ({
      id: "profile-1",
      digitalPreferences: data.digitalPreferences,
    }));

    const res = await PATCH(
      new Request("http://localhost/api/accessibility-profile/digital-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ui }),
      }),
    );

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledTimes(1);
    const updateArg = update.mock.calls[0]?.[0] as {
      data: { digitalPreferences: Record<string, unknown> };
    };
    expect(updateArg.data.digitalPreferences.screenReaderUser).toBe(true);
    expect(updateArg.data.digitalPreferences.voiceControlPreferred).toBe(true);
    expect(updateArg.data.digitalPreferences.reducedMotion).toBe(true);
    expect(
      (updateArg.data.digitalPreferences.ui as { reduceMotion: boolean })
        .reduceMotion,
    ).toBe(true);
    // Route must only touch digitalPreferences — not wipe sensory/cognitive/share.
    expect(updateArg.data).toEqual({
      digitalPreferences: expect.any(Object),
    });
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "accessibility.updated",
        entityId: "profile-1",
      }),
    );
  });

  it("rejects unauthenticated callers", async () => {
    requireApiSession.mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );
    const res = await PATCH(
      new Request("http://localhost/api/accessibility-profile/digital-preferences", {
        method: "PATCH",
        body: JSON.stringify({
          ui: DEFAULT_ACCESSIBILITY_UI_PREFERENCES,
        }),
      }),
    );
    expect(res.status).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });
});
