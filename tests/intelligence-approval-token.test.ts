import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createApprovalToken,
  verifyApprovalToken,
} from "@/intelligence/policies/approval-token";
import type { ApprovalPayload } from "@/intelligence/types";

const originalSecret = process.env.MAPABLE_AI_APPROVAL_SECRET;

function payload(overrides: Partial<ApprovalPayload> = {}): ApprovalPayload {
  return {
    version: 1,
    action: "create_transport_trip",
    requestId: "request-1",
    userId: "participant-1",
    optionId: "wav",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    trip: {
      pickupAddress: "1 Example Street, Sydney NSW",
      dropoffAddress: "2 Support Avenue, Sydney NSW",
      scheduledStart: new Date(Date.now() + 3_600_000).toISOString(),
      mobilityRequirements: { requiresWheelchairAccessible: true },
      prefillFromProfile: false,
    },
    ...overrides,
  };
}

describe("MapAble intelligence approval tokens", () => {
  beforeEach(() => {
    process.env.MAPABLE_AI_APPROVAL_SECRET = "test-only-secret-at-least-32-characters";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.MAPABLE_AI_APPROVAL_SECRET;
    } else {
      process.env.MAPABLE_AI_APPROVAL_SECRET = originalSecret;
    }
  });

  it("round-trips a signed participant approval", () => {
    const input = payload();
    expect(verifyApprovalToken(createApprovalToken(input))).toEqual(input);
  });

  it("rejects a modified token", () => {
    const token = createApprovalToken(payload());
    const modified = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;
    expect(() => verifyApprovalToken(modified)).toThrow("INVALID_APPROVAL_TOKEN");
  });

  it("rejects an expired approval", () => {
    const token = createApprovalToken(
      payload({ expiresAt: new Date(Date.now() - 1_000).toISOString() })
    );
    expect(() => verifyApprovalToken(token)).toThrow("EXPIRED_APPROVAL_TOKEN");
  });
});
