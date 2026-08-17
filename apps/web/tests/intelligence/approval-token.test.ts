import { describe, expect, it } from "vitest";

import {
  consumeSimulationActionToken,
  createSimulationActionToken,
} from "@/lib/intelligence/careos/approvals/proposal-token";

describe("simulation action authority tokens", () => {
  it("binds a token to exact participant, capability and payload", () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const payload = { optionId: "option-1", idempotencyKey: "key-1" };
    const token = createSimulationActionToken({
      participantId: "participant-1",
      actorId: "participant-1",
      actionId: "action-1",
      capability: "transport.journey-plan.propose",
      payload,
      policyVersion: "1.0.0",
    });
    expect(
      consumeSimulationActionToken({
        token,
        participantId: "participant-1",
        actorId: "participant-1",
        capability: "transport.journey-plan.propose",
        payload,
      }).actionId
    ).toBe("action-1");
    expect(() =>
      consumeSimulationActionToken({
        token,
        participantId: "participant-1",
        actorId: "participant-1",
        capability: "transport.journey-plan.propose",
        payload,
      })
    ).toThrow("INVALID_ACTION_TOKEN");
  });
});
