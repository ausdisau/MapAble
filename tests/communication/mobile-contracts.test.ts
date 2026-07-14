import { describe, expect, it } from "vitest";

import {
  communicationPassportSummarySchema,
  offlineQueuedActionSchema,
  pushPreferenceSchema,
  voiceIntentSchema,
} from "@/mobile-contracts/schemas/mobile-communication";

describe("mobile-communication contracts", () => {
  it("validates offline queued action schema", () => {
    const parsed = offlineQueuedActionSchema.parse({
      id: "q1",
      type: "draft_message",
      payload: { text: "hello" },
      status: "queued",
      createdAt: "2026-07-14T00:00:00.000Z",
      updatedAt: "2026-07-14T00:00:00.000Z",
      idempotencyKey: "key-1",
    });
    expect(parsed.type).toBe("draft_message");
  });

  it("validates voice intent schema", () => {
    const parsed = voiceIntentSchema.parse({
      type: "check_bookings",
      consequence: "read_only",
      parameters: {},
      rawTranscript: "check my bookings",
      confidence: 0.9,
      parsedAt: "2026-07-14T00:00:00.000Z",
    });
    expect(parsed.type).toBe("check_bookings");
  });

  it("validates communication passport summary schema", () => {
    const parsed = communicationPassportSummarySchema.parse({
      id: "p1",
      title: "My passport",
      status: "draft",
    });
    expect(parsed.status).toBe("draft");
  });

  it("validates push preference schema", () => {
    const parsed = pushPreferenceSchema.parse({
      channel: "message",
      enabled: true,
    });
    expect(parsed.channel).toBe("message");
  });
});
