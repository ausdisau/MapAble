import { afterEach, describe, expect, it } from "vitest";

import {
  AtContinuityDisabledError,
  AtContinuityInvariantError,
  assertAtContinuityEnabled,
  assertHumanApprovedNotification,
  assertSafeParticipantFacingCopy,
  isAtContinuityEnabled,
  registerEquipmentAsset,
} from "@/lib/at-continuity";

describe("AT Continuity Wave 1 scaffold", () => {
  const flag = "MAPABLE_AT_CONTINUITY_ENABLED";
  let previous: string | undefined;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env[flag];
    } else {
      process.env[flag] = previous;
    }
  });

  it("defaults the continuity flag to false", () => {
    previous = process.env[flag];
    delete process.env[flag];
    expect(isAtContinuityEnabled()).toBe(false);
    expect(() => assertAtContinuityEnabled()).toThrow(
      AtContinuityDisabledError,
    );
  });

  it("refuses writers when the flag is off", async () => {
    previous = process.env[flag];
    delete process.env[flag];
    await expect(
      registerEquipmentAsset(
        {
          participantUserId: "user_1",
          displayName: "Power wheelchair",
          category: "mobility",
          mobilityAidHint: "power_wheelchair",
        },
        "actor_1",
      ),
    ).rejects.toBeInstanceOf(AtContinuityDisabledError);
  });

  it("refuses clinical suitability and emergency dispatch claims", () => {
    expect(() =>
      assertSafeParticipantFacingCopy(
        "MapAble certifies this AT as clinically suitable",
      ),
    ).toThrow(AtContinuityInvariantError);
    expect(() =>
      assertSafeParticipantFacingCopy(
        "Use MapAble emergency dispatch instead of 000",
      ),
    ).toThrow(AtContinuityInvariantError);
  });

  it("requires human approval before notifications", () => {
    expect(() =>
      assertHumanApprovedNotification({ humanApproved: false }),
    ).toThrow(AtContinuityInvariantError);
    expect(() =>
      assertHumanApprovedNotification({ humanApproved: true }),
    ).not.toThrow();
  });
});
