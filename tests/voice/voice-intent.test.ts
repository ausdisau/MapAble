import { describe, expect, it } from "vitest";

import {
  assertVoiceConfirmationProvided,
  buildVoiceConfirmation,
  parseVoiceIntent,
  requiresVoiceConfirmation,
} from "@/lib/intelligence/voice/voice-intent-service";

describe("voice intent parsing", () => {
  it("parses read-only check bookings intent", () => {
    const intent = parseVoiceIntent("check my bookings");
    expect(intent?.type).toBe("check_bookings");
    expect(intent?.consequence).toBe("read_only");
  });

  it("parses consequential report cancellation intent", () => {
    const intent = parseVoiceIntent("report a cancellation for booking abc123");
    expect(intent?.type).toBe("report_cancellation");
    expect(intent?.consequence).toBe("consequential");
    expect(intent?.parameters.bookingId).toBe("abc123");
  });

  it("parses open mission intent", () => {
    const intent = parseVoiceIntent("open my mission");
    expect(intent?.type).toBe("open_mission");
  });

  it("parses prepare message intent", () => {
    const intent = parseVoiceIntent("prepare a message to coordinator");
    expect(intent?.type).toBe("prepare_message");
  });

  it("parses review options intent", () => {
    const intent = parseVoiceIntent("what are my options");
    expect(intent?.type).toBe("review_options");
  });

  it("returns null for unrecognized transcript", () => {
    expect(parseVoiceIntent("hello world")).toBeNull();
  });
});

describe("voice confirmation gate", () => {
  it("requires confirmation for consequential intents", () => {
    const intent = parseVoiceIntent("report a cancellation")!;
    expect(requiresVoiceConfirmation(intent)).toBe(true);
  });

  it("does not require confirmation for read-only intents", () => {
    const intent = parseVoiceIntent("check my bookings")!;
    expect(requiresVoiceConfirmation(intent)).toBe(false);
  });

  it("blocks consequential action without confirmation", () => {
    const intent = parseVoiceIntent("prepare a message")!;
    expect(() => assertVoiceConfirmationProvided(intent, false)).toThrow(
      "VOICE_CONFIRMATION_REQUIRED",
    );
  });

  it("builds accessible confirmation payload", () => {
    const intent = parseVoiceIntent("prepare a message")!;
    const confirmation = buildVoiceConfirmation(intent);
    expect(confirmation.summary).toBeTruthy();
    expect(confirmation.confirmLabel).toBe("Confirm action");
    expect(confirmation.cancelLabel).toBe("Cancel");
  });
});
